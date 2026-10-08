import type { DemoSnapshot } from '$types/stores/demo'

export const demoChat = {
  conversations: [
    {
      id: '1',
      title: 'Refactor Python pipeline',
      messages: [
        {
          id: 'demo-user-0',
          role: 'user',
          content: 'Refactor Python pipeline',
          timestamp: '2026-10-08T09:00:00Z',
          metadata: {
            demo: true,
          },
        },
        {
          id: 'demo-assistant-0',
          role: 'assistant',
          content:
            'This is an authored demo conversation about refactor python pipeline. Replace inner loop with a generator…',
          timestamp: '2026-10-08T09:00:01Z',
          metadata: {
            demo: true,
          },
        },
      ],
      created_at: '2026-10-08T09:00:00Z',
      updated_at: '2026-10-08T09:00:01Z',
      summary_message_id: null,
      compacted_count: 0,
      total_tokens: 0,
      preview: 'Replace inner loop with a generator…',
      message_count: 2,
    },
    {
      id: '2',
      title: 'API docs for /v1/synth',
      messages: [
        {
          id: 'demo-user-1',
          role: 'user',
          content: 'API docs for /v1/synth',
          timestamp: '2026-10-08T09:00:00Z',
          metadata: {
            demo: true,
          },
        },
        {
          id: 'demo-assistant-1',
          role: 'assistant',
          content:
            'This is an authored demo conversation about api docs for /v1/synth. Endpoint accepts voice + text…',
          timestamp: '2026-10-08T09:00:01Z',
          metadata: {
            demo: true,
          },
        },
      ],
      created_at: '2026-10-08T09:00:00Z',
      updated_at: '2026-10-08T09:00:01Z',
      summary_message_id: null,
      compacted_count: 0,
      total_tokens: 0,
      preview: 'Endpoint accepts voice + text…',
      message_count: 2,
    },
    {
      id: '3',
      title: 'Debug React state',
      messages: [
        {
          id: 'demo-user-2',
          role: 'user',
          content: 'Debug React state',
          timestamp: '2026-10-08T09:00:00Z',
          metadata: {
            demo: true,
          },
        },
        {
          id: 'demo-assistant-2',
          role: 'assistant',
          content:
            'This is an authored demo conversation about debug react state. useEffect dependency missing…',
          timestamp: '2026-10-08T09:00:01Z',
          metadata: {
            demo: true,
          },
        },
      ],
      created_at: '2026-10-08T09:00:00Z',
      updated_at: '2026-10-08T09:00:01Z',
      summary_message_id: null,
      compacted_count: 0,
      total_tokens: 0,
      preview: 'useEffect dependency missing…',
      message_count: 2,
    },
    {
      id: '4',
      title: 'Voice notes → tasks',
      messages: [
        {
          id: 'demo-user-3',
          role: 'user',
          content: 'Voice notes → tasks',
          timestamp: '2026-10-08T09:00:00Z',
          metadata: {
            demo: true,
          },
        },
        {
          id: 'demo-assistant-3',
          role: 'assistant',
          content:
            'This is an authored demo conversation about voice notes → tasks. Trigger every 15 min, summarise inbox…',
          timestamp: '2026-10-08T09:00:01Z',
          metadata: {
            demo: true,
          },
        },
      ],
      created_at: '2026-10-08T09:00:00Z',
      updated_at: '2026-10-08T09:00:01Z',
      summary_message_id: null,
      compacted_count: 0,
      total_tokens: 0,
      preview: 'Trigger every 15 min, summarise inbox…',
      message_count: 2,
    },
    {
      id: '5',
      title: 'MCP shell tool wrapper',
      messages: [
        {
          id: 'demo-user-4',
          role: 'user',
          content: 'MCP shell tool wrapper',
          timestamp: '2026-10-08T09:00:00Z',
          metadata: {
            demo: true,
          },
        },
        {
          id: 'demo-assistant-4',
          role: 'assistant',
          content:
            'This is an authored demo conversation about mcp shell tool wrapper. Wrap tar + ssh into a single call…',
          timestamp: '2026-10-08T09:00:01Z',
          metadata: {
            demo: true,
          },
        },
      ],
      created_at: '2026-10-08T09:00:00Z',
      updated_at: '2026-10-08T09:00:01Z',
      summary_message_id: null,
      compacted_count: 0,
      total_tokens: 0,
      preview: 'Wrap tar + ssh into a single call…',
      message_count: 2,
    },
  ],
  activeConversationId: null,
  chatScenarios: [
    {
      prompt: 'Refactor my Python script',
      replies: [
        {
          id: 'demo-suggestion-0',
          role: 'assistant',
          content:
            'Here is a demo refactoring checklist: extract pure functions, name each transformation, and test the result with a small input.',
          timestamp: '2026-10-08T09:00:01Z',
          metadata: {
            demo: true,
          },
        },
      ],
    },
    {
      prompt: 'Draft a blog post outline',
      replies: [
        {
          id: 'demo-suggestion-1',
          role: 'assistant',
          content:
            'Demo outline: introduce on-device speech, explain local inference, discuss latency and privacy, then finish with practical examples.',
          timestamp: '2026-10-08T09:00:01Z',
          metadata: {
            demo: true,
          },
        },
      ],
    },
    {
      prompt: 'Find the bug in this hook',
      replies: [
        {
          id: 'demo-suggestion-2',
          role: 'assistant',
          content:
            'Demo debugging checklist: check the effect dependencies, use functional state updates, and verify cleanup on unmount.',
          timestamp: '2026-10-08T09:00:01Z',
          metadata: {
            demo: true,
          },
        },
      ],
    },
    {
      prompt: 'Build a daily digest flow',
      replies: [
        {
          id: 'demo-suggestion-3',
          role: 'assistant',
          content:
            'Demo plan: collect the input, transform it in a pure step, validate the output, and save the result.',
          timestamp: '2026-10-08T09:00:01Z',
          metadata: {
            demo: true,
          },
        },
      ],
    },
  ],
} satisfies Pick<DemoSnapshot, 'conversations' | 'activeConversationId' | 'chatScenarios'>
