import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WorkflowMetrics, TopWorkflow, Activity } from '$types/workflow'
import { workflowApi } from '$services/workflowApi'

export default function WorkflowHub() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null)
  const [topWorkflows, setTopWorkflows] = useState<TopWorkflow[]>([])
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, topWorkflowsRes, activityRes] = await Promise.all([
          workflowApi.analytics.getMetrics('today'),
          workflowApi.analytics.getTopWorkflows(10, 'today'),
          workflowApi.analytics.getActivity(20),
        ])

        setMetrics({
          totalWorkflows: metricsRes.metrics.totalWorkflows,
          executionsToday: metricsRes.metrics.executionsToday,
          successRate: metricsRes.metrics.successRate,
        })

        setTopWorkflows(topWorkflowsRes.workflows)
        setRecentActivity(activityRes.activities)
      } catch (error) {
        console.error('Failed to fetch analytics data:', error)
      }
    }

    void fetchData()
  }, [])

  return (
    <main className="flex-1 bg-transparent flex flex-col overflow-y-auto">
      <header className="h-16 border-b border-white/5 glass flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Workflows</span>
          <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
          <span className="text-slate-900 dark:text-slate-100 font-semibold">Workflow Hub</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center bg-white/5 rounded-lg border border-white/10 px-3 py-1.5">
            <span className="material-symbols-outlined text-slate-400 text-lg mr-2">search</span>
            <input
              type="text"
              className="bg-transparent border-none focus:ring-0 text-sm text-slate-100 placeholder:text-slate-500 w-48"
              placeholder="Search workflows..."
            />
          </div>
          <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-primary transition-colors">
            notifications
          </span>
          <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-primary transition-colors">
            help
          </span>
        </div>
      </header>

      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">
              Workflow Hub
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal">
              Monitor and manage your enterprise automation pipelines.
            </p>
          </div>
          <button
            onClick={() => void navigate('/workflows')}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/30 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            Create Workflow
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="flex flex-col gap-4 rounded-xl p-6 glass border border-white/10 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <span className="material-symbols-outlined">account_tree</span>
              </div>
              <span className="text-teal-400 text-xs font-bold bg-teal-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                +12%
              </span>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Total Workflows
              </p>
              <p className="text-slate-900 dark:text-white text-3xl font-bold mt-1">
                {metrics?.totalWorkflows ?? 0}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl p-6 glass border border-white/10 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <span className="text-teal-400 text-xs font-bold bg-teal-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                +5.2%
              </span>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Executions Today
              </p>
              <p className="text-slate-900 dark:text-white text-3xl font-bold mt-1">
                {metrics?.executionsToday.toLocaleString() || 0}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl p-6 glass border border-white/10 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-teal-500/20 rounded-lg text-teal-500">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <span className="text-slate-400 text-xs font-bold bg-white/5 px-2 py-1 rounded-full flex items-center gap-1">
                Steady
              </span>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Success Rate</p>
              <p className="text-slate-900 dark:text-white text-3xl font-bold mt-1">
                {metrics?.successRate ?? 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">
                Top Performing Workflows
              </h2>
              <button className="text-primary text-sm font-semibold hover:underline">
                View All
              </button>
            </div>
            <div className="glass border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Workflow Name
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Executions
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                        Success
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {topWorkflows.map(workflow => (
                      <tr key={workflow.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded bg-white/10 flex items-center justify-center text-slate-400">
                              <span className="material-symbols-outlined text-lg">
                                {workflow.icon}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-slate-100">
                              {workflow.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400">
                            {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {workflow.executions.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-teal-400">
                          {workflow.successRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">
                Recent Activity
              </h2>
              <button className="text-slate-500 dark:text-slate-400 text-xs font-semibold hover:text-primary">
                Clear all
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {recentActivity.map(activity => {
                const iconMap = {
                  success: {
                    bg: 'bg-teal-500/10',
                    text: 'text-teal-400',
                    icon: 'check_circle',
                  },
                  error: {
                    bg: 'bg-rose-500/10',
                    text: 'text-teal-400',
                    icon: 'error',
                  },
                  update: {
                    bg: 'bg-primary/20',
                    text: 'text-teal-400',
                    icon: 'update',
                  },
                  info: {
                    bg: 'bg-blue-500/10',
                    text: 'text-blue-400',
                    icon: 'info',
                  },
                }
                const config = iconMap[activity.type]
                return (
                  <div
                    key={activity.id}
                    className="glass border border-white/10 rounded-xl p-4 flex gap-4"
                  >
                    <div
                      className={`size-10 rounded-full ${config.bg} flex items-center justify-center ${config.text} shrink-0`}
                    >
                      <span className="material-symbols-outlined text-lg">{config.icon}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-slate-100 leading-tight">
                        {activity.title}
                      </p>
                      <p className="text-xs text-slate-500 leading-tight">{activity.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <button className="w-full py-3 text-slate-400 text-sm font-medium border border-dashed border-white/10 rounded-xl hover:bg-white/5 transition-colors">
              View detailed activity log
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
