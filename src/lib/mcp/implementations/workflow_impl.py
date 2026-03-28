"""MCP tool implementation for workflow operations."""

from typing import Any

from lib.cron import workflow_service
from lib.utils.async_utils import run_async
from lib.utils.printer import printer


def create_workflow(name: str, definition: dict[str, Any], description: str | None = None) -> dict[str, Any]:
    """Create a new workflow from a JSON definition with auto-generated UUID."""
    try:
        printer.info(f"Creating workflow: {name}")
        result = run_async(workflow_service.create_workflow(name, definition, description))
        return result

    except Exception as e:
        printer.error(f"Error creating workflow: {e}")
        return {"error": f"Failed to create workflow: {str(e)}"}


def list_workflows() -> dict[str, Any]:
    """List all registered workflows."""
    try:
        printer.info("Listing all workflows")
        workflows = run_async(workflow_service.list_workflows())

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
        result = run_async(workflow_service.delete_workflow(workflow_id, cascade=True))
        return result

    except Exception as e:
        printer.error(f"Error removing workflow: {e}")
        return {"error": f"Failed to remove workflow: {str(e)}", "workflow_id": workflow_id}


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
