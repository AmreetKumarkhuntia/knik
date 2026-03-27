"""
Workflow definition validation utilities.

Provides centralized validation for workflow DAG definitions, including
node type checking, connection integrity, and acyclicity verification.
Used by both the MCP tool layer (workflow_impl.py) and the scheduler
engine (engine.py).
"""

from typing import Any

from lib.utils.graph_utils import is_dag_acyclic


VALID_NODE_TYPES: set[str] = {
    "FunctionExecutionNode",
    "AIExecutionNode",
    "ConditionalBranchNode",
    "FlowMergeNode",
}


def validate_workflow_definition(definition: dict[str, Any]) -> dict[str, Any]:
    """Validate a workflow definition's structure, node types, connections, and acyclicity.

    Checks performed (in order):
    1. Top-level structure: must be a dict with 'nodes' and 'connections' keys.
    2. Node validation: each node must be a dict with a valid 'type' field.
    3. Connection validation: each connection must reference existing nodes.
    4. Acyclicity: the graph formed by connections must be a valid DAG.

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

    nodes = definition.get("nodes", {})
    connections = definition.get("connections", [])

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

    return {"valid": True, "message": "Workflow definition is valid"}
