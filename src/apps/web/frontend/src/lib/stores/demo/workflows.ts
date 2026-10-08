import type { Workflow } from '$types/workflow'

// Authored sample definitions; no node executes code or contacts providers.
export const demoWorkflows = [
  {
    id: 'wf-1',
    name: 'Daily digest',
    description: 'Demo: RSS + GitHub + Gmail → summary',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-07T09:00:00Z',
    definition: {
      nodes: {
        start: {
          type: 'StartNode',
          label: 'Start',
        },
        prepare: {
          type: 'FunctionExecutionNode',
          function_name: 'demo.prepare_digest',
          params: {
            sample: true,
          },
        },
        summarize: {
          type: 'AIExecutionNode',
          model: 'gemini-1.5-flash',
          prompt: 'Summarize the supplied demo input for Daily digest.',
          temperature: 0.7,
          use_tools: false,
        },
        end: {
          type: 'EndNode',
          label: 'End',
        },
      },
      connections: [
        {
          from_id: 'start',
          to_id: 'prepare',
        },
        {
          from_id: 'prepare',
          to_id: 'summarize',
        },
        {
          from_id: 'summarize',
          to_id: 'end',
        },
      ],
    },
  },
  {
    id: 'wf-2',
    name: 'Summarise inbox',
    description: 'Demo: Triage + label unread mail',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-07T09:00:00Z',
    definition: {
      nodes: {
        start: {
          type: 'StartNode',
          label: 'Start',
        },
        prepare: {
          type: 'FunctionExecutionNode',
          function_name: 'demo.prepare_inbox',
          params: {
            sample: true,
          },
        },
        summarize: {
          type: 'AIExecutionNode',
          model: 'gemini-1.5-flash',
          prompt: 'Summarize the supplied demo input for Summarise inbox.',
          temperature: 0.7,
          use_tools: false,
        },
        end: {
          type: 'EndNode',
          label: 'End',
        },
      },
      connections: [
        {
          from_id: 'start',
          to_id: 'prepare',
        },
        {
          from_id: 'prepare',
          to_id: 'summarize',
        },
        {
          from_id: 'summarize',
          to_id: 'end',
        },
      ],
    },
  },
  {
    id: 'wf-3',
    name: 'Voice notes → tasks',
    description: 'Demo: Kokoro transcribe → Linear issues',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-07T09:00:00Z',
    definition: {
      nodes: {
        start: {
          type: 'StartNode',
          label: 'Start',
        },
        prepare: {
          type: 'FunctionExecutionNode',
          function_name: 'demo.prepare_notes',
          params: {
            sample: true,
          },
        },
        summarize: {
          type: 'AIExecutionNode',
          model: 'gemini-1.5-flash',
          prompt: 'Summarize the supplied demo input for Voice notes → tasks.',
          temperature: 0.7,
          use_tools: false,
        },
        end: {
          type: 'EndNode',
          label: 'End',
        },
      },
      connections: [
        {
          from_id: 'start',
          to_id: 'prepare',
        },
        {
          from_id: 'prepare',
          to_id: 'summarize',
        },
        {
          from_id: 'summarize',
          to_id: 'end',
        },
      ],
    },
  },
  {
    id: 'wf-4',
    name: 'Code review bot',
    description: 'Demo: Diff → review comments on PRs',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-07T09:00:00Z',
    definition: {
      nodes: {
        start: {
          type: 'StartNode',
          label: 'Start',
        },
        prepare: {
          type: 'FunctionExecutionNode',
          function_name: 'demo.prepare_diff',
          params: {
            sample: true,
          },
        },
        summarize: {
          type: 'AIExecutionNode',
          model: 'gemini-1.5-flash',
          prompt: 'Summarize the supplied demo input for Code review bot.',
          temperature: 0.7,
          use_tools: false,
        },
        end: {
          type: 'EndNode',
          label: 'End',
        },
      },
      connections: [
        {
          from_id: 'start',
          to_id: 'prepare',
        },
        {
          from_id: 'prepare',
          to_id: 'summarize',
        },
        {
          from_id: 'summarize',
          to_id: 'end',
        },
      ],
    },
  },
  {
    id: 'wf-5',
    name: 'GitHub digest',
    description: 'Demo: Star + release watch → Slack',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-07T09:00:00Z',
    definition: {
      nodes: {
        start: {
          type: 'StartNode',
          label: 'Start',
        },
        prepare: {
          type: 'FunctionExecutionNode',
          function_name: 'demo.prepare_releases',
          params: {
            sample: true,
          },
        },
        summarize: {
          type: 'AIExecutionNode',
          model: 'gemini-1.5-flash',
          prompt: 'Summarize the supplied demo input for GitHub digest.',
          temperature: 0.7,
          use_tools: false,
        },
        end: {
          type: 'EndNode',
          label: 'End',
        },
      },
      connections: [
        {
          from_id: 'start',
          to_id: 'prepare',
        },
        {
          from_id: 'prepare',
          to_id: 'summarize',
        },
        {
          from_id: 'summarize',
          to_id: 'end',
        },
      ],
    },
  },
] satisfies Workflow[]
