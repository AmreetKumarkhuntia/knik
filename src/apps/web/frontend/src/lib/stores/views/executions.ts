import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useExecutionStore } from '../executions/hooks'
import { useWorkflowStore } from '../workflows/hooks'
import { useWidgetScope } from '../session/useWidgetScope'
import {
  createExecutionScope,
  createExecutionDetailScope,
  toExecutionSummary,
} from '../executions/selectors'
import type { ExecutionDetailTab } from '$types/stores/executions'
import { calculateMetrics } from '$utils/metricsCalculator'
export function useExecutionsView() {
  const state = useExecutionStore(
    useShallow(state => ({
      executions: state.executions,
      initScope: state.initScope,
      disposeScope: state.disposeScope,
      patchScope: state.patchScope,
    }))
  )
  const workflows = useWorkflowStore(state => state.workflows)
  const scope = useWidgetScope(state.initScope, state.disposeScope)
  const view = useExecutionStore(state => state.scopes[scope]) ?? createExecutionScope()
  const data = useMemo(() => {
    const filtered = state.executions
      .filter(
        execution =>
          (!view.workflowId || execution.workflow_id === view.workflowId) &&
          (view.status === 'all' || execution.status === view.status)
      )
      .sort(
        (a, b) =>
          (Date.parse(b.started_at) - Date.parse(a.started_at)) * (view.sort === 'newest' ? 1 : -1)
      )
    const totalPages = Math.max(1, Math.ceil(filtered.length / 50))
    const currentPage = Math.min(view.page, totalPages)
    return {
      executions: filtered
        .slice((currentPage - 1) * 50, currentPage * 50)
        .map(execution => toExecutionSummary(execution, workflows)),
      totalPages,
      currentPage,
      totalCount: filtered.length,
    }
  }, [state.executions, workflows, view.workflowId, view.status, view.sort, view.page])
  return {
    ...data,
    workflows,
    selectedWorkflow: view.workflowId,
    selectedStatus: view.status,
    hasActiveFilters: !!view.workflowId || view.status !== 'all',
    setWorkflow: (workflowId: string) => state.patchScope(scope, { workflowId, page: 1 }),
    setStatus: (status: string) => state.patchScope(scope, { status, page: 1 }),
    setPage: (page: number) => state.patchScope(scope, { page }),
    clear: () => state.patchScope(scope, createExecutionScope()),
  }
}
export function useExecutionDetailView(executionId?: string) {
  const actions = useExecutionStore(
    useShallow(state => ({
      initDetailScope: state.initDetailScope,
      disposeDetailScope: state.disposeDetailScope,
      patchDetailScope: state.patchDetailScope,
    }))
  )
  const scope = useWidgetScope(actions.initDetailScope, actions.disposeDetailScope, executionId)
  const view = useExecutionStore(state => state.detailScopes[scope]) ?? createExecutionDetailScope()
  const execution = useExecutionStore(state =>
    state.executions.find(item => String(item.id) === executionId)
  )
  const timelines = useExecutionStore(state => state.timelines)
  const workflows = useWorkflowStore(state => state.workflows)
  const data = useMemo(() => {
    const timeline = execution ? (timelines[String(execution.id)] ?? []) : []
    const workflow = workflows.find(workflow => workflow.id === execution?.workflow_id)
    return {
      execution,
      timeline,
      definition: workflow?.definition ?? null,
      workflowName: workflow?.name ?? 'Unavailable workflow',
      metrics: execution ? calculateMetrics({ execution, timeline }) : [],
    }
  }, [execution, timelines, workflows])
  return {
    ...data,
    tab: view.tab,
    collapsed: view.collapsed,
    setTab: (tab: ExecutionDetailTab) => actions.patchDetailScope(scope, { tab, collapsed: false }),
    togglePanel: () => actions.patchDetailScope(scope, { collapsed: !view.collapsed }),
  }
}
