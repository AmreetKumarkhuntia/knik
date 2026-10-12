import type { Workflow } from '$types/workflow'

// Authored sample definitions; no node executes code or contacts providers.
function workflow(id: string, name: string, description: string, fn: string): Workflow {
  return {
    id,
    name,
    description,
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-07T09:00:00Z',
    definition: {
      nodes: {
        start: { type: 'StartNode', label: 'Start' },
        prepare: {
          type: 'FunctionExecutionNode',
          function_name: `demo.prepare_${fn}`,
          params: { sample: true },
        },
        summarize: {
          type: 'AIExecutionNode',
          model: 'gemini-1.5-flash',
          prompt: `Summarize the supplied demo input for ${name}.`,
          temperature: 0.7,
          use_tools: false,
        },
        end: { type: 'EndNode', label: 'End' },
      },
      connections: [
        { from_id: 'start', to_id: 'prepare' },
        { from_id: 'prepare', to_id: 'summarize' },
        { from_id: 'summarize', to_id: 'end' },
      ],
    },
  }
}

export const demoWorkflows = [
  workflow('wf-1', 'Daily digest', 'Demo: RSS + GitHub + Gmail → summary', 'digest'),
  workflow('wf-2', 'Summarise inbox', 'Demo: Triage + label unread mail', 'inbox'),
  workflow('wf-3', 'Voice notes → tasks', 'Demo: Kokoro transcribe → Linear issues', 'notes'),
  workflow('wf-4', 'Code review bot', 'Demo: Diff → review comments on PRs', 'diff'),
  workflow('wf-5', 'GitHub digest', 'Demo: Star + release watch → Slack', 'releases'),
]
