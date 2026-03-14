"""Workflow command handler"""

import asyncio
import json

from imports import printer as logger
from lib.services.scheduler.db_client import SchedulerDB


def workflow_command(app, args: str) -> str:
    """
    Handle /workflow commands (list, run)

    Usage:
        /workflow list
        /workflow run <id>
        /workflow run <id> {"key": "value"}
    """
    if not args.strip():
        return "Usage: /workflow list OR /workflow run <id> [inputs_json]"

    parts = args.split(maxsplit=2)
    action = parts[0].lower()

    if action == "list":
        return asyncio.run(_list_workflows())

    if action == "run":
        if len(parts) < 2:
            return "Error: Must provide workflow ID (e.g., /workflow run test_workflow)"

        workflow_id = parts[1]
        inputs_str = parts[2] if len(parts) > 2 else "{}"

        try:
            inputs = json.loads(inputs_str)
        except json.JSONDecodeError:
            return "Error: Inputs must be valid JSON."

        return asyncio.run(_run_workflow(app, workflow_id, inputs))

    return f"Unknown workflow action: {action}. Use 'list' or 'run'."


async def _list_workflows() -> str:
    try:
        await SchedulerDB.initialize()
        workflows = await SchedulerDB.list_workflows()
        if not workflows:
            return "No workflows found in database."

        result = [f"Found {len(workflows)} runtime workflows:"]
        for w in workflows:
            result.append(f"- ID: {w.id} | Name: {w.name}")
            if w.description:
                result.append(f"  Description: {w.description}")
        return "\n".join(result)
    except Exception as e:
        logger.error(f"Error listing workflows: {e}")
        return f"Database error listing workflows: {e}"


async def _run_workflow(app, workflow_id: str, inputs: dict) -> str:
    # Requires an AIClient instance in the workflow scheduler if any AI modes are involved
    from lib.services.scheduler.scheduler import Scheduler

    try:
        await SchedulerDB.initialize()
        # App instance will be passed from the console app which holds ai_client
        scheduler = Scheduler()
        logger.info(f"Running workflow manually: {workflow_id} with inputs: {inputs}")

        # Execute workflow
        result = await scheduler.execute_workflow(workflow_id, inputs)

        # Format the result nicely
        return f"Workflow {workflow_id} completed successfully.\nResult: {json.dumps(result, indent=2)}"
    except ValueError as e:
        return f"Workflow error: {e}"
    except Exception as e:
        logger.error(f"Error running workflow: {e}")
        return f"Execution error: {e}"
