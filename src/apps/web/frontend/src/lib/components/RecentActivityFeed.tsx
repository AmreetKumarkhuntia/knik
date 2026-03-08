import LoadingSpinner from '$components/LoadingSpinner'
import ActivityItem from '$components/ActivityItem'
import type { RecentActivityFeedProps } from '$types/components'

export default function RecentActivityFeed({
  activities,
  loading = false,
  onClearAll,
  maxItems,
}: RecentActivityFeedProps) {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">
            Recent Activity
          </h2>
        </div>
        <div className="flex items-center justify-center py-12 glass border border-white/10 rounded-xl">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">
            Recent Activity
          </h2>
        </div>
        <div className="glass border border-white/10 rounded-xl p-8 text-center">
          <p className="text-slate-400 text-sm">No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">
          Recent Activity
        </h2>
        {onClearAll && (
          <button
            onClick={onClearAll}
            className="text-slate-500 dark:text-slate-400 text-xs font-semibold hover:text-primary transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {displayActivities.map(activity => (
          <ActivityItem
            key={activity.id}
            type={activity.type}
            title={activity.title}
            description={activity.description}
            time={activity.time}
            icon={activity.icon}
          />
        ))}
      </div>
      <button className="w-full py-3 text-slate-400 text-sm font-medium border border-dashed border-white/10 rounded-xl hover:bg-white/5 transition-colors">
        View detailed activity log
      </button>
    </div>
  )
}
