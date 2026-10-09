import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { StoresProvider } from '$stores'
import { ThemeWidget } from '$widgets/theme'
import { MainLayoutWidget } from '$widgets/layout'
import { ErrorBoundaryWidget } from '$widgets/feedback'
import FullScreenLoader from '$widgets/FullScreenLoader'
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

export default function App() {
  return (
    // framer-motion animates from JS, so the prefers-reduced-motion CSS rule cannot reach it.
    <MotionConfig reducedMotion="user">
      <ErrorBoundaryWidget>
        <StoresProvider>
          <ThemeWidget>
            <BrowserRouter>
              <MainLayoutWidget>
                <Suspense fallback={<FullScreenLoader variant="block" />}>
                  <Routes>
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
              </MainLayoutWidget>
            </BrowserRouter>
          </ThemeWidget>
        </StoresProvider>
      </ErrorBoundaryWidget>
    </MotionConfig>
  )
}
