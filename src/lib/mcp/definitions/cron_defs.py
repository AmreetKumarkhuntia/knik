CRON_DEFINITIONS = [
    {
        "name": "list_cron_schedules",
        "description": "List all active cron schedules for workflows. When asked for cron jobs use this function until explictily asked to  check for system cron jobs.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "add_cron_schedule",
        "description": "Add a new cron schedule where a trigger workflow dynamically determines when to run a target workflow.",
        "parameters": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "The ID of the target workflow to run",
                },
                "trigger_workflow_id": {
                    "type": "string",
                    "description": "The ID of the workflow that acts as the trigger/scheduler",
                },
            },
            "required": ["workflow_id", "trigger_workflow_id"],
        },
    },
    {
        "name": "remove_cron_schedule",
        "description": "Remove an existing cron schedule by ID. When asked for cron jobs use this function until explictily asked to  check for system cron jobs.",
        "parameters": {
            "type": "object",
            "properties": {
                "schedule_id": {
                    "type": "integer",
                    "description": "The integer ID of the schedule to remove",
                }
            },
            "required": ["schedule_id"],
        },
    },
]
