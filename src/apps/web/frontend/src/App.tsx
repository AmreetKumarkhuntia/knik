import { Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { StoresProvider } from '$stores'
import { ThemeWidget } from '$widgets/theme'
import { MainLayoutWidget } from '$widgets/layout'
import { ErrorBoundaryWidget } from '$widgets/feedback'
import LoadingSpinner from '$components/feedback/LoadingSpinner'
import { ROUTES } from '$lib/constants/navigation'
import {
  Home,
  Workflows,
  WorkflowBuilder,
  ExecutionDetail,
  AllExecutions,
  Schedules,
  Settings,
} from '$pages'

function AnimatedRoutes() {
  const location = useLocation()
  // Keyed per visit to the first path segment: sub-path and query changes never remount, while
  // returning to a still-exiting section mounts it fresh instead of reviving the leaving instance.
  const section = location.pathname.split('/')[1]
  const [visit, setVisit] = useState({ section, id: 0 })
  if (visit.section !== section) setVisit({ section, id: visit.id + 1 })
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={visit.id}
        className="flex flex-col flex-1 min-h-0"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
        exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeOut' } }}
      >
        <Suspense fallback={<LoadingSpinner className="py-20" />}>
          {/* The explicit location keeps the exiting page on its own route while it fades out. */}
          <Routes location={location}>
            <Route path={ROUTES.home} element={<Home />} />
            <Route path={ROUTES.workflows} element={<Workflows />} />
            <Route path={ROUTES.builder} element={<WorkflowBuilder />} />
            <Route path={ROUTES.workflowEdit} element={<WorkflowBuilder />} />
            <Route path={ROUTES.executions} element={<AllExecutions />} />
            <Route path={ROUTES.executionDetail} element={<ExecutionDetail />} />
            <Route path={ROUTES.schedules} element={<Schedules />} />
            <Route path={ROUTES.settings} element={<Settings />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    // framer-motion animates from JS, so the prefers-reduced-motion CSS rule cannot reach it.
    <MotionConfig reducedMotion="user">
      <ErrorBoundaryWidget>
        <StoresProvider>
          <ThemeWidget>
            <BrowserRouter>
              <MainLayoutWidget>
                <AnimatedRoutes />
              </MainLayoutWidget>
            </BrowserRouter>
          </ThemeWidget>
        </StoresProvider>
      </ErrorBoundaryWidget>
    </MotionConfig>
  )
}
