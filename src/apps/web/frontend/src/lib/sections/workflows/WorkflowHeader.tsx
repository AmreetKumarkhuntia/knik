import { motion } from 'framer-motion'
import { NavLink } from '$components/NavLink'
import SearchBar from '$components/SearchBar'
import NotificationButton from '$components/NotificationButton'
import UserProfile from '$components/UserProfile'

export default function WorkflowHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-center justify-between px-6 py-4 bg-surfaceGlass backdrop-blur-xl border-b border-borderLight sticky top-0 z-50 shadow-lg"
    >
      <div className="flex items-center gap-8">
        <NavLink icon="account_tree" label="Workflows" active={true} />
        <NavLink icon="schedule" label="Cron Jobs" href="/workflows" />
        <NavLink icon="settings" label="Settings" href="/settings" />
      </div>

      <div className="flex items-center gap-4">
        <SearchBar placeholder="Search schedules..." />

        <NotificationButton badgeCount={3} />

        <UserProfile avatar="AR" name="Alex Rivera" account="Pro Account" displayOnly={true} />
      </div>
    </motion.header>
  )
}
