import type { CatalogState } from '$types/stores/catalogs'

export const demoCatalogs = {
  providers: [
    {
      id: 'google',
      name: 'Google AI',
    },
    {
      id: 'openai',
      name: 'OpenAI',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
    },
    {
      id: 'local',
      name: 'Local (Ollama)',
    },
  ],
  models: [
    {
      id: 'gemini-1.5-flash',
      label: 'Gemini 1.5 Flash',
      vendor: 'Google',
      tag: 'Fast',
      badge: 'teal',
      providerId: 'google',
    },
    {
      id: 'gpt-4o',
      label: 'GPT-4o',
      vendor: 'OpenAI',
      tag: 'Balanced',
      badge: 'primary',
      providerId: 'openai',
    },
    {
      id: 'claude-3.7',
      label: 'Claude 3.7 Sonnet',
      vendor: 'Anthropic',
      tag: 'Deep',
      badge: 'violet',
      providerId: 'anthropic',
    },
    {
      id: 'llama-3.1-70b',
      label: 'Llama 3.1 70B',
      vendor: 'Local',
      tag: 'Private',
      badge: 'success',
      providerId: 'local',
    },
  ],
  tools: [
    {
      name: 'shell',
      category: 'System',
      count: 4,
      enabled: true,
    },
    {
      name: 'filesystem',
      category: 'System',
      count: 6,
      enabled: true,
    },
    {
      name: 'github',
      category: 'Dev',
      count: 5,
      enabled: true,
    },
    {
      name: 'browser',
      category: 'Web',
      count: 3,
      enabled: true,
    },
    {
      name: 'gmail',
      category: 'Comms',
      count: 4,
      enabled: true,
    },
    {
      name: 'slack',
      category: 'Comms',
      count: 3,
      enabled: true,
    },
    {
      name: 'calendar',
      category: 'Comms',
      count: 3,
      enabled: true,
    },
  ],
  suggestions: [
    {
      id: 'suggestion-1',
      icon: 'code',
      tag: 'Code',
      title: 'Refactor my Python script',
      subtitle: 'Optimize performance and readability',
    },
    {
      id: 'suggestion-2',
      icon: 'edit_note',
      tag: 'Write',
      title: 'Draft a blog post outline',
      subtitle: 'On the future of on-device TTS',
    },
    {
      id: 'suggestion-3',
      icon: 'bug_report',
      tag: 'Debug',
      title: 'Find the bug in this hook',
      subtitle: 'State goes stale after fetch',
    },
    {
      id: 'suggestion-4',
      icon: 'account_tree',
      tag: 'Workflow',
      title: 'Build a daily digest flow',
      subtitle: 'Summarise + deliver to Slack at 9am',
    },
  ],
} satisfies CatalogState
