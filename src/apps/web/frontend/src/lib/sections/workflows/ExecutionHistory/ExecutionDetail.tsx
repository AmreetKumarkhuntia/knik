import { useEffect, useState } from 'react'
import type { NodeExecutionRecord } from '$types/workflow'
import LoadingSpinner from '$components/LoadingSpinner'
import StatusBadge from '$components/StatusBadge'
import Backdrop from '$components/Backdrop'
import Tabs from '$components/Tabs'
import Card from '$components/Card'
import IconButton from '$components/IconButton'
import type { ExecutionDetailProps } from '$types/sections/execution-history'

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

export default function ExecutionDetail({ execution, isOpen, onClose }: ExecutionDetailProps) {
  const [nodeExecutions, setNodeExecutions] = useState<NodeExecutionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'inputs' | 'outputs'>(
    'overview'
  )

  useEffect(() => {
    if (!isOpen || !execution) {
      setNodeExecutions([])
      return
    }

    const fetchNodeExecutions = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `http://localhost:8000/api/workflows/${execution.workflow_id}/executions/${execution.id}/nodes`
        )
        if (response.ok) {
          const data = await response.json()
          setNodeExecutions(data.node_executions || [])
        }
      } catch {
        setNodeExecutions([])
      } finally {
        setLoading(false)
      }
    }

    void fetchNodeExecutions()
  }, [isOpen, execution])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !execution) return null

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'nodes' as const, label: 'Node Trace' },
    { id: 'inputs' as const, label: 'Inputs' },
    { id: 'outputs' as const, label: 'Outputs' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <Backdrop visible={true} onClick={onClose} />
      <div className="relative bg-gray-900 border border-white/20 rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Execution #{execution.id}</h2>
            <StatusBadge status={execution.status} size="sm" />
          </div>
          <IconButton icon="×" onClick={onClose} ariaLabel="Close" variant="ghost" />
        </div>

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} variant="underline" />

        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card padding="md" variant="bordered">
                  <p className="text-white/60 text-sm mb-1">Workflow ID</p>
                  <p className="text-white font-mono">{execution.workflow_id}</p>
                </Card>
                <Card padding="md" variant="bordered">
                  <p className="text-white/60 text-sm mb-1">Duration</p>
                  <p className="text-white font-mono">
                    {execution.duration_ms ? `${execution.duration_ms}ms` : '-'}
                  </p>
                </Card>
                <Card padding="md" variant="bordered">
                  <p className="text-white/60 text-sm mb-1">Started At</p>
                  <p className="text-white">{new Date(execution.started_at).toLocaleString()}</p>
                </Card>
                <Card padding="md" variant="bordered">
                  <p className="text-white/60 text-sm mb-1">Completed At</p>
                  <p className="text-white">
                    {execution.completed_at
                      ? new Date(execution.completed_at).toLocaleString()
                      : '-'}
                  </p>
                </Card>
              </div>
              {execution.error_message && (
                <Card padding="md" variant="bordered" className="border-red-500/30 bg-red-500/10">
                  <p className="text-red-400 font-medium mb-1">Error</p>
                  <p className="text-red-300 text-sm font-mono">{execution.error_message}</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'nodes' && (
            <>
              {loading ? (
                <LoadingSpinner size="md" className="py-10" />
              ) : nodeExecutions.length === 0 ? (
                <div className="text-center py-10 text-white/50">
                  <p>No node execution data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nodeExecutions.map(node => (
                    <Card key={node.id} padding="md" variant="bordered">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-mono">{node.node_id}</span>
                          <span className="text-white/50 text-sm">({node.node_type})</span>
                        </div>
                        <StatusBadge status={node.status} size="sm" />
                      </div>
                      <div className="flex gap-4 text-xs text-white/60">
                        <span>Duration: {node.duration_ms ? `${node.duration_ms}ms` : '-'}</span>
                        {node.error_message && (
                          <span className="text-red-400">Error: {node.error_message}</span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'inputs' && (
            <pre className="bg-black/20 rounded-lg p-4 text-white/80 text-sm font-mono overflow-auto max-h-96">
              {formatJson(execution.inputs)}
            </pre>
          )}

          {activeTab === 'outputs' && (
            <pre className="bg-black/20 rounded-lg p-4 text-white/80 text-sm font-mono overflow-auto max-h-96">
              {formatJson(execution.outputs)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
