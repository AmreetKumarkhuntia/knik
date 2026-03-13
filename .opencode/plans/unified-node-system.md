# Unified Node System Plan

## Overview

Create a centralized node registry that serves as the **single source of truth** for all node metadata, with a `BaseNode` component that renders nodes consistently while reading from the registry.

## Current Problems

1. **Duplication**: Same icon/colors defined in 5+ places
2. **Inconsistency risk**: Changing a node requires updates in multiple files
3. **Hard to extend**: Adding a new node type requires changes in 6+ files
4. **No single source of truth**: Node metadata scattered across the codebase

## Locations Where Node Metadata is Currently Duplicated

1. `NodePalette.tsx` - Drag-and-drop palette
2. Individual Node Components (`nodes/*.tsx`) - Canvas rendering
3. `ExecutionTimeline.tsx` - `getNodeIcon()` function
4. `ExecutionFlowGraph.tsx` - Node label extraction
5. `ConfigurationForm.tsx` - Form fields hardcoded per node type
6. `Canvas.tsx` - `getDefaultNodeData()` function

---

## Phase 1: Create Type Definitions

### File: `src/types/node-registry.ts` (NEW)

```typescript
import type { NodeTypeName } from "./workflow";

/**
 * Handle configuration for node inputs/outputs
 */
export interface HandleConfig {
  position: "top" | "bottom" | "left" | "right";
  id?: string; // For conditional nodes: 'true', 'false'
  label?: string; // Display label for handle
  color?: string; // Tailwind color class for handle
  style?: Record<string, string>; // Additional inline styles
}

/**
 * Tip/hint configuration for form fields
 */
export interface FormFieldTip {
  icon: string;
  title: string;
  description: string;
  color: "teal" | "purple" | "orange" | "blue" | "green" | "red";
}

/**
 * Form field configuration for node properties panel
 */
export interface FormFieldConfig {
  field: string;
  label: string;
  type: "text" | "textarea" | "number" | "select";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  tip?: FormFieldTip;
}

/**
 * Color configuration for node styling
 */
export interface NodeColors {
  primary: string; // Base color name
  iconBg: string; // Tailwind class for icon background
  iconText: string; // Tailwind class for icon color
  border: string; // Border color class
  hoverBorder: string; // Hover border class
  neonBorder?: string; // Optional neon border class
}

/**
 * Complete node metadata structure
 */
export interface NodeMetadata {
  type: NodeTypeName | "StartNode" | "EndNode";
  label: string;
  typeLabel: string;
  icon: string;

  colors: NodeColors;

  handles: {
    inputs: HandleConfig[];
    outputs: HandleConfig[];
  };

  defaultData: Record<string, unknown>;
  formFields: FormFieldConfig[];

  isGradient?: boolean;
  shape?: "default" | "pill";
  contentRenderer?:
    | "function"
    | "conditional"
    | "merge"
    | "ai"
    | "start"
    | "end";
}

export type NodeRegistry = Record<string, NodeMetadata>;
```

### Update: `src/types/index.ts`

Add: `export * from './node-registry'`

---

## Phase 2: Create Node Constants Registry

### File: `src/lib/constants/nodes.ts` (NEW)

