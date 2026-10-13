# Workflows and Scheduler

A workflow is a directed acyclic graph (DAG) of nodes: function calls, AI prompts, conditional branches and
merges. Workflows are stored in Postgres and run on demand (web API, console, AI tools) or from a schedule
written in plain English ("every 5 minutes", "daily at 9am"). The code lives in `src/lib/workflows/`.

## Where workflows are run and managed

| Process                                          | What it does                                                                                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Worker (`npm run start:worker`, `--mode worker`) | Polls the schedules and runs the due ones. **Schedules fire only while a worker runs.**                                                  |
| Web backend                                      | Runs a workflow on request (`POST /api/workflows/{id}/execute`); it does not poll schedules                                              |
| Console                                          | `/workflow list`, `/workflow run <id> [inputs_json]`                                                                                     |
| AI tools                                         | Create, list and remove workflows and schedules (`create_workflow`, `add_cron_schedule`, ...; see [Tools](mcp.md)); they do not run them |

`--mode cron` and `npm run start:cron` are aliases of the worker. The worker, the backend and the console each
build a `Scheduler(ai_client_factory=build_workflow_client)`, so AI nodes get tools the same way everywhere.

## Layout

| File                  | Holds                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `schema.py`           | The definition model (`WorkflowDefinition`, one spec per node type) and `normalize_definition()` |
| `validation.py`       | `validate_workflow_definition()`, used when a definition is saved and before it runs             |
| `nodes.py`            | The node classes and `build_node()`; `AIClientFactory`                                           |
| `engine.py`           | `WorkflowEngine.execute_workflow()`: runs the DAG and records the execution                      |
| `functions.py`        | `WORKFLOW_FUNCTIONS`, the functions a function node can call                                     |
| `scheduler.py`        | `Scheduler`: `run(workflow_id, inputs)`, `start()`, `stop()`                                     |
| `loop.py`             | `CronScheduler`, the schedule polling loop                                                       |
| `schedule_parser.py`  | Natural-language schedule parsing and next-run arithmetic                                        |
| `workflow_service.py` | Workflow create/update/get/list/delete; raises `NotFoundError` / `ValidationError` (`errors.py`) |
| `schedule_service.py` | Schedule create/list/delete/toggle                                                               |

The row models (`Workflow`, `Schedule`, `ExecutionRecord`, `NodeExecutionRecord`) live in
`lib/services/db/models.py`, the queries in `lib/services/db/repositories/`.

## Workflow definitions

`schema.py` owns the one definition shape that the web builder, the AI tools, the services and the engine share:

```json
{
  "nodes": {
    "<node_id>": { "type": "<node type>", "...": "fields of that type" }
  },
  "connections": [
    {
      "from_id": "<node_id>",
      "to_id": "<node_id>",
      "condition": "true | false (optional)"
    }
  ]
}
```

| `type`                  | Fields (defaults)                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `StartNode`, `EndNode`  | `label` (optional). Mark where the builder's flow begins and ends; they run as steps that do nothing              |
| `FunctionExecutionNode` | `function_name` and `params`, or `code` (inline Python). One of `function_name` / `code` is required              |
| `AIExecutionNode`       | `prompt` (`""`), `model` (`gemini-3.0-flash`), `provider` (`vertex`), `temperature` (`0.7`), `use_tools` (`true`) |
| `ConditionalBranchNode` | `condition` (`""`)                                                                                                |
| `FlowMergeNode`         | `merge_strategy`: `concat` (default), `overwrite` or `merge`                                                      |

