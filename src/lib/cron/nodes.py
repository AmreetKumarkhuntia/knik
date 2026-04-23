"""Workflow node implementations for the execution engine."""

import asyncio
import json
from abc import ABC, abstractmethod
from typing import Any

from imports import printer as logger
from lib.mcp.index import register_all_tools
from lib.services.ai_client.client import AIClient
from lib.services.ai_client.registry.mcp_registry import MCPServerRegistry


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

                if isinstance(result, dict) and "error" in result:
                    raise RuntimeError(result["error"])

                return {"status": "success", **result}
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
    """Node that merges outputs from multiple incoming parallel nodes."""

    def __init__(self, node_id: str, merge_strategy: str = "concat"):
        super().__init__(node_id)
        self.merge_strategy = merge_strategy

    async def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Merge outputs from multiple incoming parallel nodes."""
        logger.info(f"[{self.node_id}] Merging inputs with strategy {self.merge_strategy}")

        if self.merge_strategy == "concat":
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
    """Node that defers execution to the AI Client natively."""

    def __init__(
        self,
        node_id: str,
        prompt: str,
        model: str = "gemini-1.5-flash",
        provider: str = "vertex",
        temperature: float = 0.7,
        use_tools: bool = True,
    ):
        super().__init__(node_id)
        self.prompt = prompt
        self.model = model
        self.provider = provider
        self.temperature = temperature
        self.use_tools = use_tools

    async def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Run the configured AI model and return its response."""
        logger.info(f"[{self.node_id}] Executing AI Node with prompt: {self.prompt}")
        resolved_prompt = self._resolve_prompt(inputs, self.prompt)

        try:
            # Offload the entire client construction + synchronous LangChain
            # .invoke() call to a worker thread so nothing blocks the asyncio
            # event loop (matches the web backend _build_ai + to_thread pattern).
            def _build_and_chat() -> tuple[str, dict | None]:
                if self.use_tools:
                    mcp_registry = MCPServerRegistry()
                    register_all_tools(mcp_registry)
                else:
                    mcp_registry = None

                ai_client = AIClient(
                    provider=self.provider,
                    model=self.model,
                    temperature=self.temperature,
                    mcp_registry=mcp_registry,
                )
                chat_response = ai_client.chat(prompt=resolved_prompt)
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
