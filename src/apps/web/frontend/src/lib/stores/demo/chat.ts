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
            tool_calls: [
              {
                id: 'demo-call-history-read',
                kind: 'tool',
                tool_name: 'read_file',
                tool_args: { path: 'pipeline.py' },
                tool_result: { path: 'pipeline.py', lines: 142 },
                duration_ms: 600,
              },
            ],
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
            'I ran the **python-refactor** skill over `pipeline.py` and read the file to check its plan.\n\n' +
            '1. **Extract pure functions.** `load_rows` and `clean_row` no longer touch globals, so each can be tested alone.\n' +
            '2. **Name each transformation.** The nested loop becomes `normalize_prices`, a generator that yields one row at a time.\n' +
            '3. **Test with a small input.** A five-row fixture covers the empty, duplicate and malformed cases.\n\n' +
            'The behaviour is unchanged, and memory use no longer grows with the size of the input.',
          timestamp: '2026-10-08T09:00:01Z',
          metadata: {
            demo: true,
            tool_calls: [
              {
                id: 'demo-call-refactor-skill',
                kind: 'skill',
                tool_name: 'python-refactor',
                tool_args: { file: 'pipeline.py' },
                tool_result:
                  '## Refactor plan\n\n- Extract `load_rows` and `clean_row` as pure functions\n- Replace the nested loop with a `normalize_prices` generator\n- Add a five-row fixture test',
                duration_ms: 1200,
              },
              {
                id: 'demo-call-refactor-read',
                kind: 'tool',
                tool_name: 'read_file',
                tool_args: { path: 'pipeline.py' },
                tool_result: { path: 'pipeline.py', lines: 142, functions: ['main', 'load_rows'] },
                duration_ms: 450,
              },
            ],
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
            'I found two related drafts in Notion and built on them.\n\n' +
            '- **Why on-device speech.** Start with latency and privacy, the two things users notice first.\n' +
            '- **How local inference works.** Cover model size, quantization and the audio pipeline.\n' +
            '- **Trade-offs.** Compare accuracy and battery use with a cloud service.\n' +
            '- **Practical examples.** Close with voice notes, dictation and offline commands.',
          timestamp: '2026-10-08T09:00:01Z',
          metadata: {
            demo: true,
            tool_calls: [
              {
                id: 'demo-call-outline-notion',
                kind: 'mcp',
                tool_name: 'notion.search',
                tool_args: { query: 'on-device speech', limit: 5 },
                tool_result: {
                  results: [
                    { title: 'Local inference notes', updated: '2026-09-30' },
                    { title: 'Speech latency benchmarks', updated: '2026-09-12' },
                  ],
                },
                duration_ms: 900,
              },
            ],
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
            'The first test run failed in `useCounter`, so I read the hook.\n\n' +
            'The effect reads `count` but its dependency list is empty, so the interval keeps the first value forever. ' +
            'Use a functional update, `setCount(c => c + 1)`, and clear the interval in the cleanup so it stops on unmount.',
          timestamp: '2026-10-08T09:00:01Z',
          metadata: {
            demo: true,
            tool_calls: [
              {
                id: 'demo-call-hook-tests',
                kind: 'tool',
                tool_name: 'run_tests',
                tool_args: { pattern: 'useCounter' },
                error:
                  '2 failed, 4 passed: useCounter › increments every second, useCounter › stops on unmount',
                duration_ms: 1400,
              },
              {
                id: 'demo-call-hook-read',
                kind: 'tool',
                tool_name: 'read_file',
                tool_args: { path: 'src/hooks/useCounter.ts' },
                tool_result: { path: 'src/hooks/useCounter.ts', lines: 18 },
                duration_ms: 400,
              },
            ],
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
