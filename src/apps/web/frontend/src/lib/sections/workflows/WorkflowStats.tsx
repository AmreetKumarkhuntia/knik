import { motion } from 'framer-motion'
import { useWorkflowStats } from './hooks/useWorkflowStats'
import StatCard from '$components/StatCard'

export default function WorkflowStats() {
  const { stats, error, refetch } = useWorkflowStats()

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error text-sm">{error}</p>
        <button
          onClick={() => void refetch()}
          className="mt-4 px-6 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pb-12"
    >
      <StatCard
        icon="bar_chart"
        label="Total Executions"
        value={stats.totalExecutions}
        subtext="this month"
        color="primary"
      />
      <StatCard
        icon="play_circle"
        label="Active Jobs"
        value={stats.activeJobs}
        subtext="currently running"
        color="primary"
      />
      <StatCard
        icon="check_circle"
        label="Success Rate"
        value={stats.successRate}
        subtext={stats.hasData ? 'based on last 30 days' : 'no data available'}
        color="primary"
      />
    </motion.div>
  )
}
