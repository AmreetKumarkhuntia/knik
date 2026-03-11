import type { NodeMetadata, NodeRegistry } from '$types/node-registry'

export const NODE_REGISTRY: NodeRegistry = {
  StartNode: {
    type: 'StartNode',
    label: 'Start',
    typeLabel: 'Trigger Point',
    icon: 'play_arrow',
    colors: {
      primary: 'green',
      iconBg: 'bg-green-500/10',
      iconText: 'text-green-500',
      border: 'border-green-500/50',
      hoverBorder: 'hover:border-green-500',
      neonBorder: 'neon-border-green',
    },
    handles: {
      inputs: [],
      outputs: [{ position: 'right', color: 'bg-green-500' }],
    },
    defaultData: { label: 'Start Trigger' },
    formFields: [{ field: 'label', label: 'Label', type: 'text' }],
    shape: 'pill',
    contentRenderer: 'start',
  },

  EndNode: {
    type: 'EndNode',
    label: 'End',
    typeLabel: 'Output Result',
    icon: 'check',
    colors: {
      primary: 'red',
      iconBg: 'bg-red-500/10',
      iconText: 'text-red-500',
      border: 'border-red-500/50',
      hoverBorder: 'hover:border-red-500',
      neonBorder: 'neon-border-red',
    },
    handles: {
      inputs: [{ position: 'left', color: 'bg-red-500' }],
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
    typeLabel: 'Processing',
    icon: 'settings_input_component',
    colors: {
      primary: 'purple',
      iconBg: 'bg-accent-purple/10',
      iconText: 'text-accent-purple',
      border: 'border-accent-purple/50',
      hoverBorder: 'hover:border-accent-purple',
    },
    handles: {
      inputs: [{ position: 'top', color: 'bg-accent-purple' }],
      outputs: [{ position: 'bottom', color: 'bg-accent-purple' }],
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
    typeLabel: 'Logic Switch',
    icon: 'call_split',
    colors: {
      primary: 'orange',
      iconBg: 'bg-orange-500/10',
      iconText: 'text-orange-500',
      border: 'border-orange-500/50',
      hoverBorder: 'hover:border-orange-500',
    },
    handles: {
      inputs: [{ position: 'top', color: 'bg-orange-500' }],
      outputs: [
        {
          position: 'bottom',
          id: 'true',
          label: 'True',
          color: 'bg-green-500',
          style: { left: '20%' },
        },
        {
          position: 'bottom',
          id: 'false',
          label: 'False',
          color: 'bg-red-500',
          style: { left: '80%' },
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
    typeLabel: 'Join Paths',
    icon: 'call_merge',
    colors: {
      primary: 'blue',
      iconBg: 'bg-blue-500/10',
      iconText: 'text-blue-500',
      border: 'border-blue-500/50',
      hoverBorder: 'hover:border-blue-500',
    },
    handles: {
      inputs: [
        { position: 'top', color: 'bg-blue-500' },
        { position: 'left', color: 'bg-blue-500' },
      ],
      outputs: [{ position: 'bottom', color: 'bg-blue-500' }],
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
    typeLabel: 'AI Processing',
    icon: 'psychology',
    colors: {
      primary: 'teal',
      iconBg: 'bg-accent-teal/10',
      iconText: 'text-accent-teal',
      border: 'border-accent-teal/50',
      hoverBorder: 'hover:border-accent-teal',
    },
    handles: {
      inputs: [{ position: 'top', color: 'bg-accent-purple' }],
      outputs: [{ position: 'bottom', color: 'bg-accent-teal' }],
    },
    defaultData: {
      type: 'AIExecutionNode',
      prompt: 'Enter prompt',
      model: 'gemini-1.5-flash',
    },
    formFields: [
      { field: 'prompt', label: 'Prompt', type: 'textarea' },
      {
        field: 'model',
        label: 'Model',
        type: 'select',
        options: [
          { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
          { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        ],
      },
      { field: 'temperature', label: 'Temperature', type: 'number' },
    ],
    isGradient: true,
    contentRenderer: 'ai',
  },
}

// Helper functions
export function getNodeMetadata(type: string): NodeMetadata | undefined {
  return NODE_REGISTRY[type]
}

export function getNodeIcon(type: string): string {
  const node = NODE_REGISTRY[type]
  if (!node) return 'help'
  return node.icon
}

export function getDefaultNodeData(type: string): Record<string, unknown> {
  const node = NODE_REGISTRY[type]
  if (!node) return {}
  return node.defaultData
}

export function getAllNodeTypes(): NodeMetadata[] {
  return Object.values(NODE_REGISTRY).filter((node): node is NodeMetadata => node !== undefined)
}

export function getNodeLabel(type: string): string {
  const node = NODE_REGISTRY[type]
  if (!node) return type.replace('Node', '')
  return node.label
}
