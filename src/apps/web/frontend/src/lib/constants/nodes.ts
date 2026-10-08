import type { NodeMetadata, NodeRegistry } from '$types/node-registry'

export const NODE_REGISTRY: NodeRegistry = {
  StartNode: {
    type: 'StartNode',
    label: 'Start',
    typeLabel: 'Entry point',
    icon: 'play_arrow',
    colors: {
      primary: 'green',
      iconBg: 'bg-[color-mix(in_srgb,var(--success)_10%,transparent)]',
      iconText: 'text-[var(--success)]',
      border: 'border-[var(--border-2)]',
      hoverBorder: 'hover:border-[var(--border-3)]',
    },
    handles: {
      inputs: [],
      outputs: [{ position: 'right', color: 'var(--success)' }],
    },
    defaultData: { label: 'Start Trigger' },
    formFields: [{ field: 'label', label: 'Label', type: 'text' }],
    shape: 'pill',
    contentRenderer: 'start',
  },

  EndNode: {
    type: 'EndNode',
    label: 'End',
    typeLabel: 'Completion',
    icon: 'flag',
    colors: {
      primary: 'neutral',
      iconBg: 'bg-surface-2',
      iconText: 'text-fg-3',
      border: 'border-[var(--border-2)]',
      hoverBorder: 'hover:border-[var(--border-3)]',
    },
    handles: {
      inputs: [{ position: 'left', color: 'var(--fg-3)' }],
      outputs: [],
    },
    defaultData: { label: 'Workflow End' },
    formFields: [{ field: 'label', label: 'Label', type: 'text' }],
    shape: 'pill',
    contentRenderer: 'end',
  },

  FunctionExecutionNode: {
    type: 'FunctionExecutionNode',
    label: 'Function',
    typeLabel: 'Code step',
    icon: 'code',
    colors: {
      primary: 'neutral',
      iconBg: 'bg-surface-2',
      iconText: 'text-fg-3',
      border: 'border-[var(--border-2)]',
      hoverBorder: 'hover:border-[var(--border-3)]',
    },
    handles: {
      inputs: [{ position: 'left', color: 'var(--fg-3)' }],
      outputs: [{ position: 'right', color: 'var(--fg-3)' }],
    },
    defaultData: {
      type: 'FunctionExecutionNode',
      function_name: 'new_function',
      params: {},
    },
    formFields: [
      { field: 'function_name', label: 'Function Name', type: 'text' },
      { field: 'params', label: 'Parameters (JSON)', type: 'textarea' },
    ],
    contentRenderer: 'function',
  },

  ConditionalBranchNode: {
    type: 'ConditionalBranchNode',
    label: 'Conditional',
    typeLabel: 'Branch',
    icon: 'call_split',
    colors: {
      primary: 'orange',
      iconBg: 'bg-[color-mix(in_srgb,var(--warning)_10%,transparent)]',
      iconText: 'text-[var(--warning)]',
      border: 'border-[var(--border-2)]',
      hoverBorder: 'hover:border-[var(--border-3)]',
    },
    handles: {
      inputs: [{ position: 'left', color: 'var(--warning)' }],
      outputs: [
        {
          position: 'right',
          id: 'true',
          label: 'True',
          color: 'var(--success)',
          style: { top: '30%' },
        },
        {
          position: 'right',
          id: 'false',
          label: 'False',
          color: 'var(--danger)',
          style: { top: '70%' },
        },
      ],
    },
    defaultData: { type: 'ConditionalBranchNode', condition: 'true' },
    formFields: [
      {
        field: 'condition',
        label: 'Condition',
        type: 'text',
        tip: {
          icon: 'lightbulb',
          title: 'Tip',
          description: 'Use JavaScript expressions like data.value > 10',
          color: 'teal',
        },
      },
    ],
    contentRenderer: 'conditional',
  },

  FlowMergeNode: {
    type: 'FlowMergeNode',
    label: 'Merge',
    typeLabel: 'Merge paths',
    icon: 'call_merge',
    colors: {
      primary: 'blue',
      iconBg: 'bg-[color-mix(in_srgb,var(--info)_10%,transparent)]',
      iconText: 'text-[var(--info)]',
      border: 'border-[var(--border-2)]',
      hoverBorder: 'hover:border-[var(--border-3)]',
    },
    handles: {
      inputs: [
        { position: 'left', color: 'var(--info)' },
        { position: 'top', color: 'var(--info)' },
      ],
      outputs: [{ position: 'right', color: 'var(--info)' }],
    },
    defaultData: { type: 'FlowMergeNode', merge_strategy: 'concat' },
    formFields: [
      {
        field: 'merge_strategy',
        label: 'Merge Strategy',
        type: 'select',
        options: [
          { value: 'concat', label: 'Concatenate' },
          { value: 'overwrite', label: 'Overwrite' },
        ],
      },
    ],
    contentRenderer: 'merge',
  },

  AIExecutionNode: {
    type: 'AIExecutionNode',
    label: 'AI Agent',
    typeLabel: 'AI model',
    icon: 'psychology',
    colors: {
      primary: 'teal',
      iconBg: 'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]',
      iconText: 'text-[var(--primary)]',
      border: 'border-[var(--border-2)]',
      hoverBorder: 'hover:border-[var(--border-3)]',
    },
    handles: {
      inputs: [{ position: 'left', id: 'input', label: 'Prompt', color: 'var(--primary)' }],
      outputs: [{ position: 'right', id: 'output', label: 'Response', color: 'var(--primary)' }],
    },
    defaultData: {
      type: 'AIExecutionNode',
      agentName: 'AI Agent',
      model: '',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 2048,
      outputVariables: [],
    },
    formFields: [
      {
        field: 'agentName',
        label: 'Agent Name',
        type: 'text',
        placeholder: 'e.g. Customer Support Agent',
      },
      {
        field: 'model',
        label: 'Model Selection',
        type: 'select',
        options: [],
      },
      {
        field: 'systemPrompt',
        label: 'System Prompt',
        type: 'textarea-collapsible',
        placeholder: 'You are a helpful assistant specialized in technical support...',
      },
      {
        field: 'temperature',
        label: 'Temperature',
        type: 'slider',
        min: 0,
        max: 2,
        step: 0.1,
        defaultValue: 0.7,
      },
      {
        field: 'maxTokens',
        label: 'Max Tokens',
        type: 'slider',
        min: 1,
        max: 8192,
        step: 1,
        defaultValue: 2048,
      },
      {
        field: 'outputVariables',
        label: 'Output Variables',
        type: 'tags',
        tagPlaceholder: 'Add variable...',
      },
    ],
    contentRenderer: 'ai',
  },
}

/** Returns the metadata for a node type from the registry. */
export function getNodeMetadata(type: string): NodeMetadata | undefined {
  return NODE_REGISTRY[type]
}

/** Returns the Material Symbols icon name for a node type. */
export function getNodeIcon(type: string): string {
  const node = NODE_REGISTRY[type]
  if (!node) return 'help'
  return node.icon
}

/** Returns the default data object for a node type. */
export function getDefaultNodeData(type: string): Record<string, unknown> {
  const node = NODE_REGISTRY[type]
  if (!node) return {}
  return node.defaultData
}

/** Returns an array of all registered node metadata entries. */
export function getAllNodeTypes(): NodeMetadata[] {
  return Object.values(NODE_REGISTRY).filter((node): node is NodeMetadata => node !== undefined)
}

/** Returns the human-readable label for a node type. */
export function getNodeLabel(type: string): string {
  const node = NODE_REGISTRY[type]
  if (!node) return type.replace('Node', '')
  return node.label
}
