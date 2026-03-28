"""MCP tool definitions for workflow operations."""

WORKFLOW_DEFINITIONS = [
    {
        "name": "create_workflow",
        "description": "Create a new workflow from a JSON definition. Auto-generates a UUID for workflow_id. CRITICAL: Before calling this, always use get_workflow_templates to see example definitions and choose the best template for your task. DEFINITION STRUCTURE: definition = {'nodes': NODES_OBJECT, 'connections': CONNECTIONS_ARRAY}. NODES_OBJECT format: {'node_id': {'type': NODE_TYPE, ...fields}} where node_id matches pattern ^[a-zA-Z0-9_]+$ (alphanumeric + underscores, no spaces). SUPPORTED NODE TYPES (choose exactly one): 1) FunctionExecutionNode: {'type': 'FunctionExecutionNode', 'function': 'function_name', 'params': {}} OR {'type': 'FunctionExecutionNode', 'code': 'python_code', 'params': {}}. 2) AIExecutionNode: {'type': 'AIExecutionNode', 'prompt': 'prompt_string', 'model': 'gemini-1.5-flash', 'provider': 'vertex', 'use_tools': True, 'temperature': 0.7}. 3) ConditionalBranchNode: {'type': 'ConditionalBranchNode', 'condition': 'boolean_expression'}. 4) FlowMergeNode: {'type': 'FlowMergeNode', 'merge_strategy': 'concat' or 'merge'}. CONNECTIONS_ARRAY format: [{'from_id': 'source_node_id', 'to_id': 'target_node_id', 'condition': 'true' or 'false' (optional)}]. Both from_id and to_id must exist in nodes. Optional condition field used only with ConditionalBranchNode connections ('true' for condition=True branch, 'false' for condition=False branch). Workflow must be acyclic (DAG - no cycles).",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Human-readable name for the workflow, e.g., 'Daily Weather Fetch'. Required, minimum 1 character, maximum 100 characters.",
                },
                "description": {
                    "type": "string",
                    "description": "Optional description of what the workflow does, e.g., 'Fetches weather data from weather.tomorrow.io API'. Maximum 500 characters.",
                },
                "definition": {
                    "type": "object",
                    "description": "Complete workflow DAG with required 'nodes' object and 'connections' array. STRUCTURE: {'nodes': {'node_id': NODE_DEFINITION}, 'connections': [CONNECTION_DEFINITION]}. NODES: map of node_id strings to node definitions. Each node must specify one type: FunctionExecutionNode (requires 'function' OR 'code'), AIExecutionNode (requires 'prompt', optional 'model', 'provider', 'use_tools', 'temperature'), ConditionalBranchNode (requires 'condition'), FlowMergeNode (optional 'merge_strategy' with values 'concat' or 'merge'). CONNECTIONS: array of objects with 'from_id', 'to_id' strings matching node IDs, optional 'condition' field (values 'true' or 'false'). Node IDs must match pattern ^[a-zA-Z0-9_]+$ (alphanumeric + underscores only). Workflow must be a DAG (no cycles, directed acyclic graph).",
                    "required": ["nodes", "connections"],
                    "properties": {
                        "nodes": {
                            "type": "object",
                            "description": "Map of node_id to node definition objects. node_id must be unique and match pattern ^[a-zA-Z0-9_]+$ (no spaces, special characters). Minimum 1 node required.",
                            "minProperties": 1,
                        },
                        "connections": {
                            "type": "array",
                            "description": "Array of connection objects. Each connection has 'from_id' (source node), 'to_id' (target node) strings that exist in nodes. Optional 'condition' field for ConditionalBranchNode connections (values: 'true' or 'false'). No cycles allowed (must be DAG).",
                            "items": {"type": "object"},
                        },
                    },
                },
            },
            "required": ["name", "definition"],
        },
    },
    {
        "name": "remove_workflow",
        "description": "Remove a workflow and all its associated schedules by workflow ID. This will permanently delete the workflow and any schedules that trigger it.",
        "parameters": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "The ID of the workflow to remove (e.g., 'workflow_abc123def456')",
                },
            },
            "required": ["workflow_id"],
        },
    },
    {
        "name": "list_workflows",
        "description": "List all registered workflows with their IDs and basic information.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_workflow_templates",
        "description": "Get a library of ready-to-use workflow templates. Returns template names, descriptions, example definitions, and use cases. Use these templates as starting points when creating workflows with create_workflow. Choose a template that best matches your task.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
]
