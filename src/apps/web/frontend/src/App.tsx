import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StoresProvider } from '$stores'
import { ThemeWidget } from '$widgets/theme'
import { MainLayoutWidget } from '$widgets/layout'
import { ErrorBoundaryWidget } from '$widgets/feedback'
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
    <ErrorBoundaryWidget>
      <StoresProvider>
        <ThemeWidget>
          <BrowserRouter>
            <MainLayoutWidget>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/workflows" element={<Workflows />} />
                <Route path="/workflows/create" element={<WorkflowBuilder />} />
                <Route path="/workflows/:id/edit" element={<WorkflowBuilder />} />
                <Route path="/workflows/executions" element={<AllExecutions />} />
                <Route path="/executions/:id" element={<ExecutionDetail />} />
                <Route path="/schedules" element={<Schedules />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </MainLayoutWidget>
          </BrowserRouter>
        </ThemeWidget>
      </StoresProvider>
    </ErrorBoundaryWidget>
  )
}
