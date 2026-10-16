"""Workflow node implementations for the execution engine."""

import asyncio
import dataclasses
import json
from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import Any

from lib.core.config import Config
from lib.services.ai_client.client import AIClient
from lib.services.ai_client.factory import ClientSettings, build_client
from lib.utils import printer as logger
from lib.workflows.schema import (
    NODE_TYPES,
    AINodeSpec,
    ConditionalNodeSpec,
    FunctionNodeSpec,
    MergeNodeSpec,
    parse_node,
)


# Builds the client for an AI node; the bool is the node's use_tools. Workflows sit below the tools, so the
# apps pass a factory that adds them. The node owns the client it gets and cleans up its tools afterwards.
AIClientFactory = Callable[[ClientSettings, bool], AIClient]


class BaseNode(ABC):
    """Abstract base class for all node types in a workflow DAG."""

    def __init__(self, node_id: str):
        self.node_id = node_id

    @abstractmethod
    async def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        Execute node logic.

        Args:
            inputs: Dictionary containing workflow inputs and upstream node outputs.

        Returns:
            Dictionary with results of the execution.
        """
        pass

    def validate(self) -> bool:
        """Check whether the node configuration is valid."""
        return True

    def get_info(self) -> dict[str, Any]:
        """Return a summary dict for this node."""
        return {
            "node_id": self.node_id,
            "type": self.__class__.__name__,
        }


class FunctionExecutionNode(BaseNode):
    """Node that executes a standard Python function or an MCP tool."""

    def __init__(self, node_id: str, function_name: str, params: dict[str, Any] | None = None, code: str | None = None):
        super().__init__(node_id)
        self.function_name = function_name
        self.params = params or {}
        self.code = code

    async def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Execute configured function from registry or raw Python code."""
        logger.info(f"[{self.node_id}] Executing FunctionExecutionNode: {self.function_name}")

        resolved_params = self._resolve_params(inputs)

        if self.code:
            local_env = {**resolved_params, "inputs": inputs}
            try:
                # Offload synchronous exec() to a worker thread to avoid
                # blocking the asyncio event loop with arbitrary user code.
                def _run_code():
                    exec(self.code, {}, local_env)

                await asyncio.to_thread(_run_code)

                code_output = local_env.get("output", local_env.get("result"))
                return {"status": "success", "output": code_output}
            except Exception as e:
                logger.error(f"[{self.node_id}] Python code execution failed: {e}")
                raise RuntimeError(f"Python code evaluation failed: {e}") from e

        from .functions import WORKFLOW_FUNCTIONS

        func = WORKFLOW_FUNCTIONS.get(self.function_name)
        if func:
            try:
                result = await func(**resolved_params)

                if isinstance(result, dict):
                    if "error" in result:
                        raise RuntimeError(result["error"])
                    return {"status": "success", **result}
                # A plain value (a string, a list, a number) goes under "output", where inline code puts its result.
                return {"status": "success", "output": result}
            except Exception as e:
                logger.error(f"[{self.node_id}] Function {self.function_name} execution failed: {e}")
                raise RuntimeError(f"Function {self.function_name} execution failed: {e}") from e

        # Function not found — raise explicitly so the workflow fails clearly
        raise RuntimeError(
            f"Function '{self.function_name}' is not registered in WORKFLOW_FUNCTIONS. "
            f"Available functions: {list(WORKFLOW_FUNCTIONS.keys())}"
        )

    def _resolve_params(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Resolve parameter templates from upstream node outputs."""
        resolved = {}
        for k, v in self.params.items():
            if isinstance(v, str) and v.startswith("{") and v.endswith("}"):
                path = v[1:-1].split(".")
                val = inputs
                try:
                    for p in path:
                        val = val[p]
                    resolved[k] = val
                except (KeyError, TypeError):
                    resolved[k] = v
            else:
                resolved[k] = v
        return resolved


class ConditionalBranchNode(BaseNode):
    """Node that evaluates a boolean condition and returns paths to follow."""

    def __init__(self, node_id: str, condition: str):
        super().__init__(node_id)
        self.condition = condition

    async def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Evaluate the condition and return the boolean result."""
        logger.info(f"[{self.node_id}] Evaluating condition: {self.condition}")

        resolved_condition = self.condition
        for key, val in inputs.items():
            if isinstance(val, dict):
                for sub_k, sub_v in val.items():
                    resolved_condition = resolved_condition.replace(f"{{{key}.{sub_k}}}", str(sub_v))

        try:
            result = eval(resolved_condition)
        except Exception as e:
            logger.error(f"[{self.node_id}] Condition evaluation failed: {e}")
            result = False

        return {"result": bool(result)}


class FlowMergeNode(BaseNode):
    """Node that merges outputs from multiple incoming parallel nodes.

    'concat' and 'overwrite' flatten the dict outputs into one dict, a later key replacing an earlier one;
    any other strategy ('merge') keeps every input under its node id in ``merged_inputs``.
    """

    def __init__(self, node_id: str, merge_strategy: str = "concat"):
        super().__init__(node_id)
        self.merge_strategy = merge_strategy

    async def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Merge outputs from multiple incoming parallel nodes."""
        logger.info(f"[{self.node_id}] Merging inputs with strategy {self.merge_strategy}")

        if self.merge_strategy in ("concat", "overwrite"):
            merged = {}
            for k, v in inputs.items():
                if isinstance(v, dict):
                    merged.update(v)
                else:
                    merged[k] = v
            return merged
        else:
            return {"merged_inputs": inputs}


class AIExecutionNode(BaseNode):
    """Node that defers execution to the AI Client natively.

    A setting left as None takes its default, and so does an empty model or provider: the builder sends an
    empty model until one is picked.
    """

    def __init__(
        self,
        node_id: str,
        prompt: str,
        model: str | None = None,
        provider: str | None = None,
        temperature: float | None = None,
        use_tools: bool | None = None,
        ai_client_factory: AIClientFactory | None = None,
    ):
        super().__init__(node_id)
        self.prompt = prompt
        # A node without its own settings uses the ones the process runs with.
        cfg = Config.current()
        self.model = model or cfg.ai_model
        self.provider = provider or cfg.ai_provider
        self.temperature = cfg.temperature if temperature is None else temperature
        self.use_tools = True if use_tools is None else use_tools
        self.ai_client_factory = ai_client_factory

    async def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Run the configured AI model and return its response."""
        logger.info(f"[{self.node_id}] Executing AI Node with prompt: {self.prompt}")
        resolved_prompt = self._resolve_prompt(inputs, self.prompt)

        try:
            # Offload the entire client construction + synchronous LangChain
            # .invoke() call to a worker thread so nothing blocks the asyncio
            # event loop (matches the web backend _build_ai + to_thread pattern).
            def _build_and_chat() -> tuple[str, dict | None]:
                # The process's client settings (custom API base and key, max tokens) with the node's own on top.
                settings = dataclasses.replace(
                    ClientSettings.from_config(Config.current()),
                    provider=self.provider,
                    model=self.model,
                    temperature=self.temperature,
                    system_instruction=None,
                )
                factory = self.ai_client_factory
                # Without a factory there is no way to reach the tools, so the node runs without them.
                ai_client = factory(settings, self.use_tools) if factory else build_client(settings)
                try:
                    # chat() sends its own default temperature with the call, which outranks the client's setting.
                    chat_response = ai_client.chat(prompt=resolved_prompt, temperature=self.temperature)
                finally:
                    if ai_client.tool_registry is not None:
                        ai_client.tool_registry.cleanup_tools()
                usage = ai_client.last_usage
                if usage is None:
                    usage = AIClient._estimate_usage(resolved_prompt, chat_response, self.model)
                return chat_response, usage

            response, usage = await asyncio.to_thread(_build_and_chat)

            if usage:
                in_tok = usage.get("input_tokens", 0)
                out_tok = usage.get("output_tokens", 0)
                total_tok = usage.get("total_tokens", 0)
                estimated = " (estimated)" if usage.get("estimated") else ""
                logger.info(f"[{self.node_id}] Token usage: {in_tok} in / {out_tok} out / {total_tok} total{estimated}")

            return {
                "status": "success",
                "output": response,
                "tokens": {
                    "input_tokens": usage.get("input_tokens", 0) if usage else 0,
                    "output_tokens": usage.get("output_tokens", 0) if usage else 0,
                    "total_tokens": usage.get("total_tokens", 0) if usage else 0,
                    "estimated": usage.get("estimated", False) if usage else False,
                },
            }
        except Exception as e:
            logger.error(f"[{self.node_id}] AI execution failed: {e}")
            raise RuntimeError(f"AI execution failed: {e}") from e

    def _resolve_prompt(self, inputs: dict[str, Any], prompt_template: str) -> str:
        """
        Resolve prompt with automatic previous execution context.

        Hybrid approach:
        1. Traditional template replacement (backward compatible)
        2. Auto-append structured context from previous connected nodes
        """
        resolved = prompt_template
        for key, val in inputs.items():
            if isinstance(val, dict):
                for sub_k, sub_v in val.items():
                    resolved = resolved.replace(f"{{{key}.{sub_k}}}", str(sub_v))
            else:
                resolved = resolved.replace(f"{{{key}}}", str(val))

        context_parts = []

        for node_id, node_output in inputs.items():
            if node_id == "input":
                continue

            if not node_output:
                continue

            try:
                output_str = json.dumps(node_output, indent=2, default=str)
            except Exception:
                output_str = str(node_output)

            context_parts.append(f'<node id="{node_id}">\n{output_str}\n</node>')

        if context_parts:
            context_xml = "<previous_execution>\n" + "\n".join(context_parts) + "\n</previous_execution>"
            return f"{resolved}\n\n{context_xml}"

        return resolved


class _MarkerNode(BaseNode):
    """A builder's StartNode or EndNode. It runs like any node, so an execution has a step for every node the
    builder drew, but does nothing: its output is empty, which an AI node leaves out of its prompt context."""

    async def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        return {}


class StartNode(_MarkerNode):
    """Marks where the builder's flow begins."""


class EndNode(_MarkerNode):
    """Marks where the builder's flow ends."""


def build_node(node_id: str, data: dict[str, Any], ai_client_factory: AIClientFactory | None = None) -> BaseNode:
    """The node for one entry of a definition's ``nodes``, written in its canonical or an older spelling.

    Raises:
        ValueError: the node's type is unknown or its fields are invalid.
    """
    if data.get("type") not in NODE_TYPES:
        raise ValueError(f"Unknown node type '{data.get('type')}' for node {node_id}")

    spec = parse_node(data)
    match spec:
        case FunctionNodeSpec():
            return FunctionExecutionNode(node_id, spec.function_name or "", spec.params, spec.code)
        case AINodeSpec():
            return AIExecutionNode(
                node_id,
                prompt=spec.prompt,
                model=spec.model,
                provider=spec.provider,
                temperature=spec.temperature,
                use_tools=spec.use_tools,
                ai_client_factory=ai_client_factory,
            )
        case ConditionalNodeSpec():
            return ConditionalBranchNode(node_id, spec.condition)
        case MergeNodeSpec():
            return FlowMergeNode(node_id, spec.merge_strategy)
        case _:
            return StartNode(node_id) if spec.type == "StartNode" else EndNode(node_id)
