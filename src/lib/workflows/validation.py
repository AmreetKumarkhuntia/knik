"""
Workflow definition validation utilities.

Provides centralized validation for workflow DAG definitions, including
node type checking, connection integrity, acyclicity, each node's fields
(against ``lib.workflows.schema``) and the functions that nodes call.
Used by workflow_service when a definition is saved and by the engine
(engine.py) before it runs one.
"""

from typing import Any

from pydantic import ValidationError

from lib.utils.graph_utils import is_dag_acyclic
from lib.workflows.functions import WORKFLOW_FUNCTIONS
from lib.workflows.schema import NODE_TYPES, FunctionNodeSpec, WorkflowDefinition


VALID_NODE_TYPES: set[str] = set(NODE_TYPES)


def validate_workflow_definition(definition: dict[str, Any]) -> dict[str, Any]:
    """Validate a workflow definition's structure, node types, connections, acyclicity and node fields.

    Checks performed (in order):
    1. Top-level structure: must be a dict with a 'nodes' dict and a 'connections' list.
    2. Node validation: each node must be a dict with a valid 'type' field.
    3. Connection validation: each connection must reference existing nodes.
    4. Acyclicity: the graph formed by connections must be a valid DAG.
    5. Node fields: each node must match its type's schema, in its canonical or an older spelling.
    6. Functions: a FunctionExecutionNode without inline code must name a registered workflow function.

    Args:
        definition: The workflow definition dictionary containing 'nodes' and
            'connections' keys.

    Returns:
        A dict with at least a 'valid' (bool) and 'message' (str) key.
        On failure, may also include a 'details' key with additional context.
    """
    if not isinstance(definition, dict):
        return {"valid": False, "message": "Definition must be a dictionary"}

    if "nodes" not in definition:
        return {"valid": False, "message": "Definition must contain 'nodes' key"}

    if "connections" not in definition:
        return {"valid": False, "message": "Definition must contain 'connections' key"}

    nodes = definition["nodes"]
    connections = definition["connections"]

    if not isinstance(nodes, dict):
        return {"valid": False, "message": "'nodes' must be a dictionary of node id to node"}

    if not isinstance(connections, list):
        return {"valid": False, "message": "'connections' must be a list"}

    for node_id, node_data in nodes.items():
        if not isinstance(node_data, dict):
            return {"valid": False, "message": f"Node {node_id} must be a dictionary", "details": {"node_id": node_id}}

        node_type = node_data.get("type")
        if not node_type:
            return {
                "valid": False,
                "message": f"Node {node_id} missing required 'type' field",
                "details": {"node_id": node_id},
            }

        if node_type not in VALID_NODE_TYPES:
            return {
                "valid": False,
                "message": f"Node {node_id} has invalid type '{node_type}'",
                "details": {"node_id": node_id, "invalid_type": node_type, "valid_types": sorted(VALID_NODE_TYPES)},
            }

    for i, conn in enumerate(connections):
        if not isinstance(conn, dict):
            return {
                "valid": False,
                "message": f"Connection {i} must be a dictionary",
                "details": {"connection_index": i},
            }

        from_id = conn.get("from_id")
        to_id = conn.get("to_id")

        if not from_id or not to_id:
            return {
                "valid": False,
                "message": f"Connection {i} missing 'from_id' or 'to_id'",
                "details": {"connection": conn},
            }

        if from_id not in nodes:
            return {
                "valid": False,
                "message": f"Connection {i} references non-existent node '{from_id}'",
                "details": {"connection": conn},
            }

        if to_id not in nodes:
            return {
                "valid": False,
                "message": f"Connection {i} references non-existent node '{to_id}'",
                "details": {"connection": conn},
            }

    if not is_dag_acyclic(nodes, connections):
        return {
            "valid": False,
            "message": "Workflow definition contains cycles - DAG must be acyclic",
            "details": {"connections": connections},
        }

    try:
        parsed = WorkflowDefinition.model_validate(definition)
    except ValidationError as e:
        return _field_error(e)

    for node_id, node in parsed.nodes.items():
        if isinstance(node, FunctionNodeSpec) and not node.code and node.function_name not in WORKFLOW_FUNCTIONS:
            return {
                "valid": False,
                "message": f"Node {node_id} calls unknown function '{node.function_name}'",
                "details": {
                    "node_id": node_id,
                    "function_name": node.function_name,
                    "available_functions": sorted(WORKFLOW_FUNCTIONS),
                },
            }

    return {"valid": True, "message": "Workflow definition is valid"}


def _field_error(error: ValidationError) -> dict[str, Any]:
    """The first field pydantic rejected, named like the checks above name a node or connection."""
    first = error.errors()[0]
    section, index, *field_path = first["loc"]
    if section == "nodes":
        # Pydantic puts the node's type, the tag that chose its schema, ahead of the field.
        field_path = field_path[1:]
        subject, details = f"Node {index}", {"node_id": index}
    else:
        subject, details = f"Connection {index}", {"connection_index": index}

    field = ".".join(str(part) for part in field_path)
    if field:
        subject += f" field '{field}'"
        details["field"] = field
    message = first["msg"].removeprefix("Value error, ")
    return {"valid": False, "message": f"{subject}: {message}", "details": details}
