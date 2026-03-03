# Workflow Scheduler System

## Overview

Knik's Workflow Scheduler is a cron-like system with node-based workflow execution. It supports directed acyclic graph (DAG) workflows with AI execution nodes, function execution nodes, conditional branching, and flow merging capabilities.

**Key Features:**

- **Cron scheduling** - Time-based workflow triggers with standard cron expressions
- **Node-based workflows** - Modular execution units connected as directed graphs
- **AI integration** - Execute AI queries as workflow nodes with full AIClient capabilities
- **Function execution** - Run MCP tools or custom functions as workflow nodes
- **Conditional branching** - Dynamic flow routing based on node results
- **Flow merging** - Combine results from parallel execution branches
- **Async execution** - Non-blocking workflow processing with background threads
- **Execution history** - Track workflow runs with detailed logs

## Architecture

### Three-Layer Structure

```text
scheduler/
├── models/              # Data structures (Workflow, Node, Schedule)
├── nodes/               # Node implementations (AI, Function, Condition, Merge)
├── workflow_engine.py   # DAG execution engine
├── cron_scheduler.py    # Cron-based scheduling
├── scheduler.py         # Main orchestrator
└── config.py           # Configuration
```

### Component Hierarchy

```text
Scheduler (orchestrator)
├── CronScheduler (schedule management)
│   ├── Schedule checking thread
│   └── Execution queue
└── WorkflowEngine (workflow execution)
    ├── DAG validation
    ├── Topological sort execution
    └── Node registry
```

## Node Flow Diagrams

### Basic Node Types

```mermaid
flowchart LR
    A[AIExecutionNode] --> B[Output]
    C[FunctionExecutionNode] --> D[Output]
    E[ConditionalBranchNode] --> |true| F[Path A]
    E --> |false| G[Path B]
    H[FlowMergeNode] --> I[Merged Output]
```

### Simple Linear Workflow

```mermaid
flowchart LR
    Start([Workflow Input]) --> N1[Read File]
    N1 --> N2[Analyze Content]
    N2 --> N3[Generate Summary]
    N3 --> End([Workflow Output])
```

### Conditional Branching Workflow

```mermaid
flowchart TD
    Start([Input: file_path]) --> N1[Get File Info]
    N1 --> N2{Check Size > 1MB?}
    N2 --> |true| N3[Summarize Large File]
    N2 --> |false| N4[Read Full File]
    N3 --> End([Output: content])
    N4 --> End
```

### Parallel Execution with Merge

```mermaid
flowchart TD
    Start([Input: text]) --> N1[Prepare Input]
    N1 --> N2[Model 1: Flash]
    N1 --> N3[Model 2: Pro]
    N2 --> N4[Merge Results]
    N3 --> N4
    N4 --> N5[Compare Analyses]
    N5 --> End([Output: comparison])
```

### Complex Multi-Branch Workflow

```mermaid
flowchart TD
    Start([Input: task]) --> N1[Parse Task]
    N1 --> N2{Task Type?}

    N2 --> |data_analysis| N3[Load Data]
    N2 --> |file_ops| N4[File Operation]
    N2 --> |ai_task| N5[AI Processing]

    N3 --> N6[Analyze Data]
    N6 --> N7{Has Errors?}
    N7 --> |true| N8[Error Report]
    N7 --> |false| N9[Success Report]

    N4 --> N10[Verify Result]
    N5 --> N11[Format Output]

    N8 --> Merge[Merge Results]
    N9 --> Merge
    N10 --> Merge
    N11 --> Merge

    Merge --> Final[Final Summary]
    Final --> End([Output: result])
```

### Real-World Example: Daily Log Analysis

```mermaid
flowchart TD
    Cron["Cron: 0 9 * * *"] -.triggers.-> Start

    Start([Start Workflow]) --> N1[Read Logs]
    N1 --> N2[Extract Errors]
    N1 --> N3[Count Requests]

    N2 --> N4{"Has Errors?"}
    N4 --> |true| N5[Analyze Errors]
    N4 --> |false| N6[Skip]

    N3 --> N7{High Traffic?}
    N7 --> |true| N8[Performance Analysis]
    N7 --> |false| N9[Skip]

    N5 --> Merge[Merge Reports]
    N6 --> Merge
    N8 --> Merge
    N9 --> Merge

    Merge --> N10[Daily Summary]
    N10 --> N11[Send Email]
    N11 --> End([Complete])
```

