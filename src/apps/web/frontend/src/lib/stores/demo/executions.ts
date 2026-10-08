import type { DemoSnapshot } from '$types/stores/demo'

// Fixed historical sample dates and results; replay never simulates live progress.
export const demoExecutions = {
  executions: [
    {
      id: 9210,
      workflow_id: 'wf-1',
      workflow_name: 'Daily digest',
      status: 'success',
      started_at: '2026-10-08T12:41:08Z',
      duration_ms: 12400,
      completed_at: '2026-10-08T12:41:20.400Z',
      inputs: {
        sample: true,
        description: 'Demo input for Daily digest',
      },
      outputs: {
        summary: 'Authored demo result for Daily digest.',
      },
    },
    {
      id: 9209,
      workflow_id: 'wf-2',
      workflow_name: 'Summarise inbox',
      status: 'success',
      started_at: '2026-10-08T12:38:52Z',
      duration_ms: 8100,
      completed_at: '2026-10-08T12:39:00.100Z',
      inputs: {
        sample: true,
        description: 'Demo input for Summarise inbox',
      },
      outputs: {
        summary: 'Authored demo result for Summarise inbox.',
      },
    },
    {
      id: 9208,
      workflow_id: 'wf-3',
      workflow_name: 'Voice notes → tasks',
      status: 'running',
      started_at: '2026-10-08T12:37:14Z',
      inputs: {
        sample: true,
        description: 'Demo input for Voice notes → tasks',
      },
      outputs: {},
    },
    {
      id: 9207,
      workflow_id: 'wf-5',
      workflow_name: 'GitHub digest',
      status: 'failed',
      started_at: '2026-10-08T12:31:09Z',
      duration_ms: 4700,
      completed_at: '2026-10-08T12:31:13.700Z',
      inputs: {
        sample: true,
        description: 'Demo input for GitHub digest',
      },
      outputs: {},
      error_message: 'Demo failure: sample destination was unavailable.',
    },
    {
      id: 9206,
      workflow_id: 'wf-1',
      workflow_name: 'Daily digest',
      status: 'success',
      started_at: '2026-10-08T12:18:32Z',
      duration_ms: 11900,
      completed_at: '2026-10-08T12:18:43.900Z',
      inputs: {
        sample: true,
        description: 'Demo input for Daily digest',
      },
      outputs: {
        summary: 'Authored demo result for Daily digest.',
      },
    },
    {
      id: 9205,
      workflow_id: 'wf-4',
      workflow_name: 'Code review bot',
      status: 'success',
      started_at: '2026-10-08T12:02:50Z',
      duration_ms: 6300,
      completed_at: '2026-10-08T12:02:56.300Z',
      inputs: {
        sample: true,
        description: 'Demo input for Code review bot',
      },
      outputs: {
        summary: 'Authored demo result for Code review bot.',
      },
    },
  ],
  timelines: {
    '9205': [
      {
        node_id: 'start',
        node_type: 'StartNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:02:50Z',
        completed_at: '2026-10-08T12:02:56.300Z',
        duration_ms: 1575,
      },
      {
        node_id: 'prepare',
        node_type: 'FunctionExecutionNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:02:50Z',
        completed_at: '2026-10-08T12:02:56.300Z',
        duration_ms: 1575,
      },
      {
        node_id: 'summarize',
        node_type: 'AIExecutionNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:02:50Z',
        completed_at: '2026-10-08T12:02:56.300Z',
        duration_ms: 1575,
      },
      {
        node_id: 'end',
        node_type: 'EndNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:02:50Z',
        completed_at: '2026-10-08T12:02:56.300Z',
        duration_ms: 1575,
      },
    ],
    '9206': [
      {
        node_id: 'start',
        node_type: 'StartNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:18:32Z',
        completed_at: '2026-10-08T12:18:43.900Z',
        duration_ms: 2975,
      },
      {
        node_id: 'prepare',
        node_type: 'FunctionExecutionNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:18:32Z',
        completed_at: '2026-10-08T12:18:43.900Z',
        duration_ms: 2975,
      },
      {
        node_id: 'summarize',
        node_type: 'AIExecutionNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:18:32Z',
        completed_at: '2026-10-08T12:18:43.900Z',
        duration_ms: 2975,
      },
      {
        node_id: 'end',
        node_type: 'EndNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:18:32Z',
        completed_at: '2026-10-08T12:18:43.900Z',
        duration_ms: 2975,
      },
    ],
    '9207': [
      {
        node_id: 'start',
        node_type: 'StartNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:31:09Z',
      },
      {
        node_id: 'prepare',
        node_type: 'FunctionExecutionNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:31:09Z',
      },
      {
        node_id: 'summarize',
        node_type: 'AIExecutionNode',
        status: 'failed',
        inputs: {
          sample: true,
        },
        outputs: {},
        started_at: '2026-10-08T12:31:09Z',
      },
      {
        node_id: 'end',
        node_type: 'EndNode',
        status: 'pending',
        inputs: {
          sample: true,
        },
        outputs: {},
        started_at: '2026-10-08T12:31:09Z',
      },
    ],
    '9208': [
      {
        node_id: 'start',
        node_type: 'StartNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:37:14Z',
      },
      {
        node_id: 'prepare',
        node_type: 'FunctionExecutionNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:37:14Z',
      },
      {
        node_id: 'summarize',
        node_type: 'AIExecutionNode',
        status: 'running',
        inputs: {
          sample: true,
        },
        outputs: {},
        started_at: '2026-10-08T12:37:14Z',
      },
      {
        node_id: 'end',
        node_type: 'EndNode',
        status: 'pending',
        inputs: {
          sample: true,
        },
        outputs: {},
        started_at: '2026-10-08T12:37:14Z',
      },
    ],
    '9209': [
      {
        node_id: 'start',
        node_type: 'StartNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:38:52Z',
        completed_at: '2026-10-08T12:39:00.100Z',
        duration_ms: 2025,
      },
      {
        node_id: 'prepare',
        node_type: 'FunctionExecutionNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:38:52Z',
        completed_at: '2026-10-08T12:39:00.100Z',
        duration_ms: 2025,
      },
      {
        node_id: 'summarize',
        node_type: 'AIExecutionNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:38:52Z',
        completed_at: '2026-10-08T12:39:00.100Z',
        duration_ms: 2025,
      },
      {
        node_id: 'end',
        node_type: 'EndNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:38:52Z',
        completed_at: '2026-10-08T12:39:00.100Z',
        duration_ms: 2025,
      },
    ],
    '9210': [
      {
        node_id: 'start',
        node_type: 'StartNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:41:08Z',
        completed_at: '2026-10-08T12:41:20.400Z',
        duration_ms: 3100,
      },
      {
        node_id: 'prepare',
        node_type: 'FunctionExecutionNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:41:08Z',
        completed_at: '2026-10-08T12:41:20.400Z',
        duration_ms: 3100,
      },
      {
        node_id: 'summarize',
        node_type: 'AIExecutionNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:41:08Z',
        completed_at: '2026-10-08T12:41:20.400Z',
        duration_ms: 3100,
      },
      {
        node_id: 'end',
        node_type: 'EndNode',
        status: 'success',
        inputs: {
          sample: true,
        },
        outputs: {
          sample: true,
        },
        started_at: '2026-10-08T12:41:08Z',
        completed_at: '2026-10-08T12:41:20.400Z',
        duration_ms: 3100,
      },
    ],
  },
  runScenarios: {
    'wf-1': {
      execution: {
        id: 9210,
        workflow_id: 'wf-1',
        workflow_name: 'Daily digest',
        status: 'success',
        started_at: '2026-10-08T12:41:08Z',
        duration_ms: 12400,
        completed_at: '2026-10-08T12:41:20.400Z',
        inputs: {
          sample: true,
          description: 'Demo input for Daily digest',
        },
        outputs: {
          summary: 'Authored demo result for Daily digest.',
        },
      },
      timeline: [
        {
          node_id: 'start',
          node_type: 'StartNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:41:08Z',
          completed_at: '2026-10-08T12:41:20.400Z',
          duration_ms: 3100,
        },
        {
          node_id: 'prepare',
          node_type: 'FunctionExecutionNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:41:08Z',
          completed_at: '2026-10-08T12:41:20.400Z',
          duration_ms: 3100,
        },
        {
          node_id: 'summarize',
          node_type: 'AIExecutionNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:41:08Z',
          completed_at: '2026-10-08T12:41:20.400Z',
          duration_ms: 3100,
        },
        {
          node_id: 'end',
          node_type: 'EndNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:41:08Z',
          completed_at: '2026-10-08T12:41:20.400Z',
          duration_ms: 3100,
        },
      ],
    },
    'wf-2': {
      execution: {
        id: 9209,
        workflow_id: 'wf-2',
        workflow_name: 'Summarise inbox',
        status: 'success',
        started_at: '2026-10-08T12:38:52Z',
        duration_ms: 8100,
        completed_at: '2026-10-08T12:39:00.100Z',
        inputs: {
          sample: true,
          description: 'Demo input for Summarise inbox',
        },
        outputs: {
          summary: 'Authored demo result for Summarise inbox.',
        },
      },
      timeline: [
        {
          node_id: 'start',
          node_type: 'StartNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:38:52Z',
          completed_at: '2026-10-08T12:39:00.100Z',
          duration_ms: 2025,
        },
        {
          node_id: 'prepare',
          node_type: 'FunctionExecutionNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:38:52Z',
          completed_at: '2026-10-08T12:39:00.100Z',
          duration_ms: 2025,
        },
        {
          node_id: 'summarize',
          node_type: 'AIExecutionNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:38:52Z',
          completed_at: '2026-10-08T12:39:00.100Z',
          duration_ms: 2025,
        },
        {
          node_id: 'end',
          node_type: 'EndNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:38:52Z',
          completed_at: '2026-10-08T12:39:00.100Z',
          duration_ms: 2025,
        },
      ],
    },
    'wf-3': {
      execution: {
        id: 9208,
        workflow_id: 'wf-3',
        workflow_name: 'Voice notes → tasks',
        status: 'running',
        started_at: '2026-10-08T12:37:14Z',
        inputs: {
          sample: true,
          description: 'Demo input for Voice notes → tasks',
        },
        outputs: {},
      },
      timeline: [
        {
          node_id: 'start',
          node_type: 'StartNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:37:14Z',
        },
        {
          node_id: 'prepare',
          node_type: 'FunctionExecutionNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:37:14Z',
        },
        {
          node_id: 'summarize',
          node_type: 'AIExecutionNode',
          status: 'running',
          inputs: {
            sample: true,
          },
          outputs: {},
          started_at: '2026-10-08T12:37:14Z',
        },
        {
          node_id: 'end',
          node_type: 'EndNode',
          status: 'pending',
          inputs: {
            sample: true,
          },
          outputs: {},
          started_at: '2026-10-08T12:37:14Z',
        },
      ],
    },
    'wf-4': {
      execution: {
        id: 9205,
        workflow_id: 'wf-4',
        workflow_name: 'Code review bot',
        status: 'success',
        started_at: '2026-10-08T12:02:50Z',
        duration_ms: 6300,
        completed_at: '2026-10-08T12:02:56.300Z',
        inputs: {
          sample: true,
          description: 'Demo input for Code review bot',
        },
        outputs: {
          summary: 'Authored demo result for Code review bot.',
        },
      },
      timeline: [
        {
          node_id: 'start',
          node_type: 'StartNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:02:50Z',
          completed_at: '2026-10-08T12:02:56.300Z',
          duration_ms: 1575,
        },
        {
          node_id: 'prepare',
          node_type: 'FunctionExecutionNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:02:50Z',
          completed_at: '2026-10-08T12:02:56.300Z',
          duration_ms: 1575,
        },
        {
          node_id: 'summarize',
          node_type: 'AIExecutionNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:02:50Z',
          completed_at: '2026-10-08T12:02:56.300Z',
          duration_ms: 1575,
        },
        {
          node_id: 'end',
          node_type: 'EndNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:02:50Z',
          completed_at: '2026-10-08T12:02:56.300Z',
          duration_ms: 1575,
        },
      ],
    },
    'wf-5': {
      execution: {
        id: 9207,
        workflow_id: 'wf-5',
        workflow_name: 'GitHub digest',
        status: 'failed',
        started_at: '2026-10-08T12:31:09Z',
        duration_ms: 4700,
        completed_at: '2026-10-08T12:31:13.700Z',
        inputs: {
          sample: true,
          description: 'Demo input for GitHub digest',
        },
        outputs: {},
        error_message: 'Demo failure: sample destination was unavailable.',
      },
      timeline: [
        {
          node_id: 'start',
          node_type: 'StartNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:31:09Z',
        },
        {
          node_id: 'prepare',
          node_type: 'FunctionExecutionNode',
          status: 'success',
          inputs: {
            sample: true,
          },
          outputs: {
            sample: true,
          },
          started_at: '2026-10-08T12:31:09Z',
        },
        {
          node_id: 'summarize',
          node_type: 'AIExecutionNode',
          status: 'failed',
          inputs: {
            sample: true,
          },
          outputs: {},
          started_at: '2026-10-08T12:31:09Z',
        },
        {
          node_id: 'end',
          node_type: 'EndNode',
          status: 'pending',
          inputs: {
            sample: true,
          },
          outputs: {},
          started_at: '2026-10-08T12:31:09Z',
        },
      ],
    },
  },
} satisfies Pick<DemoSnapshot, 'executions' | 'timelines' | 'runScenarios'>