```typescript
import type { NodeMetadata, NodeRegistry } from "$types/node-registry";

export const NODE_REGISTRY: NodeRegistry = {
  StartNode: {
    type: "StartNode",
    label: "Start",
    typeLabel: "Trigger Point",
    icon: "play_arrow",
    colors: {
      primary: "green",
      iconBg: "bg-green-500/10",
      iconText: "text-green-500",
      border: "border-green-500/50",
      hoverBorder: "hover:border-green-500",
      neonBorder: "neon-border-green",
    },
    handles: {
      inputs: [],
      outputs: [{ position: "right", color: "bg-green-500" }],
    },
    defaultData: { label: "Start Trigger" },
    formFields: [{ field: "label", label: "Label", type: "text" }],
    shape: "pill",
    contentRenderer: "start",
  },

  EndNode: {
    type: "EndNode",
    label: "End",
    typeLabel: "Output Result",
    icon: "check",
    colors: {
      primary: "red",
      iconBg: "bg-red-500/10",
      iconText: "text-red-500",
      border: "border-red-500/50",
      hoverBorder: "hover:border-red-500",
      neonBorder: "neon-border-red",
    },
    handles: {
      inputs: [{ position: "left", color: "bg-red-500" }],
      outputs: [],
    },
    defaultData: { label: "Workflow End" },
    formFields: [{ field: "label", label: "Label", type: "text" }],
    shape: "pill",
    contentRenderer: "end",
  },

  FunctionExecutionNode: {
    type: "FunctionExecutionNode",
    label: "Function",
    typeLabel: "Processing",
    icon: "settings_input_component",
    colors: {
      primary: "purple",
      iconBg: "bg-accent-purple/10",
      iconText: "text-accent-purple",
      border: "border-accent-purple/50",
      hoverBorder: "hover:border-accent-purple",
    },
    handles: {
      inputs: [{ position: "top", color: "bg-accent-purple" }],
      outputs: [{ position: "bottom", color: "bg-accent-purple" }],
    },
    defaultData: {
      type: "FunctionExecutionNode",
      function_name: "new_function",
      params: {},
    },
    formFields: [
      { field: "function_name", label: "Function Name", type: "text" },
      { field: "params", label: "Parameters (JSON)", type: "textarea" },
    ],
    contentRenderer: "function",
  },

  ConditionalBranchNode: {
    type: "ConditionalBranchNode",
    label: "Conditional",
    typeLabel: "Logic Switch",
    icon: "call_split",
    colors: {
      primary: "orange",
      iconBg: "bg-orange-500/10",
      iconText: "text-orange-500",
      border: "border-orange-500/50",
      hoverBorder: "hover:border-orange-500",
    },
    handles: {
      inputs: [{ position: "top", color: "bg-orange-500" }],
      outputs: [
        {
          position: "bottom",
          id: "true",
          label: "True",
          color: "bg-green-500",
          style: { left: "20%" },
        },
        {
          position: "bottom",
          id: "false",
          label: "False",
          color: "bg-red-500",
          style: { left: "80%" },
        },
      ],
    },
    defaultData: { type: "ConditionalBranchNode", condition: "true" },
    formFields: [
      {
        field: "condition",
        label: "Condition",
        type: "text",
        tip: {
          icon: "lightbulb",
          title: "Tip",
          description: "Use JavaScript expressions like data.value > 10",
          color: "teal",
        },
      },
    ],
    contentRenderer: "conditional",
  },

  FlowMergeNode: {
    type: "FlowMergeNode",
    label: "Merge",
    typeLabel: "Join Paths",
    icon: "call_merge",
    colors: {
      primary: "blue",
      iconBg: "bg-blue-500/10",
      iconText: "text-blue-500",
      border: "border-blue-500/50",
      hoverBorder: "hover:border-blue-500",
    },
    handles: {
      inputs: [
        { position: "top", color: "bg-blue-500" },
        { position: "left", color: "bg-blue-500" },
      ],
      outputs: [{ position: "bottom", color: "bg-blue-500" }],
    },
    defaultData: { type: "FlowMergeNode", merge_strategy: "concat" },
    formFields: [
      {
        field: "merge_strategy",
        label: "Merge Strategy",
        type: "select",
        options: [
          { value: "concat", label: "Concatenate" },
          { value: "overwrite", label: "Overwrite" },
        ],
      },
    ],
    contentRenderer: "merge",
  },

  AIExecutionNode: {
    type: "AIExecutionNode",
    label: "AI Agent",
    typeLabel: "AI Processing",
    icon: "psychology",
    colors: {
      primary: "teal",
      iconBg: "bg-accent-teal/10",
      iconText: "text-accent-teal",
      border: "border-accent-teal/50",
      hoverBorder: "hover:border-accent-teal",
    },
    handles: {
      inputs: [{ position: "top", color: "bg-accent-purple" }],
      outputs: [{ position: "bottom", color: "bg-accent-teal" }],
    },
    defaultData: {
      type: "AIExecutionNode",
      prompt: "Enter prompt",
      model: "gemini-1.5-flash",
    },
    formFields: [
      { field: "prompt", label: "Prompt", type: "textarea" },
      {
        field: "model",
        label: "Model",
        type: "select",
        options: [
          { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
          { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
        ],
      },
      { field: "temperature", label: "Temperature", type: "number" },
    ],
    isGradient: true,
    contentRenderer: "ai",
  },
};

// Helper functions
export function getNodeMetadata(type: string): NodeMetadata | undefined {
  return NODE_REGISTRY[type];
}

export function getNodeIcon(type: string): string {
  return NODE_REGISTRY[type]?.icon ?? "help";
}

export function getDefaultNodeData(type: string): Record<string, unknown> {
  return NODE_REGISTRY[type]?.defaultData ?? {};
}

export function getAllNodeTypes(): NodeMetadata[] {
  return Object.values(NODE_REGISTRY);
}

export function getNodeLabel(type: string): string {
  return NODE_REGISTRY[type]?.label ?? type.replace("Node", "");
}
```

