CRON_DEFINITIONS = [
    {
        "name": "list_cron_schedules",
        "description": "List all active cron schedules for workflows. When asked for cron jobs use this function until explicitly asked to check for system cron jobs.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "add_cron_schedule",
        "description": "Add a new cron schedule with natural language description. The schedule will trigger the target workflow at the specified times.",
        "parameters": {
            "type": "object",
            "properties": {
                "target_workflow_id": {
                    "type": "string",
                    "description": "The ID of the workflow to be triggered when this schedule fires",
                },
                "schedule_description": {
                    "type": "string",
                    "description": "Natural language description of when the schedule should trigger (e.g., 'daily at 9am', 'every Monday at 2pm', 'every 6 hours')",
                },
                "timezone": {
                    "type": "string",
                    "description": "Timezone string like 'UTC', 'GMT+5:30', 'America/New_York'. Default: 'UTC'",
                    "default": "UTC",
                },
            },
            "required": ["target_workflow_id", "schedule_description"],
        },
    },
    {
        "name": "remove_cron_schedule",
        "description": "Remove an existing cron schedule by ID. When asked for cron jobs use this function until explicitly asked to check for system cron jobs.",
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
