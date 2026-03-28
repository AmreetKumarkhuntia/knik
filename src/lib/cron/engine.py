"""Workflow execution engine with DAG-based parallel processing."""

import asyncio
import copy
import time
from collections import defaultdict
from typing import Any

from imports import printer as logger
from lib.cron.models import Workflow
from lib.cron.nodes import (
    AIExecutionNode,
    BaseNode,
    ConditionalBranchNode,
    FlowMergeNode,
    FunctionExecutionNode,
)
from lib.cron.validation import VALID_NODE_TYPES, validate_workflow_definition
from lib.services.scheduler.db_client import SchedulerDB


class WorkflowEngine:
    """Executes a parsed Workflow definition resolving its nodes topologically."""

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
            validation_result = validate_workflow_definition(workflow.definition)
            if not validation_result["valid"]:
                raise ValueError(f"Invalid workflow definition: {validation_result['message']}")

            nodes, adj_list, reverse_adj, in_degree = self._parse_dag(workflow.definition)

            node_outputs: dict[str, dict[str, Any]] = {}
            context: dict[str, Any] = {"input": inputs}

            # Track which nodes are pruned by conditional branches so that
            # downstream nodes (e.g. FlowMergeNode) can still become ready.
            pruned_edges: set[tuple[str, str]] = set()

            ready = [node_id for node_id in nodes if in_degree[node_id] == 0]

            # Level-based parallel execution: at each iteration, run all
            # currently-ready (in-degree == 0) nodes concurrently via
            # asyncio.gather(), then propagate outputs and enqueue the
            # next wave of unblocked nodes.
            while ready:
                logger.info(f"Executing {len(ready)} node(s) in parallel: {ready}")

                level_inputs: dict[str, dict[str, Any]] = {}
                for curr_id in ready:
                    predecessor_ids = reverse_adj.get(curr_id, [])
                    level_inputs[curr_id] = copy.deepcopy(
                        {
                            "input": context.get("input"),
                            **{nid: context[nid] for nid in predecessor_ids if nid in context},
                        }
                    )

                async def _execute_single(
                    nid: str,
                    _level_inputs: dict[str, dict[str, Any]] = level_inputs,
                ) -> tuple[str, dict[str, Any]]:
                    """Execute one node and return (node_id, output). Logs to DB."""
                    node = nodes[nid]
                    n_inputs = _level_inputs[nid]
                    node_start = time.perf_counter()
                    try:
                        logger.debug(f"[{nid}] Executing node")
                        output = await node.execute(n_inputs)
                        node_duration_ms = int((time.perf_counter() - node_start) * 1000)

                        await SchedulerDB.log_node_execution(
                            execution_id=execution_id,
                            node_id=nid,
                            node_type=node.__class__.__name__,
                            status="success",
                            inputs=n_inputs,
                            outputs=output,
                            duration_ms=node_duration_ms,
                        )
                        return nid, output

                    except asyncio.CancelledError:
                        # Never log cancellation as a node failure — re-raise cleanly.
                        raise

                    except Exception as e:
                        node_duration_ms = int((time.perf_counter() - node_start) * 1000)
                        logger.error(f"[{nid}] Node execution failed: {e}")
                        try:
                            await SchedulerDB.log_node_execution(
                                execution_id=execution_id,
                                node_id=nid,
                                node_type=node.__class__.__name__,
                                status="failed",
                                inputs=n_inputs,
                                error_message=str(e),
                                duration_ms=node_duration_ms,
                            )
                        except Exception:
                            logger.error(f"[{nid}] Failed to log node failure to DB")
                        raise

                # Use return_exceptions=True so all nodes complete and get
                # logged, even if some fail.  We inspect results afterward.
                raw_results = await asyncio.gather(
                    *[_execute_single(nid) for nid in ready],
                    return_exceptions=True,
                )

                results: list[tuple[str, dict[str, Any]]] = []
                errors: list[tuple[str, BaseException]] = []
                for nid, res in zip(ready, raw_results, strict=False):
                    if isinstance(res, BaseException):
                        errors.append((nid, res))
                    else:
                        results.append(res)

                # If any node raised, abort the workflow after collecting all
                # results so every node's outcome is logged to the DB.
                if errors:
                    failed_ids = [nid for nid, _ in errors]
                    first_err = errors[0][1]
                    raise RuntimeError(f"Node(s) failed: {', '.join(failed_ids)}") from first_err

                next_ready: list[str] = []
                for nid, output in results:
                    node = nodes[nid]
                    node_outputs[nid] = output
                    context[nid] = output

                    for next_id in adj_list[nid]:
                        if isinstance(node, ConditionalBranchNode):
                            edge_con = self._get_edge_condition(workflow.definition, nid, next_id)
                            res_str = "true" if output.get("result") else "false"
                            if edge_con and edge_con != res_str:
                                # This edge is not taken.  Decrement in-degree
                                # anyway so downstream merge nodes can still
                                # fire, and propagate the prune transitively.
                                pruned_edges.add((nid, next_id))
                                in_degree[next_id] -= 1
                                if in_degree[next_id] == 0:
                                    # The node became ready but ALL its live
                                    # predecessors were pruned — propagate the
                                    # prune instead of executing it.
                                    if self._all_predecessors_pruned(next_id, reverse_adj, pruned_edges, context):
                                        self._propagate_prune(
                                            next_id,
                                            nodes,
                                            adj_list,
                                            in_degree,
                                            pruned_edges,
                                            next_ready,
                                            reverse_adj,
                                            context,
                                        )
                                    else:
                                        next_ready.append(next_id)
                                continue

                        in_degree[next_id] -= 1
                        if in_degree[next_id] == 0:
                            next_ready.append(next_id)

                ready = next_ready

            unvisited = [nid for nid, deg in in_degree.items() if deg > 0]
            if unvisited:
                logger.warning(f"Nodes never became ready (possibly behind not-taken branches): {unvisited}")

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

    @staticmethod
    def _all_predecessors_pruned(
        node_id: str,
        reverse_adj: dict[str, list[str]],
        pruned_edges: set[tuple[str, str]],
        context: dict[str, Any],
    ) -> bool:
        """Return True if every predecessor edge leading to *node_id* was pruned
        (i.e. no live predecessor produced output for this node)."""
        predecessors = reverse_adj.get(node_id, [])
        if not predecessors:
            return False
        return all((pred, node_id) in pruned_edges or pred not in context for pred in predecessors)

    @staticmethod
    def _propagate_prune(
        start_id: str,
        nodes: dict[str, BaseNode],
        adj_list: dict[str, list[str]],
        in_degree: dict[str, int],
        pruned_edges: set[tuple[str, str]],
        next_ready: list[str],
        reverse_adj: dict[str, list[str]],
        context: dict[str, Any],
    ) -> None:
        """Transitively propagate the pruned status through a subgraph that has
        no live predecessors, decrementing in-degrees so downstream merge nodes
        can still fire."""
        queue = [start_id]
        while queue:
            nid = queue.pop()
            for succ_id in adj_list.get(nid, []):
                pruned_edges.add((nid, succ_id))
                in_degree[succ_id] -= 1
                if in_degree[succ_id] == 0:
                    if WorkflowEngine._all_predecessors_pruned(succ_id, reverse_adj, pruned_edges, context):
                        queue.append(succ_id)
                    else:
                        next_ready.append(succ_id)

    def _get_edge_condition(self, definition: dict, from_id: str, to_id: str) -> str | None:
        """Fetch condition for specific edge to support branch nodes."""
        for edge in definition.get("connections", []):
            if edge.get("from_id") == from_id and edge.get("to_id") == to_id:
                return edge.get("condition")
        return None

    def _parse_dag(
        self, definition: dict[str, Any]
    ) -> tuple[dict[str, BaseNode], dict[str, list[str]], dict[str, list[str]], dict[str, int]]:
        """Parses the workflow definition extracting Nodes, Adjacency List,
        Reverse Adjacency List, and In Degrees."""
        nodes: dict[str, BaseNode] = {}
        for n_id, n_data in definition.get("nodes", {}).items():
            nodes[n_id] = self._instantiate_node(n_id, n_data)

        adj_list: dict[str, list[str]] = defaultdict(list)
        reverse_adj: dict[str, list[str]] = defaultdict(list)
        in_degree: dict[str, int] = dict.fromkeys(nodes, 0)

        for conn in definition.get("connections", []):
            from_id = conn["from_id"]
            to_id = conn["to_id"]
            adj_list[from_id].append(to_id)
            reverse_adj[to_id].append(from_id)
            in_degree[to_id] += 1

        return nodes, adj_list, reverse_adj, in_degree

    def _instantiate_node(self, node_id: str, data: dict[str, Any]) -> BaseNode:
        """Create the appropriate node instance from definition data."""
        node_type = data.get("type")

        if node_type not in VALID_NODE_TYPES:
            raise ValueError(f"Unknown node type '{node_type}' for node {node_id}")

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

        # Unreachable due to VALID_NODE_TYPES guard above, but satisfies type checker
        raise ValueError(f"Unknown node type '{node_type}' for node {node_id}")