### Update: `src/lib/constants/index.ts`

Add: `export * from './nodes'`

---

## Phase 3: Create BaseNode Component

### File: `src/lib/sections/workflows/WorkflowBuilder/nodes/BaseNode.tsx` (NEW)

```typescript
import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { getNodeMetadata } from '$lib/constants/nodes'
import type { HandleConfig } from '$types/node-registry'

// Position mapping helper
const POSITION_MAP = {
  top: Position.Top,
  bottom: Position.Bottom,
  left: Position.Left,
  right: Position.Right,
}

// Render a single handle
function NodeHandle({
  config,
  type,
  defaultColor,
}: {
  config: HandleConfig
  type: 'source' | 'target'
  defaultColor: string
}) {
  return (
    <Handle
      type={type}
      position={POSITION_MAP[config.position]}
      id={config.id}
      className={`!${config.color || defaultColor} !w-3 !h-3 !border-2 !border-background-dark`}
      style={config.style}
    />
  )
}

// Content renderers for different node types
function FunctionContent({ data }: { data: Record<string, unknown> }) {
  const functionName = data.function_name as string
  const params = data.params as Record<string, unknown> | undefined

  return (
    <>
      <p className="text-textSecondary text-xs truncate font-mono">
        {functionName || 'Unnamed'}
      </p>
      {params && Object.keys(params).length > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[10px] text-textSecondary">data_object</span>
          <span className="text-textSecondary/60 text-[10px]">
            {Object.keys(params).length} parameters
          </span>
        </div>
      )}
    </>
  )
}

function ConditionalContent({ data }: { data: Record<string, unknown> }) {
  const condition = data.condition as string

  return (
    <>
      <p className="text-textSecondary text-xs truncate font-mono bg-white/5 rounded px-2 py-1">
        {condition || 'No condition'}
      </p>
      <div className="flex justify-between mt-3 gap-2">
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-green-500 font-medium uppercase">True</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-red-500 font-medium uppercase">False</span>
        </div>
      </div>
    </>
  )
}

function MergeContent({ data }: { data: Record<string, unknown> }) {
  const strategy = data.merge_strategy as string

  return (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-[10px] text-textSecondary">data_object</span>
      <p className="text-textSecondary text-xs font-mono">{strategy || 'concat'}</p>
    </div>
  )
}

function AIContent({ data }: { data: Record<string, unknown> }) {
  const model = data.model as string

  return (
    <>
      {model && <p className="text-textSecondary text-xs text-center">{model}</p>}
      <div className="flex justify-between w-full mt-2">
        <div className="h-2 w-2 rounded-full bg-surface border border-borderLight" />
        <div className="h-2 w-2 rounded-full bg-surface border border-borderLight" />
      </div>
    </>
  )
}

// Content renderer selection
function NodeContent({ renderer, data }: { renderer?: string; data: Record<string, unknown> }) {
  switch (renderer) {
    case 'function':
      return <FunctionContent data={data} />
    case 'conditional':
      return <ConditionalContent data={data} />
    case 'merge':
      return <MergeContent data={data} />
    case 'ai':
      return <AIContent data={data} />
    default:
      return null
  }
}

// Pill-shaped node for Start/End
function PillNode({ metadata, data }: { metadata: NodeMetadata; data: Record<string, unknown> }) {
  const { icon, colors, handles, contentRenderer } = metadata
  const isStart = contentRenderer === 'start'

  return (
    <div className="relative">
      <div className={`flex items-center gap-4 rounded-full node-glass px-6 py-4 ${colors.neonBorder || ''}`}>
        {!isStart && (
          <div className={`mr-4 h-3 w-3 rounded-full ${colors.iconBg.replace('/10', '')} border-2 border-background-dark cursor-pointer`} />
        )}
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.iconBg.replace('/10', '')} text-white shadow-lg shadow-${colors.primary}-500/30`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className={`flex flex-col ${!isStart ? 'text-right' : ''}`}>
          <h3 className="text-sm font-bold text-white">
            {(data.label as string) || metadata.label}
          </h3>
          <p className={`text-[10px] ${colors.iconText.replace('text-', 'text-')} uppercase tracking-tighter`}>
            {metadata.typeLabel}
          </p>
        </div>
        {isStart && (
          <div className={`ml-4 h-3 w-3 rounded-full ${colors.iconBg.replace('/10', '')} border-2 border-background-dark cursor-pointer`} />
        )}
      </div>

      {handles.inputs.map((handle, i) => (
        <NodeHandle key={`in-${i}`} config={handle} type="target" defaultColor={colors.iconText} />
      ))}
      {handles.outputs.map((handle, i) => (
        <NodeHandle key={`out-${i}`} config={handle} type="source" defaultColor={colors.iconText} />
      ))}
    </div>
  )
}

