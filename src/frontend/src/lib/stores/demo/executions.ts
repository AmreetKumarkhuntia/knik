import type { DemoSnapshot } from '$types/stores/demo'
import type { ExecutionDetail, ExecutionStatus, NodeExecutionStep } from '$types/workflow'
import { demoWorkflows } from './workflows'

const workflows = new Map(demoWorkflows.map(workflow => [workflow.id, workflow]))

function execution(
  id: number,
  workflow_id: string,
  status: ExecutionStatus,
  started_at: string,
  duration_ms?: number,
  error_message?: string
): ExecutionDetail {
  const name = workflows.get(workflow_id)!.name
  return {
    id,
    workflow_id,
    workflow_name: name,
    status,
    started_at,
    ...(duration_ms !== undefined && {
      duration_ms,
      completed_at: new Date(Date.parse(started_at) + duration_ms).toISOString(),
    }),
    inputs: { sample: true, description: `Demo input for ${name}` },
    outputs: status === 'success' ? { summary: `Authored demo result for ${name}.` } : {},
    ...(error_message !== undefined && { error_message }),
  }
}

// A finished run splits its duration evenly; a failed or running one stops at its third node.
function timeline(run: ExecutionDetail): NodeExecutionStep[] {
  return Object.entries(workflows.get(run.workflow_id)!.definition.nodes).map(
    ([node_id, { type }], index) => {
      const status =
        run.status === 'success' || index < 2 ? 'success' : index === 2 ? run.status : 'pending'
      return {
        node_id,
        node_type: type,
        status,
        inputs: { sample: true },
        outputs: status === 'success' ? { sample: true } : {},
        started_at: run.started_at,
        ...(run.status === 'success' && {
          completed_at: run.completed_at,
          duration_ms: run.duration_ms! / 4,
        }),
      }
    }
  )
}

// Fixed historical sample dates and results; replay never simulates live progress.
const executions = [
  execution(9210, 'wf-1', 'success', '2026-10-08T12:41:08Z', 12400),
  execution(9209, 'wf-2', 'success', '2026-10-08T12:38:52Z', 8100),
  execution(9208, 'wf-3', 'running', '2026-10-08T12:37:14Z'),
  execution(
    9207,
    'wf-5',
    'failed',
    '2026-10-08T12:31:09Z',
    4700,
    'Demo failure: sample destination was unavailable.'
  ),
  execution(9206, 'wf-1', 'success', '2026-10-08T12:18:32Z', 11900),
  execution(9205, 'wf-4', 'success', '2026-10-08T12:02:50Z', 6300),
]
const timelines = Object.fromEntries(executions.map(run => [run.id, timeline(run)]))

export const demoExecutions = {
  executions,
  timelines,
  // Each workflow's run scenario replays its latest sample execution, as an independent copy.
  runScenarios: Object.fromEntries(
    demoWorkflows.map(({ id }) => {
      const run = executions.find(item => item.workflow_id === id)!
      return [id, structuredClone({ execution: run, timeline: timelines[run.id] })]
    })
  ),
} satisfies Pick<DemoSnapshot, 'executions' | 'timelines' | 'runScenarios'>
