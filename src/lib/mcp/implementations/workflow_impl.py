import asyncio
import re
import uuid
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Any

import dateparser

from lib.services.scheduler.db_client import SchedulerDB
from lib.services.scheduler.models import Workflow
from lib.utils.printer import printer
from lib.utils.timezone_utils import parse_timezone


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


def _parse_recurrence_seconds(schedule_description: str) -> int | None:
    """Parse natural language schedule to recurrence interval in seconds."""
    description_lower = schedule_description.lower()

    patterns = [
        (r"every\s+(\d+)\s+hours?", lambda m: int(m.group(1)) * 3600),
        (r"every\s+(\d+)\s+days?", lambda m: int(m.group(1)) * 86400),
        (r"every\s+(\d+)\s+minutes?", lambda m: int(m.group(1)) * 60),
        (r"every\s+(\d+)\s+weeks?", lambda m: int(m.group(1)) * 604800),
        (r"hourly", lambda m: 3600),
        (r"daily", lambda m: 86400),
        (r"weekly", lambda m: 604800),
    ]

    for pattern, converter in patterns:
        match = re.search(pattern, description_lower)
        if match:
            return converter(match)

    return None


def _calculate_first_run(schedule_description: str, timezone: str = "UTC") -> datetime:
    """
    Calculate the first run time for a schedule based on natural language description.

    This function parses natural language schedule descriptions and calculates the next
    appropriate execution time. If the calculated time is in the past, it automatically
    moves to the next occurrence (e.g., tomorrow for daily schedules).

    Args:
        schedule_description: Natural language schedule description. Supported formats:
            - Simple intervals: "every 1 minute", "every 5 minutes", "hourly", "daily"
            - Time-of-day: "daily at 9am", "daily at 14:30", "daily at 09:00"
            - Weekday-based: "every Monday at 2pm", "every Friday at 17:00"
            - Relative times: "in 5 minutes", "tomorrow at 3pm"
        timezone: Timezone string in IANA format (e.g., "America/New_York", "Asia/Kolkata")
                 or GMT/UTC offset format (e.g., "GMT+5:30", "UTC-5"). Defaults to "UTC".

    Returns:
        datetime: Timezone-aware datetime for the first execution

    Raises:
        ValueError: If schedule_description cannot be parsed or timezone is invalid

    Examples:
        >>> _calculate_first_run("every 5 minutes", "UTC")
        datetime(2026, 3, 11, 10, 5, 0, tzinfo=ZoneInfo('UTC'))

        >>> _calculate_first_run("daily at 9am", "America/New_York")
        datetime(2026, 3, 12, 9, 0, 0, tzinfo=ZoneInfo('America/New_York'))  # Tomorrow if past 9am

        >>> _calculate_first_run("every Monday at 2pm", "GMT+5:30")
        datetime(2026, 3, 16, 14, 0, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))
    """
    # Parse timezone and get current time
    tz = parse_timezone(timezone)
    now = datetime.now(tz)

    description_lower = schedule_description.lower().strip()

    interval_patterns = [
        r"^every\s+(\d+)\s+minutes?$",
        r"^every\s+(\d+)\s+hours?$",
        r"^every\s+(\d+)\s+days?$",
        r"^every\s+(\d+)\s+weeks?$",
        r"^hourly$",
        r"^daily$",
        r"^weekly$",
    ]

    for pattern in interval_patterns:
        if re.match(pattern, description_lower):
            recurrence = _parse_recurrence_seconds(schedule_description)
            if recurrence:
                first_run = now.replace(second=0, microsecond=0) + timedelta(minutes=1)
                return first_run

    time_pattern = r"(?:daily|everyday)\s+at\s+(.+)"
    time_match = re.search(time_pattern, description_lower)

    if time_match:
        time_str = time_match.group(1).strip()

        parsed_time = dateparser.parse(
            time_str,
            settings={
                "TIMEZONE": timezone,
                "RETURN_AS_TIMEZONE_AWARE": True,
                "PREFER_DATES_FROM": "future",
            },
        )

        if parsed_time:
            target_hour = parsed_time.hour
            target_minute = parsed_time.minute
            target_time = now.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)

            if target_time <= now:
                target_time = target_time + timedelta(days=1)

            return target_time

    weekday_pattern = r"every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(.+)"
    weekday_match = re.search(weekday_pattern, description_lower)

    if weekday_match:
        weekday_str = weekday_match.group(1)
        time_str = weekday_match.group(2).strip()

        weekday_map = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }
        target_weekday = weekday_map[weekday_str]

        parsed_time = dateparser.parse(
            time_str,
            settings={
                "TIMEZONE": timezone,
                "RETURN_AS_TIMEZONE_AWARE": True,
            },
        )

        if parsed_time:
            target_hour = parsed_time.hour
            target_minute = parsed_time.minute
            current_weekday = now.weekday()
            days_ahead = target_weekday - current_weekday

            if days_ahead == 0:
                target_time = now.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
                if target_time <= now:
                    days_ahead = 7
            elif days_ahead < 0:
                days_ahead += 7

            target_date = now + timedelta(days=days_ahead)
            target_time = target_date.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)

            return target_time

    parsed_datetime = dateparser.parse(
        schedule_description,
        settings={
            "TIMEZONE": timezone,
            "RETURN_AS_TIMEZONE_AWARE": True,
            "PREFER_DATES_FROM": "future",
            "RELATIVE_BASE": now.replace(tzinfo=None),
        },
    )

    if parsed_datetime:
        if parsed_datetime <= now:
            recurrence = _parse_recurrence_seconds(schedule_description)
            parsed_datetime = now + timedelta(seconds=recurrence) if recurrence else parsed_datetime + timedelta(days=1)

        return parsed_datetime

    raise ValueError(
        f"Could not parse schedule description: '{schedule_description}'. "
        f"Try formats like 'every 5 minutes', 'daily at 9am', 'every Monday at 2pm', "
        f"'hourly', 'in 10 minutes', or 'tomorrow at 3pm'"
    )


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