// AI node with gradient border
function GradientNode({ metadata, data }: { metadata: NodeMetadata; data: Record<string, unknown> }) {
  const { icon, label, typeLabel, colors, handles, contentRenderer } = metadata

  return (
    <div className="relative">
      <div className="p-[2px] rounded-2xl gradient-node-border shadow-2xl shadow-accent-purple/20">
        <div className="node-glass rounded-[14px] p-6 flex flex-col items-center gap-3 min-w-[180px]">
          <span className={`material-symbols-outlined ${colors.iconText} text-4xl`}>{icon}</span>
          <div className="text-center">
            <h3 className="text-sm font-bold text-white">{(data.label as string) || label}</h3>
            <span className={`text-[10px] py-0.5 px-2 rounded-full ${colors.iconBg} ${colors.iconText} border ${colors.border}`}>
              {typeLabel.toUpperCase()}
            </span>
          </div>
          <NodeContent renderer={contentRenderer} data={data} />
        </div>
      </div>

      {handles.inputs.map((handle, i) => (
        <NodeHandle key={`in-${i}`} config={handle} type="target" defaultColor="bg-surface" />
      ))}
      {handles.outputs.map((handle, i) => (
        <NodeHandle key={`out-${i}`} config={handle} type="source" defaultColor="bg-surface" />
      ))}
    </div>
  )
}

// Default rectangular node
function DefaultNode({ metadata, data }: { metadata: NodeMetadata; data: Record<string, unknown> }) {
  const { icon, label, typeLabel, colors, handles, contentRenderer } = metadata

  return (
    <div className="relative">
      <div className={`rounded-xl node-glass border ${colors.border} p-4 min-w-[180px] shadow-lg`}>
        {handles.inputs.map((handle, i) => (
          <NodeHandle key={`in-${i}`} config={handle} type="target" defaultColor={colors.iconText} />
        ))}

        <div className="flex items-center gap-3 mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text">{label}</span>
            <span className="text-[10px] text-textSecondary uppercase">{typeLabel}</span>
          </div>
        </div>

        <NodeContent renderer={contentRenderer} data={data} />

        {handles.outputs.map((handle, i) => (
          <NodeHandle key={`out-${i}`} config={handle} type="source" defaultColor={colors.iconText} />
        ))}
      </div>
    </div>
  )
}

// Main BaseNode component
export default memo(function BaseNode({ data, type }: NodeProps) {
  const metadata = getNodeMetadata(type as string)
  if (!metadata) return null

  const nodeData = data as Record<string, unknown>

  if (metadata.shape === 'pill') {
    return <PillNode metadata={metadata} data={nodeData} />
  }

  if (metadata.isGradient) {
    return <GradientNode metadata={metadata} data={nodeData} />
  }

  return <DefaultNode metadata={metadata} data={nodeData} />
})
```

---

## Phase 4: Refactor Existing Components

### 4.1 Update `nodes/index.ts`

```typescript
export { default as BaseNode } from "./BaseNode";

// For backwards compatibility, also export mapped versions
import BaseNode from "./BaseNode";

