import asyncio
import uuid
from collections import defaultdict, deque
from typing import Any
from zoneinfo import ZoneInfo

from lib.services.scheduler.db_client import SchedulerDB
from lib.services.scheduler.models import Schedule, Workflow
from lib.utils.printer import printer


def _run_async(coro):
    """Run an async coroutine synchronously."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        import nest_asyncio

        nest_asyncio.apply()
        return asyncio.run(coro)
    else:
        return asyncio.run(coro)


def create_workflow(name: str, definition: dict[str, Any], description: str | None = None) -> dict[str, Any]:
    """Create a new workflow from a JSON definition with auto-generated UUID."""
    try:
        printer.info(f"Creating workflow: {name}")

        workflow_id = f"workflow_{uuid.uuid4().hex[:12]}"

        validation_result = _validate_workflow_definition(definition)
        if not validation_result["valid"]:
            return {
                "error": f"Invalid workflow definition: {validation_result['message']}",
                "details": validation_result.get("details"),
            }

        workflow = Workflow(id=workflow_id, name=name, definition=definition, description=description)

        _run_async(SchedulerDB.create_workflow(workflow))

        printer.info(f"Workflow created successfully: {workflow_id}")
        return {"success": True, "workflow_id": workflow_id, "name": name, "description": description}

    except Exception as e:
        printer.error(f"Error creating workflow: {e}")
        return {"error": f"Failed to create workflow: {str(e)}"}


def schedule_workflow(
    workflow_id: str, schedule_description: str, trigger_type: str, timezone: str = "GMT+5:30"
) -> dict[str, Any]:
    """Schedule an existing workflow using natural language timing."""
    try:
        printer.info(f"Scheduling workflow {workflow_id} with trigger type: {trigger_type}")

        workflow = _run_async(SchedulerDB.get_workflow(workflow_id))
        if not workflow:
            return {"error": f"Workflow {workflow_id} not found", "workflow_id": workflow_id}

        _validate_timezone(timezone)

        trigger_workflow_id = f"{workflow_id}_trigger_{uuid.uuid4().hex[:8]}"
        trigger_workflow = _generate_trigger_workflow(trigger_workflow_id, schedule_description, timezone, trigger_type)

        _run_async(SchedulerDB.create_workflow(trigger_workflow))

        schedule = Schedule(
            id=0, workflow_id=workflow_id, trigger_workflow_id=trigger_workflow_id, enabled=True, timezone=timezone
        )

        schedule_id = _run_async(SchedulerDB.create_schedule(schedule))

        printer.info(f"Workflow scheduled successfully: {schedule_id}")
        return {
            "success": True,
            "schedule_id": schedule_id,
            "workflow_id": workflow_id,
            "trigger_workflow_id": trigger_workflow_id,
            "schedule_description": schedule_description,
            "trigger_type": trigger_type,
            "timezone": timezone,
        }

    except ValueError as e:
        printer.error(f"Validation error scheduling workflow: {e}")
        return {"error": str(e), "workflow_id": workflow_id}
    except Exception as e:
        printer.error(f"Error scheduling workflow: {e}")
        return {"error": f"Failed to schedule workflow: {str(e)}", "workflow_id": workflow_id}


def list_workflows() -> dict[str, Any]:
    """List all registered workflows."""
    try:
        printer.info("Listing all workflows")
        workflows = _run_async(SchedulerDB.list_workflows())

        results = [
            {
                "id": w.id,
                "name": w.name,
                "description": w.description,
                "created_at": w.created_at.isoformat() if w.created_at else None,
            }
            for w in workflows
        ]

        return {"success": True, "workflows": results, "total": len(results)}

    except Exception as e:
        printer.error(f"Error listing workflows: {e}")
        return {"error": f"Failed to list workflows: {str(e)}"}


def _validate_workflow_definition(definition: dict[str, Any]) -> dict[str, Any]:
    """Validate workflow definition structure and content."""
    if not isinstance(definition, dict):
        return {"valid": False, "message": "Definition must be a dictionary"}

    if "nodes" not in definition:
        return {"valid": False, "message": "Definition must contain 'nodes' key"}

    if "connections" not in definition:
        return {"valid": False, "message": "Definition must contain 'connections' key"}

    nodes = definition.get("nodes", {})
    connections = definition.get("connections", [])

    valid_node_types = {"FunctionExecutionNode", "AIExecutionNode", "ConditionalBranchNode", "FlowMergeNode"}

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

        if node_type not in valid_node_types:
            return {
                "valid": False,
                "message": f"Node {node_id} has invalid type '{node_type}'",
                "details": {"node_id": node_id, "invalid_type": node_type, "valid_types": list(valid_node_types)},
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

    is_acyclic = _check_acyclic(nodes, connections)
    if not is_acyclic:
        return {
            "valid": False,
            "message": "Workflow definition contains cycles - DAG must be acyclic",
            "details": {"connections": connections},
        }

    return {"valid": True, "message": "Workflow definition is valid"}


def _check_acyclic(nodes: dict[str, Any], connections: list[dict[str, Any]]) -> bool:
    """Check if workflow graph is acyclic using Kahn's algorithm."""
    if not nodes:
        return True

    adj_list = defaultdict(list)
    in_degree = dict.fromkeys(nodes, 0)

    for conn in connections:
        from_id = conn["from_id"]
        to_id = conn["to_id"]
        adj_list[from_id].append(to_id)
        in_degree[to_id] = in_degree.get(to_id, 0) + 1

    queue = deque([node_id for node_id, degree in in_degree.items() if degree == 0])
    visited_count = 0

    while queue:
        node = queue.popleft()
        visited_count += 1

        for neighbor in adj_list[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return visited_count == len(nodes)


def _validate_timezone(timezone_str: str) -> None:
    """Validate timezone string."""
    try:
        if timezone_str.startswith("GMT") or timezone_str.startswith("UTC"):
            return

        ZoneInfo(timezone_str)
    except Exception as e:
        raise ValueError(f"Invalid timezone: {timezone_str}. Error: {e}") from None


def _generate_trigger_workflow(
    trigger_id: str, schedule_description: str, timezone: str, trigger_type: str
) -> Workflow:
    """Generate a trigger workflow based on trigger type."""
    name = f"Trigger: {schedule_description}"

    if trigger_type == "code":
        definition = _generate_code_based_trigger(schedule_description, timezone)
    elif trigger_type == "ai":
        definition = _generate_ai_based_trigger(schedule_description, timezone)
    else:
        raise ValueError(f"Invalid trigger_type '{trigger_type}'. Must be 'ai' or 'code'")

    return Workflow(
        id=trigger_id, name=name, definition=definition, description=f"Trigger workflow for: {schedule_description}"
    )


def _generate_code_based_trigger(schedule_description: str, timezone: str) -> dict[str, Any]:
    """Generate code-based trigger workflow using dateparser."""
    code = f"""import dateparser
from datetime import datetime
from zoneinfo import ZoneInfo

def evaluate_schedule(current_minute):
    \"\"\"Evaluate if schedule should trigger based on current time.\"\"\"
    try:
        tz = ZoneInfo("{timezone}")
        current_time = datetime.now(tz)

        parsed = dateparser.parse(
            "{schedule_description}",
            settings={{
                "RELATIVE_BASE": current_time,
                "TIMEZONE": str(tz),
                "RETURN_AS_TIMEZONE_AWARE": True
            }}
        )

        if not parsed:
            return {{"trigger_target": False, "reason": "Could not parse schedule"}}

        time_diff = abs((current_time - parsed).total_seconds())
        should_trigger = time_diff <= 60

        return {{
            "trigger_target": should_trigger,
            "parsed_time": parsed.isoformat(),
            "current_time": current_time.isoformat(),
            "time_difference": time_diff
        }}
    except Exception as e:
        error_result = {{"trigger_target": False, "error": str(e)}}
        return error_result

result = evaluate_schedule({{current_minute}})
output = result.get("trigger_target", False)
"""

    return {
        "nodes": {
            "evaluate_schedule": {
                "type": "FunctionExecutionNode",
                "code": code,
                "params": {"current_minute": "{current_minute}"},
            }
        },
        "connections": [],
    }


def _generate_ai_based_trigger(schedule_description: str, timezone: str) -> dict[str, Any]:
    """Generate AI-based trigger workflow."""
    prompt = (
        f"Current time: {{current_minute}}. "
        f"Schedule description: '{schedule_description}'. "
        f"Timezone: {timezone}. "
        f"Evaluate if this schedule should trigger now. "
        f"Return a JSON response with a 'trigger_target' field set to true or false."
    )

    return {
        "nodes": {"evaluate_schedule": {"type": "AIExecutionNode", "prompt": prompt, "model": "gemini-1.5-flash"}},
        "connections": [],
    }


def get_workflow_templates() -> dict[str, Any]:
    """Get a library of ready-to-use workflow templates."""
    try:
        printer.info("Getting workflow templates library")

        templates = {
            "http_fetch": {
                "name": "HTTP Fetch Workflow",
                "description": "Simple workflow that fetches data from a URL using HTTP request. Perfect for API calls, web scraping, or data fetching.",
                "use_cases": [
                    "API data fetching",
                    "web scraping",
                    "periodic data updates",
                    "weather data collection",
                    "stock price monitoring",
                ],
                "example_definition": {
                    "nodes": {
                        "fetch_data": {
                            "type": "FunctionExecutionNode",
                            "function": "http_get",
                            "params": {"url": "https://api.example.com/data", "method": "GET"},
                        }
                    },
                    "connections": [],
                },
                "customizable_fields": ["url", "method", "headers", "timeout"],
                "difficulty": "beginner",
            },
            "ai_processing": {
                "name": "AI Processing Workflow",
                "description": "Workflow that uses AI for natural language processing or data analysis. AI node has access to tools for enhanced capabilities.",
                "use_cases": [
                    "text summarization",
                    "data analysis",
                    "content generation",
                    "natural language understanding",
                    "document processing",
                ],
                "example_definition": {
                    "nodes": {
                        "ai_process": {
                            "type": "AIExecutionNode",
                            "prompt": "Process this data and provide insights: {input.data}",
                            "model": "gemini-1.5-flash",
                            "use_tools": True,
                        }
                    },
                    "connections": [],
                },
                "customizable_fields": ["prompt", "model", "use_tools", "temperature"],
                "difficulty": "intermediate",
            },
            "sequential_pipeline": {
                "name": "Sequential Multi-Step Workflow",
                "description": "Multiple nodes executed in sequence. Each node's output feeds into the next. Great for data processing pipelines.",
                "use_cases": [
                    "data transformation",
                    "multi-step processing",
                    "data validation and cleanup",
                    "ETL pipelines",
                    "batch processing",
                ],
                "example_definition": {
                    "nodes": {
                        "fetch_data": {
                            "type": "FunctionExecutionNode",
                            "function": "fetch_source_data",
                            "params": {"source": "database"},
                        },
                        "transform_data": {
                            "type": "FunctionExecutionNode",
                            "function": "transform_data",
                            "params": {"transformation": "normalize"},
                        },
                        "save_result": {
                            "type": "FunctionExecutionNode",
                            "function": "save_to_storage",
                            "params": {"destination": "s3"},
                        },
                    },
                    "connections": [
                        {"from_id": "fetch_data", "to_id": "transform_data"},
                        {"from_id": "transform_data", "to_id": "save_result"},
                    ],
                },
                "customizable_fields": ["nodes", "functions", "connections", "data flow"],
                "difficulty": "intermediate",
            },
            "conditional_branching": {
                "name": "Conditional Branching Workflow",
                "description": "Uses conditional branch node to execute different logic based on conditions. Great for if/else logic and decision making.",
                "use_cases": [
                    "if/else logic",
                    "error handling",
                    "data routing",
                    "business rules",
                    "conditional processing",
                ],
                "example_definition": {
                    "nodes": {
                        "check_condition": {
                            "type": "ConditionalBranchNode",
                            "condition": "{input.status} == 'success'",
                        },
                        "process_success": {
                            "type": "FunctionExecutionNode",
                            "function": "handle_success",
                            "params": {"action": "proceed"},
                        },
                        "handle_failure": {
                            "type": "FunctionExecutionNode",
                            "function": "handle_error",
                            "params": {"action": "retry"},
                        },
                        "merge_results": {"type": "FlowMergeNode", "merge_strategy": "concat"},
                    },
                    "connections": [
                        {"from_id": "check_condition", "to_id": "process_success", "condition": "true"},
                        {"from_id": "check_condition", "to_id": "handle_failure", "condition": "false"},
                        {"from_id": "process_success", "to_id": "merge_results"},
                        {"from_id": "handle_failure", "to_id": "merge_results"},
                    ],
                },
                "customizable_fields": ["condition", "branch_nodes", "merge_strategy"],
                "difficulty": "advanced",
            },
            "parallel_processing": {
                "name": "Parallel Processing Workflow",
                "description": "Multiple independent nodes running in parallel, results merged at the end. Great for concurrent tasks and performance optimization.",
                "use_cases": [
                    "parallel API calls",
                    "concurrent data fetching",
                    "multi-source aggregation",
                    "batch processing",
                    "performance optimization",
                ],
                "example_definition": {
                    "nodes": {
                        "fetch_source_1": {
                            "type": "FunctionExecutionNode",
                            "function": "fetch_data",
                            "params": {"source": "api1"},
                        },
                        "fetch_source_2": {
                            "type": "FunctionExecutionNode",
                            "function": "fetch_data",
                            "params": {"source": "api2"},
                        },
                        "fetch_source_3": {
                            "type": "FunctionExecutionNode",
                            "function": "fetch_data",
                            "params": {"source": "api3"},
                        },
                        "merge_results": {"type": "FlowMergeNode", "merge_strategy": "concat"},
                    },
                    "connections": [
                        {"from_id": "fetch_source_1", "to_id": "merge_results"},
                        {"from_id": "fetch_source_2", "to_id": "merge_results"},
                        {"from_id": "fetch_source_3", "to_id": "merge_results"},
                    ],
                },
                "customizable_fields": ["parallel_nodes", "sources", "merge_strategy"],
                "difficulty": "advanced",
            },
            "scheduled_task": {
                "name": "Scheduled Task Workflow",
                "description": "Complete example showing workflow creation + scheduling. Perfect for periodic tasks like weather monitoring, data updates, or maintenance jobs.",
                "use_cases": [
                    "periodic data updates",
                    "scheduled maintenance",
                    "daily reports",
                    "weather monitoring",
                    "automated backups",
                ],
                "example_workflow_creation": {
                    "name": "Daily Weather Monitoring",
                    "description": "Fetches weather data every day at 9am",
                    "definition": {
                        "nodes": {
                            "fetch_weather": {
                                "type": "FunctionExecutionNode",
                                "function": "http_get",
                                "params": {"url": "https://weather.tomorrow.io/"},
                            }
                        },
                        "connections": [],
                    },
                },
                "example_scheduling": {
                    "schedule_description": "daily at 9am",
                    "trigger_type": "code",
                    "timezone": "GMT+5:30",
                },
                "step_by_step": [
                    "1. Create workflow using create_workflow with the example_workflow_creation parameters",
                    "2. Get the returned workflow_id from create_workflow",
                    "3. Schedule the workflow using schedule_workflow with the workflow_id and example_scheduling parameters",
                ],
                "customizable_fields": [
                    "schedule_description",
                    "trigger_type",
                    "timezone",
                    "workflow_name",
                    "workflow_definition",
                ],
                "difficulty": "intermediate",
            },
            "weather_fetch": {
                "name": "Weather Fetch Workflow",
                "description": "Specific template for fetching weather data from weather.tomorrow.io. Perfect template for weather monitoring use case.",
                "use_cases": [
                    "weather monitoring",
                    "climate data collection",
                    "weather API integration",
                    "forecast updates",
                ],
                "example_definition": {
                    "nodes": {
                        "fetch_weather": {
                            "type": "FunctionExecutionNode",
                            "function": "http_get",
                            "params": {
                                "url": "https://weather.tomorrow.io/",
                                "method": "GET",
                                "headers": {"Accept": "application/json"},
                            },
                        }
                    },
                    "connections": [],
                },
                "example_scheduling": {
                    "schedule_description": "every 6 hours",
                    "trigger_type": "code",
                    "timezone": "GMT+5:30",
                },
                "api_specifics": {
                    "base_url": "https://weather.tomorrow.io/",
                    "authentication": "API key required (check documentation)",
                    "response_format": "JSON",
                    "rate_limits": "Check API documentation",
                },
                "customizable_fields": ["url", "headers", "schedule", "location"],
                "difficulty": "beginner",
            },
        }

        return {
            "success": True,
            "templates": templates,
            "total": len(templates),
            "usage_guide": {
                "recommended_approach": "1. Call get_workflow_templates to see available templates\n2. Choose the template that best matches your task\n3. Use the example_definition as a starting point for create_workflow\n4. Customize the customizable_fields as needed\n5. For scheduled workflows, use the scheduled_task template pattern",
                "template_selection_tips": [
                    "Use 'http_fetch' for simple API calls and data fetching",
                    "Use 'ai_processing' when you need natural language understanding or AI analysis",
                    "Use 'sequential_pipeline' for multi-step data processing",
                    "Use 'conditional_branching' for if/else logic and decision making",
                    "Use 'parallel_processing' for concurrent tasks to improve performance",
                    "Use 'scheduled_task' as a complete example of workflow + scheduling",
                    "Use 'weather_fetch' specifically for weather data from weather.tomorrow.io",
                ],
            },
        }

    except Exception as e:
        printer.error(f"Error getting workflow templates: {e}")
        return {"error": f"Failed to get workflow templates: {str(e)}"}


WORKFLOW_IMPLEMENTATIONS = {
    "create_workflow": create_workflow,
    "schedule_workflow": schedule_workflow,
    "list_workflows": list_workflows,
    "get_workflow_templates": get_workflow_templates,
}
