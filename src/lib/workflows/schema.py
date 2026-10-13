"""The workflow definition: the one shape the web builder, the AI tools, the services and the engine share.

A definition is ``{"nodes": {node_id: node}, "connections": [{"from_id", "to_id", "condition"?}]}``, and each
node names its kind in ``type``. Keys its type does not use (a node's ``label``, the builder's editor-only
fields) are kept as they are and ignored when the workflow runs.

Older spellings are still read: ``function`` for a function node's ``function_name`` (what the engine and the
AI tools used to write) and merge strategies other than the three below. ``normalize_definition`` rewrites
them to the canonical form, which is what the services store and the engine runs.
"""

from typing import Annotated, Any, Literal, get_args

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, ValidationError, field_validator, model_validator


# 'concat' and 'overwrite' (the builder's names) both flatten the incoming outputs into one dict, a later
# predecessor's key replacing an earlier one's; 'merge' keeps each output under its node id.
MergeStrategy = Literal["concat", "overwrite", "merge"]
MERGE_STRATEGIES: tuple[str, ...] = get_args(MergeStrategy)


class _Node(BaseModel):
    model_config = ConfigDict(extra="allow")


class FunctionNodeSpec(_Node):
    """Runs ``code`` when it is given, else the registered workflow function ``function_name`` with ``params``."""

    type: Literal["FunctionExecutionNode"]
    function_name: str | None = None
    params: dict[str, Any] | None = None
    code: str | None = None

    @model_validator(mode="before")
    @classmethod
    def _read_legacy_function_key(cls, data: Any) -> Any:
        if isinstance(data, dict) and "function" in data:
            data = dict(data)
            legacy = data.pop("function")
            if not data.get("function_name"):
                data["function_name"] = legacy
        return data

    @model_validator(mode="after")
    def _needs_something_to_run(self) -> "FunctionNodeSpec":
        if not self.code and not self.function_name:
            raise ValueError("a FunctionExecutionNode needs a function_name or code")
        return self


class AINodeSpec(_Node):
    """Sends ``prompt`` to a model; an unset or empty ``model``/``provider`` means the engine's default."""

    type: Literal["AIExecutionNode"]
    prompt: str = ""
    model: str | None = None
    provider: str | None = None
    temperature: float | None = None
    use_tools: bool | None = None


class ConditionalNodeSpec(_Node):
    type: Literal["ConditionalBranchNode"]
    condition: str = ""


class MergeNodeSpec(_Node):
    type: Literal["FlowMergeNode"]
    merge_strategy: MergeStrategy = "concat"

    @field_validator("merge_strategy", mode="before")
    @classmethod
    def _unknown_strategies_merge(cls, value: Any) -> Any:
        # The node always ran any strategy it did not know as 'merge', so that is what such a value means.
        return value if value in MERGE_STRATEGIES else "merge"


class MarkerNodeSpec(_Node):
    """The builder's StartNode and EndNode: they mark where the flow begins and ends and do nothing when run."""

    type: Literal["StartNode", "EndNode"]
    label: str | None = None


NodeSpec = Annotated[
    FunctionNodeSpec | AINodeSpec | ConditionalNodeSpec | MergeNodeSpec | MarkerNodeSpec,
    Field(discriminator="type"),
]

NODE_TYPES: frozenset[str] = frozenset(
    {
        "FunctionExecutionNode",
        "AIExecutionNode",
        "ConditionalBranchNode",
        "FlowMergeNode",
        "StartNode",
        "EndNode",
    }
)


class ConnectionSpec(BaseModel):
    """An edge; ``condition`` ('true' or 'false') picks the branch of a ConditionalBranchNode it leaves."""

    model_config = ConfigDict(extra="allow")

    from_id: str
    to_id: str
    condition: str | None = None


class WorkflowDefinition(BaseModel):
    model_config = ConfigDict(extra="allow")

    nodes: dict[str, NodeSpec]
    connections: list[ConnectionSpec]


_NODE_ADAPTER: TypeAdapter[NodeSpec] = TypeAdapter(NodeSpec)


def parse_node(data: Any) -> NodeSpec:
    """One node of a definition, in either spelling. Raises ``pydantic.ValidationError`` (a ``ValueError``)."""
    return _NODE_ADAPTER.validate_python(data)


def normalize_definition(definition: Any) -> Any:
    """The canonical form of a definition, or the definition unchanged when it does not parse.

    Only what was given is written back, so a definition already in canonical form comes back equal to itself.
    An invalid definition is returned as it is for ``validate_workflow_definition`` to report.
    """
    try:
        return WorkflowDefinition.model_validate(definition).model_dump(exclude_unset=True)
    except ValidationError:
        return definition