export const FunctionNode = BaseNode;
export const ConditionalNode = BaseNode;
export const MergeNode = BaseNode;
export const AINode = BaseNode;
export const StartNode = BaseNode;
export const EndNode = BaseNode;
```

### 4.2 Update `Canvas.tsx`

Remove the `getDefaultNodeData` function and use:

```typescript
import { getDefaultNodeData } from "$lib/constants/nodes";
```

### 4.3 Refactor `NodePalette.tsx`

```typescript
import { getAllNodeTypes } from '$lib/constants/nodes'

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  const nodeTypes = getAllNodeTypes()

  return (
    <aside className="...">
      <div className="space-y-3">
        {nodeTypes.map(node => (
          <NodeTypeItem
            key={node.type}
            icon={node.icon}
            label={node.label}
            typeLabel={node.typeLabel}
            type={node.type}
            onDragStart={onDragStart}
            iconColor={node.colors.iconText}
            iconBgColor={node.colors.iconBg}
            hoverBorderColor={node.colors.hoverBorder}
            isGradient={node.isGradient}
          />
        ))}
      </div>
    </aside>
  )
}
```

### 4.4 Refactor `ConfigurationForm.tsx`

```typescript
import { getNodeMetadata } from '$lib/constants/nodes'

export default function ConfigurationForm({ nodeType, data, onDataChange }: ConfigurationFormProps) {
  const metadata = getNodeMetadata(nodeType)
  if (!metadata) return null

  return (
    <div className="space-y-4">
      {metadata.formFields.map(field => (
        <FormField
          key={field.field}
          field={field}
          value={data[field.field]}
          onChange={(value) => onDataChange(field.field, value)}
        />
      ))}
    </div>
  )
}
```

### 4.5 Update `ExecutionTimeline.tsx`

Replace the hardcoded `getNodeIcon` function:

```typescript
import { getNodeIcon } from "$lib/constants/nodes";
```

### 4.6 Update `ExecutionFlowGraph.tsx`

Use registry for label extraction:

```typescript
import { getNodeLabel } from '$lib/constants/nodes'

// In buildGraph():
label: getNodeLabel(nodeId),
```

---

## Phase 5: Delete Old Node Files

After BaseNode is working, delete:

- `nodes/FunctionNode.tsx`
- `nodes/ConditionalNode.tsx`
- `nodes/MergeNode.tsx`
- `nodes/AINode.tsx`
- `nodes/StartNode.tsx`
- `nodes/EndNode.tsx`

---

## Files Summary

### New Files (3)

| File                                                            | Purpose              |
| --------------------------------------------------------------- | -------------------- |
| `src/types/node-registry.ts`                                    | Type definitions     |
| `src/lib/constants/nodes.ts`                                    | Centralized registry |
| `src/lib/sections/workflows/WorkflowBuilder/nodes/BaseNode.tsx` | Generic renderer     |

### Modified Files (8)

| File                                                                               | Changes              |
| ---------------------------------------------------------------------------------- | -------------------- |
| `src/types/index.ts`                                                               | Export node-registry |
| `src/lib/constants/index.ts`                                                       | Export nodes         |
| `src/lib/sections/workflows/WorkflowBuilder/nodes/index.ts`                        | Export BaseNode      |
| `src/lib/sections/workflows/WorkflowBuilder/Canvas.tsx`                            | Use registry         |
| `src/lib/sections/workflows/WorkflowBuilder/NodePalette/NodePalette.tsx`           | Use registry         |
| `src/lib/sections/workflows/WorkflowBuilder/PropertiesPanel/ConfigurationForm.tsx` | Use registry         |
| `src/lib/components/ExecutionTimeline.tsx`                                         | Use registry         |
| `src/lib/components/ExecutionFlowGraph.tsx`                                        | Use registry         |

### Deleted Files (6)

| File                        | Reason               |
| --------------------------- | -------------------- |
| `nodes/FunctionNode.tsx`    | Replaced by BaseNode |
| `nodes/ConditionalNode.tsx` | Replaced by BaseNode |
| `nodes/MergeNode.tsx`       | Replaced by BaseNode |
| `nodes/AINode.tsx`          | Replaced by BaseNode |
| `nodes/StartNode.tsx`       | Replaced by BaseNode |
| `nodes/EndNode.tsx`         | Replaced by BaseNode |

---

## Benefits

1. **Single Source of Truth**: All node metadata in one place
2. **Easy to Extend**: Add new node = add one registry entry
3. **Consistency**: All views use same icons, colors, labels
4. **Type Safety**: Full TypeScript support
5. **Less Code**: ~300 lines removed across 6 files
6. **Maintainability**: Change once, update everywhere