## Core Concepts

### Nodes

**BaseNode** - Abstract base class for all node types

```python
class BaseNode(ABC):
    def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Execute node logic. Return dict with results."""
        pass

    def validate(self) -> bool:
        """Validate node configuration."""
        pass

    def get_info(self) -> dict[str, Any]:
        """Get node metadata."""
        pass
```

**Node Types:**

1. **AIExecutionNode** - Execute AI queries
   - Wraps `AIClient.query()` method
   - Supports streaming responses
   - Full MCP tool access
   - Conversation context support

2. **FunctionExecutionNode** - Execute functions
   - Wraps `MCPServerRegistry.execute_tool()` for MCP tools
   - Supports custom Python functions
   - Structured input/output handling

3. **ConditionalBranchNode** - Route execution flow
   - Evaluates boolean expressions
   - Selects next node based on condition result
   - Supports multiple output paths

4. **FlowMergeNode** - Combine parallel flows
   - Waits for all input nodes to complete
   - Merges results into single output
   - Configurable merge strategies (concat, union, first-wins)

### Workflows

**Workflow Structure:**

```python
@dataclass
class Workflow:
    id: str
    name: str
    description: str
    nodes: dict[str, BaseNode]
    connections: list[NodeConnection]
    entry_node_id: str

    def validate(self) -> bool:
        """Validate workflow structure (DAG, connected, no orphans)"""
        pass

    def to_mermaid(self) -> str:
        """Export workflow to Mermaid diagram format"""
        pass
```

**Example Workflow Definition:**

```python
workflow = Workflow(
    id="daily_summary",
    name="Daily Summary Generator",
    description="Generate and send daily summary",
    nodes={
        "fetch_data": FunctionExecutionNode(
            node_id="fetch_data",
            function="read_file",
            params={"file_path": "/logs/daily.log"}
        ),
        "analyze": AIExecutionNode(
            node_id="analyze",
            prompt="Summarize this log: {fetch_data.output}",
            model="gemini-1.5-flash"
        ),
        "check_issues": ConditionalBranchNode(
            node_id="check_issues",
            condition="len({analyze.output.issues}) > 0"
        ),
        "send_alert": FunctionExecutionNode(
            node_id="send_alert",
            function="send_notification",
            params={"message": "{analyze.output}"}
        ),
        "merge": FlowMergeNode(node_id="merge")
    },
    connections=[
        NodeConnection(from_id="fetch_data", to_id="analyze"),
        NodeConnection(from_id="analyze", to_id="check_issues"),
        NodeConnection(from_id="check_issues", to_id="send_alert", condition="true"),
        NodeConnection(from_id="check_issues", to_id="merge", condition="false"),
        NodeConnection(from_id="send_alert", to_id="merge")
    ],
    entry_node_id="fetch_data"
)
```

### Schedules

**Cron Expression Format:**

```python
@dataclass
class Schedule:
    workflow_id: str
    cron_expression: str  # Standard cron: "minute hour day month weekday"
    enabled: bool = True
    timezone: str = "UTC"

    def next_run_time(self) -> datetime:
        """Calculate next execution time"""
        pass
```

**Example Schedules:**

```python
# Run every day at 9 AM
"0 9 * * *"

# Run every Monday at 8:30 AM
"30 8 * * 1"

# Run every 15 minutes
"*/15 * * * *"

# Run hourly on weekdays
"0 * * * 1-5"
```

## Usage Examples

### Basic Workflow Execution

```python
from imports import Scheduler, Workflow, AIExecutionNode, FunctionExecutionNode

# Create workflow
workflow = Workflow(
    id="hello_world",
    name="Hello World Workflow",
    description="Simple AI greeting workflow",
    nodes={
        "greet": AIExecutionNode(
            node_id="greet",
            prompt="Say hello to {name}",
            model="gemini-1.5-flash"
        )
    },
    connections=[],
    entry_node_id="greet"
)

# Initialize scheduler
scheduler = Scheduler()
scheduler.register_workflow(workflow)

# Execute workflow manually
result = scheduler.execute_workflow("hello_world", inputs={"name": "Alice"})
print(result)  # {"greet": {"output": "Hello Alice! How are you today?"}}
```

### Scheduled Workflow

