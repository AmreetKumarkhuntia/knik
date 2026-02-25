from abc import ABC, abstractmethod
from typing import Any

from imports import printer as logger


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
        """Validate node configuration before execution starts."""
        return True

    def get_info(self) -> dict[str, Any]:
        """Get node metadata."""
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
        """Execute the configured function or raw Python code."""
        logger.info(f"[{self.node_id}] Executing FunctionExecutionNode: {self.function_name}")

        resolved_params = self._resolve_params(inputs)

        if self.code:
            # Execute raw python code with resolved_params injected into globals
            # The code is expected to define a 'result' variable or the last evaluated expression
            # will be discarded (use a wrapper to capture output)
            local_env = {**resolved_params, "inputs": inputs}
            try:
                # Compile and execute the python snippet
                exec(self.code, {}, local_env)

                # Fetch output from a standardized 'output' or 'result' variable if the script set it
                code_output = local_env.get("output", local_env.get("result"))
                return {"status": "success", "executed_code": True, "params": resolved_params, "output": code_output}
            except Exception as e:
                logger.error(f"[{self.node_id}] Python execution failed: {e}")
                raise RuntimeError(f"Python code evaluation failed: {e}") from e

        # Fallback to standard mock
        result = {"status": "success", "mock_executed": self.function_name, "params": resolved_params}
        return result

    def _resolve_params(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Simple mock resolver for string templates like {input.file_path}"""
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
        """Evaluate the python string condition against inputs."""
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
        temperature: float = 0.7,
        use_tools: bool = False,
    ):
        super().__init__(node_id)
        self.prompt = prompt
        self.model = model
        self.temperature = temperature
        self.use_tools = use_tools

    async def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        logger.info(f"[{self.node_id}] Executing AI Node with prompt: {self.prompt}")
        resolved_prompt = self.prompt

        return {"output": "Mock AI Response", "resolved_prompt": resolved_prompt}
