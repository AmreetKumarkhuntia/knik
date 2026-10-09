import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { HubWorkflowRow, WorkflowMetrics } from '$types/workflow'
import { useWorkflowStore } from '../workflows/hooks'
import { useScheduleStore } from '../schedules/hooks'
import { useExecutionStore } from '../executions/hooks'
import { useCatalogStore } from '../catalogs/hooks'
import { effectiveModelId } from '../catalogs/selectors'
import { useSettingsStore } from '../settings/hooks'
import { useStoreBundle } from '../session/useStoreBundle'
import { useWidgetScope } from '../session/useWidgetScope'
import { toExecutionSummary } from '../executions/selectors'
import { normalizeNodes, sameDefinitionNodes } from '../workflows/selectors'
import { definitionsMatch } from '$utils/workflowDefinition'
import { canvasNodesToGraph, graphToWorkflowDefinition } from '$lib/data-structures'

export function useWorkflowHubView() {
  const state = useWorkflowStore(
    useShallow(state => ({
      workflows: state.workflows,
      scenarioDefinitions: state.scenarioDefinitions,
      initHub: state.initHub,
      disposeHub: state.disposeHub,
      patchHub: state.patchHub,
    }))
  )
  const executions = useExecutionStore(state => state.executions)
  const scenarios = useExecutionStore(state => state.runScenarios)
  const schedules = useScheduleStore(state => state.schedules)
  const scope = useWidgetScope(state.initHub, state.disposeHub)
  const view = useWorkflowStore(state => state.hubScopes[scope]) ?? { query: '', filter: 'all' }
  const data = useMemo(() => {
    const today = new Date().toDateString()
    const durations = executions.flatMap(execution =>
      execution.duration_ms === undefined ? [] : [execution.duration_ms]
    )
    const metrics: WorkflowMetrics = {
      totalWorkflows: state.workflows.length,
      totalExecutions: executions.length,
      executionsToday: executions.filter(
        execution => new Date(execution.started_at).toDateString() === today
      ).length,
      successRate: executions.length
        ? Math.round(
            (executions.filter(execution => execution.status === 'success').length /
              executions.length) *
              100
          )
        : 0,
      avgDurationMs: durations.length
        ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
        : undefined,
    }
    const rows = state.workflows
      .map<HubWorkflowRow>(workflow => {
        const runs = executions.filter(execution => execution.workflow_id === workflow.id)
        const latest = [...runs]
          .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))
          .at(0)
        return {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description ?? '',
          totalExecutions: runs.length,
          status: schedules.some(
            schedule => schedule.target_workflow_id === workflow.id && schedule.enabled
          )
            ? 'active'
            : 'inactive',
          lastExecutedAt: latest?.started_at,
        }
      })
      .filter(
        workflow =>
          (view.filter === 'all' || workflow.status === view.filter) &&
          workflow.name.toLowerCase().includes(view.query.toLowerCase())
      )
    const recentExecutions = [...executions]
      .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))
      .slice(0, 5)
      .map(execution => toExecutionSummary(execution, state.workflows))
    return { metrics, rows, recentExecutions }
  }, [state.workflows, executions, schedules, view.filter, view.query])
  const commands = useStoreBundle().commands
  return {
    ...data,
    ...view,
    count: state.workflows.length,
    setQuery: (query: string) => state.patchHub(scope, { query }),
    setFilter: (filter: string) => state.patchHub(scope, { filter }),
    canRun: (id: string) =>
      !!scenarios[id] &&
      definitionsMatch(
        state.workflows.find(workflow => workflow.id === id)?.definition,
        state.scenarioDefinitions[id]
      ),
    runWorkflow: commands.runWorkflow,
  }
}

export function useWorkflowBuilderView(workflowId?: string) {
  const state = useWorkflowStore(
    useShallow(state => ({
      initBuilder: state.initBuilder,
      disposeBuilder: state.disposeBuilder,
      patchBuilder: state.patchBuilder,
      changeNodes: state.changeNodes,
      changeEdges: state.changeEdges,
      connect: state.connect,
      addNode: state.addNode,
      updateNode: state.updateNode,
      setFieldDraft: state.setFieldDraft,
      saveBuilder: state.saveBuilder,
      validateBuilder: state.validateBuilder,
    }))
  )
  const scenarioDefinition = useWorkflowStore(state =>
    workflowId ? state.scenarioDefinitions[workflowId] : undefined
  )
  const models = useCatalogStore(state => state.models)
  const selectedModel = useSettingsStore(state => state.settings.model)
  const scenarios = useExecutionStore(state => state.runScenarios)
  const commands = useStoreBundle().commands
  const scope = useWidgetScope(
    id => state.initBuilder(id, workflowId),
    state.disposeBuilder,
    workflowId
  )
  const draft = useWorkflowStore(state => state.builderScopes[scope])
  const workflow = useWorkflowStore(state =>
    state.workflows.find(workflow => workflow.id === workflowId)
  )
  const modelOptions = useMemo(
    () => models.map(model => ({ value: model.id, label: model.label })),
    [models]
  )
  const savedMatchesScenario = useMemo(
    () =>
      !!workflow &&
      !!scenarios[workflow.id] &&
      definitionsMatch(workflow.definition, scenarioDefinition),
    [workflow, scenarios, scenarioDefinition]
  )
  // Dragging re-creates the nodes array every frame; only id, type and data changes need a recheck.
  const [definitionNodes, setDefinitionNodes] = useState(draft?.nodes)
  if (!sameDefinitionNodes(draft?.nodes, definitionNodes)) setDefinitionNodes(draft?.nodes)
  const definitionEdges = draft?.edges
  const canRun = useMemo(() => {
    if (!savedMatchesScenario || !workflow || !definitionNodes || !definitionEdges) return false
    try {
      return definitionsMatch(
        graphToWorkflowDefinition(
          canvasNodesToGraph(normalizeNodes(definitionNodes), definitionEdges)
        ),
        workflow.definition
      )
    } catch {
      return false
    }
  }, [savedMatchesScenario, workflow, definitionNodes, definitionEdges])
  return {
    draft,
    workflow,
    canRun,
    modelOptions,
    selectedNode: draft?.nodes.find(node => node.id === draft.selectedNodeId) ?? null,
    setName: (name: string) => state.patchBuilder(scope, { name }),
    selectNode: (selectedNodeId: string | null) => state.patchBuilder(scope, { selectedNodeId }),
    changeNodes: (changes: Parameters<typeof state.changeNodes>[1]) =>
      state.changeNodes(scope, changes),
    changeEdges: (changes: Parameters<typeof state.changeEdges>[1]) =>
      state.changeEdges(scope, changes),
    connect: (connection: Parameters<typeof state.connect>[1]) => state.connect(scope, connection),
    addNode: (type: string, position: { x: number; y: number }) =>
      state.addNode(scope, type, position, effectiveModelId(selectedModel, models)),
    updateNode: (id: string, data: Record<string, unknown>) => state.updateNode(scope, id, data),
    setFieldDraft: (field: string, value: string) => state.setFieldDraft(scope, field, value),
    save: () => state.saveBuilder(scope),
    validate: () => state.validateBuilder(scope),
    run: () =>
      workflowId && canRun
        ? commands.runWorkflow(workflowId)
        : {
            ok: false as const,
            error: 'Save your changes and supply a matching demo run scenario first.',
          },
  }
}