```python
from imports import Scheduler, Schedule

# Create scheduler
scheduler = Scheduler()

# Register workflow (from previous example)
scheduler.register_workflow(workflow)

# Add cron schedule (run every day at 8 AM)
schedule = Schedule(
    workflow_id="hello_world",
    cron_expression="0 8 * * *",
    enabled=True
)
scheduler.add_schedule(schedule)

# Start scheduler
scheduler.start()

# Scheduler now runs workflows automatically
# Stop with: scheduler.stop()
```

### Conditional Branching

```python
workflow = Workflow(
    id="file_processor",
    name="File Size Checker",
    description="Process file based on size",
    nodes={
        "check_size": FunctionExecutionNode(
            node_id="check_size",
            function="file_info",
            params={"file_path": "{input.file_path}"}
        ),
        "size_check": ConditionalBranchNode(
            node_id="size_check",
            condition="{check_size.output.size} > 1000000"  # 1 MB
        ),
        "large_file": AIExecutionNode(
            node_id="large_file",
            prompt="Summarize this large file: {input.file_path}"
        ),
        "small_file": FunctionExecutionNode(
            node_id="small_file",
            function="read_file",
            params={"file_path": "{input.file_path}"}
        )
    },
    connections=[
        NodeConnection(from_id="check_size", to_id="size_check"),
        NodeConnection(from_id="size_check", to_id="large_file", condition="true"),
        NodeConnection(from_id="size_check", to_id="small_file", condition="false")
    ],
    entry_node_id="check_size"
)
```

### Parallel Execution with Merge

```python
workflow = Workflow(
    id="parallel_analysis",
    name="Multi-Model Analysis",
    description="Analyze with multiple AI models and merge results",
    nodes={
        "input": FunctionExecutionNode(
            node_id="input",
            function="read_file",
            params={"file_path": "{input.file_path}"}
        ),
        "model_1": AIExecutionNode(
            node_id="model_1",
            prompt="Analyze: {input.output}",
            model="gemini-1.5-flash"
        ),
        "model_2": AIExecutionNode(
            node_id="model_2",
            prompt="Analyze: {input.output}",
            model="gemini-1.5-pro"
        ),
        "merge": FlowMergeNode(
            node_id="merge",
            merge_strategy="concat"
        ),
        "final": AIExecutionNode(
            node_id="final",
            prompt="Compare these analyses: {merge.output}"
        )
    },
    connections=[
        NodeConnection(from_id="input", to_id="model_1"),
        NodeConnection(from_id="input", to_id="model_2"),
        NodeConnection(from_id="model_1", to_id="merge"),
        NodeConnection(from_id="model_2", to_id="merge"),
        NodeConnection(from_id="merge", to_id="final")
    ],
    entry_node_id="input"
)
```

### Integration with Existing AI Client

```python
from imports import AIClient, MCPServerRegistry, Scheduler, AIExecutionNode

# Initialize AI client with tools
ai_client = AIClient(
    provider="vertex",
    mcp_registry=MCPServerRegistry,
    system_instruction="You are a helpful assistant"
)

# Create scheduler with AI client
scheduler = Scheduler(ai_client=ai_client)

# AI nodes will use the shared AIClient instance
workflow = Workflow(
    id="ai_workflow",
    name="AI Workflow",
    nodes={
        "task": AIExecutionNode(
            node_id="task",
            prompt="Execute this task: {input.task}",
            use_tools=True  # Uses MCP tools from shared AI client
        )
    },
    connections=[],
    entry_node_id="task"
)

scheduler.register_workflow(workflow)
result = scheduler.execute_workflow("ai_workflow", inputs={"task": "read file.txt"})
```

## API Reference

### Scheduler

**Constructor:**

```python
Scheduler(
    ai_client: AIClient | None = None,
    config: SchedulerConfig | None = None
)
```

**Methods:**

```python
def register_workflow(self, workflow: Workflow) -> bool:
    """Register workflow for execution"""

def unregister_workflow(self, workflow_id: str) -> bool:
    """Unregister workflow"""

def add_schedule(self, schedule: Schedule) -> bool:
    """Add cron schedule"""

def remove_schedule(self, workflow_id: str) -> bool:
    """Remove cron schedule"""

def execute_workflow(
    self,
    workflow_id: str,
    inputs: dict[str, Any] = None
) -> dict[str, Any]:
    """Execute workflow manually"""

def start(self) -> None:
    """Start scheduler (background threads)"""

def stop(self) -> None:
    """Stop scheduler gracefully"""

def get_execution_history(
    self,
    workflow_id: str | None = None
) -> list[ExecutionRecord]:
    """Get workflow execution history"""

def is_running(self) -> bool:
    """Check if scheduler is running"""
```

