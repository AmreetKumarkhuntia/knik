// UI text and labels constants
export const UI_TEXT = {
  // Welcome section
  welcome: {
    title: 'How can I help you today?',
    description: 'Knik AI can assist with coding, content generation, and complex workflows.',
  },

  // Search
  search: {
    placeholder: 'Search...',
    workflowsPlaceholder: 'Search workflows...',
  },

  // Forms
  form: {
    selectPlaceholder: 'Select an option',
    requiredIndicator: '*',
  },

  // Empty states
  empty: {
    defaultIcon: '📜',
    noHistoryTitle: 'No history yet',
    noHistoryDescription: 'Start a conversation to see it here',
    noNodeData: 'No node execution data available',
  },

  // Workflow Hub
  workflow: {
    title: 'Workflow Hub',
    description: 'Monitor and manage your enterprise automation pipelines.',
    create: 'Create Workflow',
    metrics: {
      total: 'Total Workflows',
      executionsToday: 'Executions Today',
      successRate: 'Success Rate',
    },
    sections: {
      topWorkflows: 'Top Performing Workflows',
      recentActivity: 'Recent Activity',
    },
    table: {
      workflowName: 'Workflow Name',
      status: 'Status',
      executions: 'Executions',
      success: 'Success',
    },
    buttons: {
      viewAll: 'View All',
      clearAll: 'Clear all',
      viewDetails: 'View detailed activity log',
    },
  },

  // Execution Details
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

  // Chat Panel
  chat: {
    buttons: {
      copy: 'Copy message',
      like: 'Like message',
      regenerate: 'Regenerate response',
    },
  },

  // Navigation
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

  // Status and badges
  status: {
    pro: 'PRO',
    admin: 'ADMIN',
    basic: 'BASIC',
    proAccount: 'Pro Account',
  },

  // Trends
  trends: {
    positive: '+12%',
    moderatePositive: '+5.2%',
    steady: 'Steady',
  },
}

// Account constants
export const ACCOUNT = {
  default: {
    initials: 'AR',
    name: 'Alex Rivera',
    accountType: 'Pro Account',
  },
  profileLabel: (name?: string) => `${name || ACCOUNT.default.name || 'User'}'s profile`,
}

// Badge configuration
export const BADGE = {
  types: {
    pro: 'pro',
    admin: 'admin',
    basic: 'basic',
  },
}

// Node labels
export const NODE_LABELS = {
  start: 'Start',
  end: 'End',
}

// Default AI values
export const AI_DEFAULTS = {
  model: 'gemini-1.5-flash',
  prompt: 'Enter prompt',
  function: 'new_function',
  condition: 'true',
  mergeStrategy: 'concat',
}
