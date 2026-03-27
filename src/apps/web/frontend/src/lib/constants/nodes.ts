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
      iconBg: 'bg-[#8b5cf6]/10',
      iconText: 'text-[#8b5cf6]',
      border: 'border-[#8b5cf6]/50',
      hoverBorder: 'hover:border-[#8b5cf6]',
    },
    handles: {
      inputs: [{ position: 'left', color: 'bg-[#8b5cf6]' }],
      outputs: [{ position: 'right', color: 'bg-[#8b5cf6]' }],
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
      inputs: [{ position: 'left', color: 'bg-orange-500' }],
      outputs: [
        {
          position: 'right',
          id: 'true',
          label: 'True',
          color: 'bg-green-500',
          style: { top: '30%' },
        },
        {
          position: 'right',
          id: 'false',
          label: 'False',
          color: 'bg-red-500',
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
        { position: 'left', color: 'bg-blue-500' },
        { position: 'top', color: 'bg-blue-500' },
      ],
      outputs: [{ position: 'right', color: 'bg-blue-500' }],
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
      iconBg: 'bg-[#14b8a6]/10',
      iconText: 'text-[#14b8a6]',
      border: 'border-[#14b8a6]/50',
      hoverBorder: 'hover:border-[#14b8a6]',
    },
    handles: {
      inputs: [{ position: 'left', id: 'input', label: 'Prompt', color: 'bg-[#14b8a6]/60' }],
      outputs: [{ position: 'right', id: 'output', label: 'Response', color: 'bg-[#14b8a6]/60' }],
    },
    defaultData: {
      type: 'AIExecutionNode',
      agentName: 'AI Agent',
      model: 'gpt-4o',
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
        options: [
          { value: 'gpt-4o', label: 'GPT-4o (Omni)' },
          { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
          { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
          { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        ],
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
    isGradient: false,
    contentRenderer: 'ai',
  },
}

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