### WorkflowEngine

**Constructor:**

```python
WorkflowEngine(ai_client: AIClient | None = None)
```

**Methods:**

```python
def execute_workflow(
    self,
    workflow: Workflow,
    inputs: dict[str, Any] = None
) -> dict[str, Any]:
    """Execute workflow as DAG"""

def validate_workflow(self, workflow: Workflow) -> bool:
    """Validate workflow structure (no cycles, connected)"""

def get_execution_trace(self) -> list[NodeExecutionRecord]:
    """Get detailed execution trace"""
```

### Node Classes

**AIExecutionNode:**

```python
AIExecutionNode(
    node_id: str,
    prompt: str,
    model: str = "gemini-1.5-flash",
    temperature: float = 0.7,
    use_tools: bool = False,
    streaming: bool = False
)
```

**FunctionExecutionNode:**

```python
FunctionExecutionNode(
    node_id: str,
    function: str,  # MCP tool name or custom function
    params: dict[str, Any] = None
)
```

**ConditionalBranchNode:**

```python
ConditionalBranchNode(
    node_id: str,
    condition: str  # Python expression with template vars
)
```

**FlowMergeNode:**

```python
FlowMergeNode(
    node_id: str,
    merge_strategy: str = "concat"  # concat, union, first-wins
)
```

## Configuration

**SchedulerConfig:**

```python
@dataclass
class SchedulerConfig:
    # Worker pool settings
    worker_pool_size: int = 4
    max_concurrent_workflows: int = 10

    # Schedule settings
    schedule_check_interval: float = 60.0  # seconds

    # Execution settings
    default_timeout: int = 300  # seconds
    retry_failed_nodes: bool = False
    max_retries: int = 3

    # History settings
    max_history_size: int = 1000
    history_retention_days: int = 30
```

**Environment Variables:**

```bash
# Scheduler settings
KNIK_SCHEDULER_WORKERS=4
KNIK_SCHEDULER_MAX_CONCURRENT=10
KNIK_SCHEDULER_CHECK_INTERVAL=60

# Database connection
KNIK_DB_HOST=localhost
KNIK_DB_PORT=5432
KNIK_DB_USER=user
KNIK_DB_PASS=password
KNIK_DB_NAME=knik
```

## Integration Patterns

### With Console App

```python
from imports import ConsoleApp, Scheduler

class ConsoleAppWithScheduler(ConsoleApp):
    def __init__(self):
        super().__init__()
        self.scheduler = Scheduler(ai_client=self.ai_client)

    def initialize(self):
        super().initialize()
        self._load_workflows()
        self.scheduler.start()

    def _load_workflows(self):
        # Load workflows from PostgreSQL database
        pass
```

**New Commands:**

- `/workflow list` - List registered workflows
- `/workflow run <id>` - Execute workflow manually
- `/schedule add <workflow_id> <cron>` - Add schedule
- `/schedule list` - List active schedules

### With GUI App

```python
from imports import GUIApp, Scheduler

class GUIAppWithScheduler(GUIApp):
    def _initialize_backend(self):
        super()._initialize_backend()
        self.scheduler = Scheduler(ai_client=self.ai_client)
        self.scheduler.start()

    def on_close(self):
        self.scheduler.stop()
        super().on_close()
```

**New UI Elements:**

- Workflow editor panel
- Schedule management panel
- Execution history viewer
- Visual workflow designer (node graph)

### With Web App

**Backend Routes:**

```python
# backend/routes/scheduler.py
@router.post("/workflows")
async def create_workflow(workflow: WorkflowSchema):
    scheduler.register_workflow(workflow)
    return {"success": True}

@router.post("/workflows/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, inputs: dict):
    result = scheduler.execute_workflow(workflow_id, inputs)
    return result

@router.get("/schedules")
async def list_schedules():
    return scheduler.get_schedules()

@router.post("/schedules")
async def add_schedule(schedule: ScheduleSchema):
    scheduler.add_schedule(schedule)
    return {"success": True}
```

## Persistence

**PostgreSQL Database:**

All scheduler data (workflows, schedules, execution history) is stored in a PostgreSQL database for efficient querying, concurrent access, and relational integrity.

