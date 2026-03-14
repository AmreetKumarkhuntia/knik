import time
from collections import defaultdict, deque
from typing import Any

from imports import printer as logger
from lib.services.scheduler.db_client import SchedulerDB
from lib.services.scheduler.models import Workflow
from lib.services.scheduler.nodes import (
    AIExecutionNode,
    BaseNode,
    ConditionalBranchNode,
    FlowMergeNode,
    FunctionExecutionNode,
)


class WorkflowEngine:
    """Executes a parsed Workflow definition resolving its nodes topologically."""

    def __init__(self):
        self._execution_trace = []

    async def execute_workflow(self, workflow: Workflow, inputs: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        Execute a Workflow's Definition DAG. Resolves node dependencies and executes iteratively.
        """
        logger.info(f"Starting execution for Workflow: {workflow.id}")
        inputs = inputs or {}

        execution_id = await SchedulerDB.create_execution(workflow.id, inputs)
        if not execution_id:
            raise RuntimeError("Failed to create execution record in the database")

        workflow_start = time.perf_counter()

        try:
            nodes, adj_list, in_degree = self._parse_dag(workflow.definition)

            if not self._is_acyclic(nodes, in_degree.copy(), adj_list):
                raise ValueError("Workflow DAG contains cycles or is invalid.")

            node_outputs: dict[str, dict[str, Any]] = {}
            context = {"input": inputs}

            queue = deque([node_id for node_id in nodes if in_degree[node_id] == 0])

            while queue:
                curr_id = queue.popleft()
                node = nodes[curr_id]

                # Find direct predecessor nodes
                predecessor_ids = [from_id for from_id, targets in adj_list.items() if curr_id in targets]

                # Filter context to include only initial input and direct predecessors
                node_inputs = {
                    "input": context.get("input"),
                    **{nid: context[nid] for nid in predecessor_ids if nid in context},
                }

                try:
                    logger.debug(f"Executing node {curr_id}")

                    node_start = time.perf_counter()
                    output = await node.execute(node_inputs)
                    node_duration_ms = int((time.perf_counter() - node_start) * 1000)

                    node_outputs[curr_id] = output
                    context[curr_id] = output

                    await SchedulerDB.log_node_execution(
                        execution_id=execution_id,
                        node_id=curr_id,
                        node_type=node.__class__.__name__,
                        status="success",
                        inputs=node_inputs,
                        outputs=output,
                        duration_ms=node_duration_ms,
                    )

                    next_nodes = adj_list[curr_id]
                    for next_id in next_nodes:
                        if isinstance(node, ConditionalBranchNode):
                            edge_con = self._get_edge_condition(workflow.definition, curr_id, next_id)
                            res_str = "true" if output.get("result") else "false"
                            if edge_con and edge_con != res_str:
                                continue

                        in_degree[next_id] -= 1
                        if in_degree[next_id] == 0:
                            queue.append(next_id)

                except Exception as e:
                    node_duration_ms = int((time.perf_counter() - node_start) * 1000)
                    logger.error(f"Node execution failed: {curr_id} - {e}")
                    await SchedulerDB.log_node_execution(
                        execution_id=execution_id,
                        node_id=curr_id,
                        node_type=node.__class__.__name__,
                        status="failed",
                        inputs=node_inputs,
                        error_message=str(e),
                        duration_ms=node_duration_ms,
                    )
                    raise e

            await SchedulerDB.complete_execution(
                execution_id,
                status="success",
                outputs=node_outputs,
                duration_ms=int((time.perf_counter() - workflow_start) * 1000),
            )
            return node_outputs

        except Exception as e:
            await SchedulerDB.complete_execution(
                execution_id,
                status="failed",
                error_message=str(e),
                duration_ms=int((time.perf_counter() - workflow_start) * 1000),
            )
            raise

    def _get_edge_condition(self, definition: dict, from_id: str, to_id: str) -> str | None:
        """Fetch condition for specific edge to support branch nodes."""
        for edge in definition.get("connections", []):
            if edge.get("from_id") == from_id and edge.get("to_id") == to_id:
                return edge.get("condition")
        return None

    def _parse_dag(
        self, definition: dict[str, Any]
    ) -> tuple[dict[str, BaseNode], dict[str, list[str]], dict[str, int]]:
        """Parses the workflow definition extracting Nodes, Adjacency List, and In Degrees."""
        nodes: dict[str, BaseNode] = {}
        for n_id, n_data in definition.get("nodes", {}).items():
            nodes[n_id] = self._instantiate_node(n_id, n_data)

        adj_list: dict[str, list[str]] = defaultdict(list)
        in_degree: dict[str, int] = dict.fromkeys(nodes, 0)

        for conn in definition.get("connections", []):
            from_id = conn["from_id"]
            to_id = conn["to_id"]
            adj_list[from_id].append(to_id)
            in_degree[to_id] += 1

        return nodes, adj_list, in_degree

    def _is_acyclic(self, nodes: dict, in_degree: dict[str, int], adj_list: dict[str, list[str]]) -> bool:
        """Check for cycles via Kahn's algorithm."""
        queue = deque([n for n in nodes if in_degree[n] == 0])
        count = 0

        while queue:
            curr = queue.popleft()
            count += 1
            for child in adj_list[curr]:
                in_degree[child] -= 1
                if in_degree[child] == 0:
                    queue.append(child)

        return count == len(nodes)

    def _instantiate_node(self, node_id: str, data: dict[str, Any]) -> BaseNode:
        """Map generic node string dictionary schema back to live classes."""
        node_type = data.get("type")

        if node_type == "FunctionExecutionNode":
            return FunctionExecutionNode(
                node_id=node_id, function_name=data.get("function"), params=data.get("params"), code=data.get("code")
            )
        elif node_type == "ConditionalBranchNode":
            return ConditionalBranchNode(node_id=node_id, condition=data.get("condition", ""))
        elif node_type == "FlowMergeNode":
            return FlowMergeNode(node_id=node_id, merge_strategy=data.get("merge_strategy", "concat"))
        elif node_type == "AIExecutionNode":
            ai_node = AIExecutionNode(
                node_id=node_id,
                prompt=data.get("prompt", ""),
                model=data.get("model", "gemini-3.0-flash"),
                provider=data.get("provider", "vertex"),
                use_tools=data.get("use_tools", True),
            )
            return ai_node
        else:
            raise ValueError(f"Unknown node type map {node_type} for node {node_id}")
