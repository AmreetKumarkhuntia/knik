export const UI_TEXT = {
  welcome: {
    title: 'How can I help you today?',
    description: 'Knik AI can assist with coding, content generation, and complex workflows.',
  },

  search: {
    placeholder: 'Search...',
    workflowsPlaceholder: 'Search workflows...',
  },

  form: {
    selectPlaceholder: 'Select an option',
    requiredIndicator: '*',
  },

  empty: {
    defaultIcon: '📜',
    noHistoryTitle: 'No history yet',
    noHistoryDescription: 'Start a conversation to see it here',
    noNodeData: 'No node execution data available',
  },

  workflow: {
    create: 'Create Workflow',
    metrics: {
      total: 'Total Workflows',
      executionsToday: 'Executions Today',
      successRate: 'Success Rate',
    },
    sections: {
      workflows: 'Workflows',
      recentExecutions: 'Recent Executions',
    },
    buttons: {
      viewAll: 'View All',
    },
    delete: {
      title: 'Delete Workflow',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    },
  },

  execution: {
    tabs: {
      overview: 'Overview',
      nodeTrace: 'Node Trace',
      inputs: 'Inputs',
      outputs: 'Outputs',
    },
    labels: {
      workflowId: 'Workflow ID',
      duration: 'Duration',
      startedAt: 'Started At',
      completedAt: 'Completed At',
      error: 'Error',
    },
  },

  chat: {
    buttons: {
      copy: 'Copy message',
      like: 'Like message',
      regenerate: 'Regenerate response',
    },
  },

  nav: {
    navigation: 'Navigation',
    recentConversations: 'Recent Conversations',
    newChat: 'New Chat',
    chat: 'Chat',
    workflows: 'Workflows',
    themeSettings: 'Theme Settings',
    clearHistory: 'Clear History',
    settings: 'Settings',
  },

  status: {
    pro: 'PRO',
    admin: 'ADMIN',
    basic: 'BASIC',
    proAccount: 'Pro Account',
  },

  trends: {
    positive: '+12%',
    moderatePositive: '+5.2%',
    steady: 'Steady',
  },
}

export const ACCOUNT = {
  default: {
    initials: 'AR',
    name: 'Alex Rivera',
    accountType: 'Pro Account',
  },
  profileLabel: (name?: string) => `${name || ACCOUNT.default.name || 'User'}'s profile`,
}

export const BADGE = {
  types: {
    pro: 'pro',
    admin: 'admin',
    basic: 'basic',
  },
}

export const NODE_LABELS = {
  start: 'Start',
  end: 'End',
}

export const AI_DEFAULTS = {
  model: 'gemini-1.5-flash',
  prompt: 'Enter prompt',
  function: 'new_function',
  condition: 'true',
  mergeStrategy: 'concat',
}