```text
postgresql://user:password@localhost:5432/knik_scheduler  # PostgreSQL database URL
```

**Database Schema:**

```sql
-- Workflows table
CREATE TABLE workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,  -- Full workflow structure
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Schedules table
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    cron_expression TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- Execution history table
CREATE TABLE executions (
    id SERIAL PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    status TEXT NOT NULL,  -- 'success', 'failed', 'running'
    inputs JSONB,
    outputs JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- Node execution trace table
CREATE TABLE node_executions (
    id SERIAL PRIMARY KEY,
    execution_id INTEGER NOT NULL,
    node_id TEXT NOT NULL,
    node_type TEXT NOT NULL,
    status TEXT NOT NULL,
    inputs JSONB,
    outputs JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);
```

**Benefits:**

- Single source of truth for all scheduler data
- ACID transactions for data consistency
- Efficient querying and filtering (e.g., find all failed executions)
- Relational integrity (cascade deletes)
- Automatic indexing on foreign keys
- No file system dependencies or sync issues

**Future Migration:** The system can be extended to support directory-based storage for workflows and schedules if needed for version control or external editing.

## Error Handling

**Node Execution Errors:**

```python
# Nodes return structured error dicts
{
    "success": false,
    "error": "File not found: /path/to/file.txt",
    "node_id": "read_file",
    "timestamp": "2026-02-22T10:30:00Z"
}
```

**Workflow Execution Strategies:**

1. **Stop on error** (default) - Halt workflow immediately
2. **Continue with error propagation** - Pass error to downstream nodes
3. **Retry failed nodes** - Retry with exponential backoff

**Configuration:**

```python
scheduler_config = SchedulerConfig(
    retry_failed_nodes=True,
    max_retries=3
)
```

## Debugging

**Enable debug logging:**

```python
scheduler = Scheduler()
scheduler.set_debug_mode(True)  # Verbose logging

# Or via environment variable
export KNIK_SCHEDULER_DEBUG=true
```

**Execution trace:**

```python
result = scheduler.execute_workflow("my_workflow", inputs={...})

# Get detailed trace
trace = scheduler.workflow_engine.get_execution_trace()
for record in trace:
    print(f"{record.node_id}: {record.status} ({record.duration}ms)")
```

**Export workflow diagram:**

```python
workflow = scheduler.get_workflow("my_workflow")
mermaid_diagram = workflow.to_mermaid()

# Copy to https://mermaid.live/ for visualization
print(mermaid_diagram)
```

## Best Practices

1. **Keep workflows simple** - Break complex workflows into smaller, reusable units
2. **Validate early** - Use `workflow.validate()` before registration
3. **Use meaningful node IDs** - Helps debugging and template variable resolution
4. **Handle errors gracefully** - Design workflows with error paths
5. **Test workflows manually** - Execute manually before scheduling
6. **Monitor execution history** - Check for patterns in failures
7. **Use appropriate models** - Flash for speed, Pro for complex tasks
8. **Limit parallel branches** - Too many parallel nodes can overwhelm resources
9. **Set timeouts** - Prevent workflows from running indefinitely
10. **Document workflows** - Add clear descriptions for maintenance

## Examples

See comprehensive examples in:

- `demo/scheduler/basic_workflow.py` - Simple workflow examples
- `demo/scheduler/conditional_branching.py` - Branch and merge patterns
- `demo/scheduler/scheduled_workflows.py` - Cron scheduling examples
- `demo/scheduler/ai_integration.py` - AI node patterns

## Related Documentation

- [MCP.md](MCP.md) - MCP tools used in FunctionExecutionNode
- [CONSOLE.md](CONSOLE.md) - Console app integration
- [GUI.md](GUI.md) - GUI app integration
- [WEB_APP.md](WEB_APP.md) - Web app integration
- [API.md](API.md) - Core API reference
- [CONVERSATION_HISTORY.md](CONVERSATION_HISTORY.md) - AI context management

## Future Enhancements

- **Visual workflow editor** - Drag-and-drop node graph UI
- **Workflow marketplace** - Share and import community workflows
- **Advanced merge strategies** - Custom merge functions
- **Distributed execution** - Run workflows across multiple machines
- **Monitoring dashboard** - Real-time workflow execution visualization
- **Webhook triggers** - Execute workflows via HTTP endpoints
- **Workflow templates** - Pre-built workflow patterns
- **Version control** - Track workflow changes over time