def remove_workflow(workflow_id: str) -> dict[str, Any]:
    """Remove a workflow and its associated schedules."""
    printer.info(f"Removing workflow: {workflow_id}")
    try:
        workflow = _run_async(SchedulerDB.get_workflow(workflow_id))
        if not workflow:
            return {"error": f"Workflow {workflow_id} not found", "workflow_id": workflow_id}

        deleted_schedules = _run_async(SchedulerDB.delete_schedules_by_workflow(workflow_id))

        _run_async(SchedulerDB.delete_workflow(workflow_id))

        printer.info(f"Workflow {workflow_id} removed successfully with {deleted_schedules} associated schedules")
        return {
            "success": True,
            "workflow_id": workflow_id,
            "deleted_schedules": deleted_schedules,
            "message": f"Workflow and {deleted_schedules} associated schedules removed",
        }

    except Exception as e:
        printer.error(f"Error removing workflow: {e}")
        return {"error": f"Failed to remove workflow: {str(e)}", "workflow_id": workflow_id}


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
                            "params": {"url": "https://api.example.com/data"},
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
                            "provider": "vertex",
                            "use_tools": True,
                        }
                    },
                    "connections": [],
                },
                "customizable_fields": ["prompt", "model", "provider", "use_tools", "temperature"],
                "difficulty": "intermediate",
            },
            "simple_http": {
                "name": "Simple HTTP Request",
                "description": "Make an HTTP GET request to fetch data",
                "use_cases": [
                    "fetching data from APIs",
                    "web scraping",
                    "checking service status",
                ],
                "example_definition": {
                    "nodes": {
                        "http_get": {
                            "type": "FunctionExecutionNode",
                            "function": "http_get",
                            "params": {
                                "url": "https://api.example.com/data",
                            },
                        },
                        "process": {
                            "type": "AIExecutionNode",
                            "prompt": "Analyze the fetched data: {http_get.data}",
                        },
                    },
                    "connections": [
                        {"from_id": "http_get", "to_id": "process"},
                    ],
                },
                "customizable_fields": ["url", "headers", "timeout"],
                "difficulty": "beginner",
            },
            "json_processing": {
                "name": "JSON Processing",
                "description": "Parse and process JSON data",
                "use_cases": [
                    "data transformation",
                    "API response parsing",
                    "format conversion",
                ],
                "example_definition": {
                    "nodes": {
                        "fetch": {
                            "type": "FunctionExecutionNode",
                            "function": "http_get",
                            "params": {
                                "url": "https://api.example.com/json",
                            },
                        },
                        "parse": {
                            "type": "FunctionExecutionNode",
                            "function": "json_parse",
                            "params": {
                                "data": "{fetch.data}",
                            },
                        },
                        "transform": {
                            "type": "FunctionExecutionNode",
                            "function": "dict_merge",
                            "params": {
                                "source": "{parse.data}",
                                "extra": {"key": "value"},
                            },
                        },
                    },
                    "connections": [
                        {"from_id": "fetch", "to_id": "parse"},
                        {"from_id": "parse", "to_id": "transform"},
                    ],
                },
                "customizable_fields": ["data", "keys", "dicts"],
                "difficulty": "beginner",
            },
            "utility": {
                "name": "Utility Functions",
                "description": "Common utility functions for workflows",
                "use_cases": [
                    "adding delays",
                    "generating IDs",
                    "data encoding/decoding",
                    "text manipulation",
                ],
                "example_definition": {
                    "nodes": {
                        "wait": {
                            "type": "FunctionExecutionNode",
                            "function": "sleep",
                            "params": {
                                "seconds": "5",
                            },
                        },
                        "generate_id": {
                            "type": "FunctionExecutionNode",
                            "function": "uuid_generate",
                        },
                        "process": {
                            "type": "AIExecutionNode",
                            "prompt": "Process with ID: {generate_id.uuid} and timestamp: {generate_id.current_timestamp}",
                        },
                    },
                    "connections": [
                        {"from_id": "wait", "to_id": "generate_id"},
                        {"from_id": "generate_id", "to_id": "process"},
                    ],
                },
                "customizable_fields": ["seconds"],
                "difficulty": "beginner",
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
                    "1. Create workflow using create_workflow with example_workflow_creation parameters",
                    "2. Get the returned workflow_id from create_workflow",
                    "3. Schedule the workflow using schedule_workflow with target_workflow_id and example_scheduling parameters",
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
    "remove_workflow": remove_workflow,
    "list_workflows": list_workflows,
    "get_workflow_templates": get_workflow_templates,
}