- Keys a node type does not use (a `label`, the builder's editor-only fields) are kept and ignored when the
  workflow runs.
- Older spellings are still read: `function` for `function_name`, and any other merge strategy, which means
  `merge`. `normalize_definition()` rewrites them; the services store definitions in this canonical form, and
  `GET /api/workflows/{id}` returns it (a definition stored in an older spelling is converted when read).
- An empty `model` or `provider` on an AI node means the default, as an unset one does.

A definition is rejected, when saved and again before it runs, unless: `nodes` is an object and `connections`
a list; every node has a known `type`; every connection names existing nodes; the graph has no cycle; each
node's fields match its type; and every function node without `code` names a function in `WORKFLOW_FUNCTIONS`.

## Nodes

Every node receives `{"input": <the run's inputs>, "<predecessor id>": <its output>, ...}`: the run's inputs plus
the outputs of its **direct** predecessors only. A scheduled run starts with empty inputs.

### FunctionExecutionNode

Calls `WORKFLOW_FUNCTIONS[function_name]` with `params` as keyword arguments. A param whose whole value is a
placeholder such as `"{input.text}"` or `"{fetch.output}"` is replaced by the value at that path (of any type);
anything else, including a placeholder inside longer text, is passed as written, as is a path that does not
exist. The node's output is `{"status": "success", ...}` plus the keys of a dict result, or
`{"status": "success", "output": <result>}` for any other result. A dict result with an `error` key fails the
node.

With `code` (which wins over `function_name`), the node runs that Python (`exec`) with the resolved params and
`inputs` as local variables, and its output is `{"status": "success", "output": <the code's output or result
variable>}`.

### AIExecutionNode

Builds a client through the engine's AI client factory and sends one prompt. In the prompt, `{input.name}` and
`{node_id.key}` placeholders are replaced by text, and the non-empty outputs of the node's predecessors are
appended as JSON inside a `<previous_execution>` block. With `use_tools` on, the client gets every built-in tool
with **no consent gate**: tools such as `run_shell_command` and `write_file` run without asking anyone. The node
cleans up its tools when the call ends. Output: `{"status": "success", "output": "<reply>", "tokens": {...}}`.

### ConditionalBranchNode

Replaces `{input.name}` and `{node_id.key}` placeholders in `condition` with text, evaluates the result as a
Python expression (`eval`) and outputs `{"result": true | false}`; an expression that raises counts as false. A connection leaving
it with `"condition": "true"` or `"false"` is followed only on that result; one without a condition is always
followed. Nodes reachable only through a branch that was not taken are skipped, and a node with another live
predecessor still runs.

### FlowMergeNode

`concat` and `overwrite` flatten everything the node receives (the run's input and each predecessor's output)
into one dict, a later key replacing an earlier one; since function results share the `output` key, only one of
them survives. `merge` keeps every input under its node id:
`{"merged_inputs": {"input": {...}, "a": {...}, "b": {...}}}`.

### StartNode and EndNode

No-ops with an empty output (`{}`), which an AI node leaves out of its prompt context. They run as steps, so an
execution has a step for every node the builder drew.

> `code` and `condition` run Python with the worker's or backend's permissions, as does `run_shell_command`.
> Only let trusted users create workflows.

## Workflow functions (24)

| Function            | Parameters                                                               | Function            | Parameters                    |
| ------------------- | ------------------------------------------------------------------------ | ------------------- | ----------------------------- |
| `http_get`          | `url, headers=None, timeout=30`                                          | `string_replace`    | `text, old, new`              |
| `http_post`         | `url, data=None, headers=None, timeout=30`                               | `string_concat`     | `strings` (a list)            |
| `http_request`      | `method, url, data=None, headers=None, timeout=30`                       | `string_join`       | `separator, strings` (a list) |
| `json_parse`        | `data`                                                                   | `string_split`      | `text, separator`             |
| `json_stringify`    | `data, indent=2`                                                         | `string_to_lower`   | `text`                        |
| `dict_get_path`     | `data, path, default=None`                                               | `string_to_upper`   | `text`                        |
| `dict_merge`        | `dicts` (a list)                                                         | `string_strip`      | `text`                        |
| `dict_filter`       | `data, keys`                                                             | `string_length`     | `text`                        |
| `dict_set_path`     | `data, path, value`                                                      | `sleep`             | `seconds`                     |
| `string_format`     | `template, **values`                                                     | `current_timestamp` | none                          |
| `uuid_generate`     | none                                                                     | `base64_encode`     | `data`                        |
| `run_shell_command` | `command, timeout=30` (at most 30 s; the shell tool's blocklist applies) | `base64_decode`     | `data`                        |

These are not the AI tools: `read_file`, for example, is a tool and not a workflow function.

## Running a workflow

`WorkflowEngine.execute_workflow()`:

1. Records an execution as `running` with the run's inputs.
2. Validates the definition and builds every node (`build_node()`).
3. Runs the DAG level by level: all nodes whose predecessors are done run at once (`asyncio.gather`). Each node
   is recorded in `node_executions` with its inputs, output, status and duration.
4. If a node fails, the other nodes of its level finish and are recorded, then the run fails.
5. Completes the execution as `success` with every node's output, or as `failed` with the error. A cancelled run
   (the worker stopping) is recorded as `failed` with the error `cancelled`.

## Schedules

A schedule targets a workflow by `target_workflow_id` and is described in plain English, not a cron expression.
Creating one stores the description, the timezone, the first run (`next_run_at`) and the repeat interval
(`recurrence_seconds`, or none for a one-shot schedule). The target workflow is not checked when the schedule is
created; deleting a workflow through the API or the AI tool also deletes its schedules.

| Description                                                         | Repeats every      | First run                             |
| ------------------------------------------------------------------- | ------------------ | ------------------------------------- |
| `every 5 minutes`, `every 2 hours`, `every 3 days`, `every 2 weeks` | that interval      | the next whole minute                 |
| `hourly`, `daily`, `weekly`                                         | 1 h, 1 day, 7 days | the next whole minute                 |
| `daily at 9am`, `everyday at 18:30`                                 | 1 day              | the next 9:00 (18:30) in the timezone |
| `every Monday at 2pm`, `every friday at 17:00`                      | 7 days             | the next Monday 14:00 (Friday 17:00)  |
| `in 10 minutes`, `tomorrow at 3pm`, `at 5pm`                        | does not repeat    | that time (one-shot)                  |

Descriptions such as `every day at 9am`, `every weekday at 9am`, `every monday` (no time) and `every 30 seconds`
are rejected. The timezone is an IANA name (`America/New_York`) or a GMT/UTC offset (`GMT+5:30`, `UTC-5`),
`UTC` by default.

### How the worker runs schedules

Every `KNIK_SCHEDULER_CHECK_INTERVAL` seconds (60 by default) the worker's `CronScheduler`:

1. On its first poll that reaches the database, marks failed the executions still `running` that started more
   than `KNIK_SCHEDULER_STALE_EXECUTION_SECONDS` ago (3600 by default): runs a stopped worker abandoned. Newer ones
   are left alone, since the backend records its manual runs as `running` too.
2. Loads the enabled schedules and, for each one whose `next_run_at` has passed, claims that occurrence with
   `ScheduleDB.claim_due_run()`. The claim is one atomic update, so a due occurrence runs once however many
   workers poll the same database.
3. The claim moves a recurring schedule on to the first occurrence after now, counted from the time it was due
   (due time + k × interval), so a late poll does not push later runs back and occurrences missed while no
   worker ran are skipped, not run one after another. A whole number of days is stepped in the schedule's
   timezone, so `daily at 9am` stays at 9:00 local time across daylight-saving changes. A one-shot schedule is
   disabled by its claim.
4. Starts the workflow in the background. At most `KNIK_SCHEDULER_MAX_CONCURRENT` scheduled runs (10 by
   default) execute at once per worker, and a worker claims an occurrence only when it has a free slot. While
   all its slots are busy it leaves due schedules unclaimed, for another worker with a free slot or for its own
   next poll after a run ends; occurrences that pass meanwhile are skipped as in step 3.

A schedule re-enabled after its `next_run_at` has passed runs on the next poll, once, and then steps forward
from there. While Postgres is unreachable the schedules pause (logged once) and resume when it is back.

On SIGINT or SIGTERM the worker stops polling (letting a poll in progress finish), cancels the scheduled runs
still in flight and waits for each to record its execution as `failed` / `cancelled`, then closes the database
pool. Each wait is bounded to 10 seconds.

## Configuration

| Variable                                 | Default | Meaning                                                                                                      |
| ---------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `KNIK_SCHEDULER_CHECK_INTERVAL`          | `60`    | Seconds between schedule polls                                                                               |
| `KNIK_SCHEDULER_MAX_CONCURRENT`          | `10`    | Scheduled runs one worker executes at once                                                                   |
| `KNIK_SCHEDULER_STALE_EXECUTION_SECONDS` | `3600`  | Age after which a `running` execution is failed at worker startup                                            |
| `KNIK_SCHEDULER_WORKERS`                 | `4`     | Not used                                                                                                     |
| `KNIK_DB_*`                              |         | The Postgres connection ([Environment Variables](../reference/environment-variables.md#database-postgresql)) |

Apply the schema with `scripts/migrate.sh` before the first run.

## Web API

Workflows are under `/api/workflows`, schedules under `/api/cron` (with `KNIK_WEB_REQUIRE_API_KEY=true`, add an
`X-API-Key` header). The examples assume the backend on `localhost:8010`.

| Method | Path                                                  | Does                                                                           |
| ------ | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| GET    | `/api/workflows/`                                     | List workflows (id, name, description)                                         |
| POST   | `/api/workflows/`                                     | Create a workflow: `name`, `definition`, `description`                         |
| GET    | `/api/workflows/{id}`                                 | The workflow's definition                                                      |
| PATCH  | `/api/workflows/{id}`                                 | Change `name`, `definition` or `description`; a field left out keeps its value |
| DELETE | `/api/workflows/{id}`                                 | Delete the workflow and its schedules                                          |
| POST   | `/api/workflows/{id}/execute`                         | Run it now with `{"inputs": {...}}`; returns the output of every node that ran |
| GET    | `/api/workflows/{id}/history`                         | Its executions                                                                 |
| GET    | `/api/workflows/{id}/executions/{execution_id}/nodes` | The node steps of one execution                                                |
| GET    | `/api/cron/`                                          | List schedules, enabled and disabled                                           |
| POST   | `/api/cron/`                                          | Create a schedule                                                              |
| PATCH  | `/api/cron/{id}/toggle`                               | Enable or disable it: `{"enabled": false}`                                     |
| DELETE | `/api/cron/{id}`                                      | Delete it                                                                      |

Create and update answer with the definition as stored (its canonical form). An invalid definition answers 400 with
`detail` (the message) and, when the validator can point at the problem, `details` (for example `node_id` and
`available_functions`). Running an unknown workflow answers 404; running one whose stored definition the engine rejects
answers 400; a node that fails answers 500 (`Node(s) failed: <ids>`).

Execution analytics are under `/api/analytics` (`dashboard`, `metrics`, `top-workflows`, `executions`,
`workflows/list`, `activity`).

### Example

Create a workflow that upper-cases its input text and, when the result is long, asks the model to summarise
the text:

```bash
curl -X POST http://localhost:8010/api/workflows/ -H 'Content-Type: application/json' -d '{
  "name": "Shout and summarise",
  "description": "Upper-cases the input text, then asks the model about it when it is long",
  "definition": {
    "nodes": {
      "start": {"type": "StartNode", "label": "Start"},
      "shout": {
        "type": "FunctionExecutionNode",
        "function_name": "string_to_upper",
        "params": {"text": "{input.text}"}
      },
      "is_long": {"type": "ConditionalBranchNode", "condition": "len('"'"'{shout.output}'"'"') > 20"},
      "summarise": {
        "type": "AIExecutionNode",
        "prompt": "Summarise in one sentence: {input.text}",
        "use_tools": false
      },
      "end": {"type": "EndNode", "label": "End"}
    },
    "connections": [
      {"from_id": "start", "to_id": "shout"},
      {"from_id": "shout", "to_id": "is_long"},
      {"from_id": "is_long", "to_id": "summarise", "condition": "true"},
      {"from_id": "is_long", "to_id": "end", "condition": "false"},
      {"from_id": "summarise", "to_id": "end"}
    ]
  }
}'
# {"success": true, ..., "workflow_id": "workflow_f9161600272c", "name": "Shout and summarise", ...}
```

`summarise` uses `{input.text}` rather than `{shout.output}` because `shout` is not its direct predecessor.

Run it:

```bash
curl -X POST http://localhost:8010/api/workflows/workflow_f9161600272c/execute \
  -H 'Content-Type: application/json' -d '{"inputs": {"text": "workflows run on a schedule"}}'
# {"success": true, "result": {
#   "start": {},
#   "shout": {"status": "success", "output": "WORKFLOWS RUN ON A SCHEDULE"},
#   "is_long": {"result": true},
#   "summarise": {"status": "success", "output": "...", "tokens": {"input_tokens": 10, "output_tokens": 15, "total_tokens": 25, "estimated": false}},
#   "end": {}}}

curl http://localhost:8010/api/workflows/workflow_f9161600272c/history
# {"success": true, "history": [{"id": 1, "status": "success", "started_at": "...", "duration_ms": 10, "error_message": null}], "total": 1}

curl http://localhost:8010/api/workflows/workflow_f9161600272c/executions/1/nodes   # 1: an id from the history
# {"success": true, "node_executions": [{"node_id": "start", "node_type": "StartNode", "status": "success", ...}, ...], "total": 5}
```

With `{"inputs": {"text": "short"}}` the branch is false: `summarise` is skipped and `end` runs after `is_long`.

Schedule it, then pause and remove the schedule:

```bash
curl -X POST http://localhost:8010/api/cron/ -H 'Content-Type: application/json' \
  -d '{"target_workflow_id": "workflow_f9161600272c", "schedule_description": "daily at 9am", "timezone": "America/New_York"}'
# {"success": true, "schedule_id": 4, "next_run_at": "2026-10-14T09:00:00-04:00", "recurrence_seconds": 86400,
#  "message": "Schedule created successfully. Next run at 2026-10-14 09:00:00 EDT"}

curl http://localhost:8010/api/cron/
curl -X PATCH http://localhost:8010/api/cron/4/toggle -H 'Content-Type: application/json' -d '{"enabled": false}'
curl -X DELETE http://localhost:8010/api/cron/4
```

A description or timezone the parser does not accept gets `400` with `{"detail": {"error": "...", "hint": "..."}}`
(the hint only for a description).

## Persistence

| Table             | Holds                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `workflows`       | `id`, `name`, `description`, `definition` (JSONB; written in canonical form)                                                   |
| `schedules`       | `target_workflow_id`, `enabled`, `timezone`, `schedule_description`, `next_run_at`, `recurrence_seconds`, `last_executed_at`   |
| `executions`      | One row per run: `workflow_id`, `status` (`running`, `success`, `failed`), `inputs`, `outputs`, `error_message`, `duration_ms` |
| `node_executions` | One row per node step: `execution_id`, `node_id`, `node_type`, `status`, `inputs`, `outputs`, `error_message`, `duration_ms`   |

## Related documentation

- [Tools](mcp.md) - the AI tools, including the workflow and cron tools
- [Console Guide](console.md) - the `/workflow` command
- [Environment Variables](../reference/environment-variables.md) - scheduler and database settings
