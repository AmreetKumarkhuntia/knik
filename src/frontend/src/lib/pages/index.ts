import { lazy } from 'react'

// Routes load on first visit so page-only code (workflow canvas, chat markdown and
// syntax highlighting) stays out of the entry chunk.
export const Home = lazy(() => import('$widgets/chat/ChatWidget'))
export const Workflows = lazy(() => import('$widgets/workflows/WorkflowHubWidget'))
export const WorkflowBuilder = lazy(() => import('./WorkflowBuilder'))
export const ExecutionDetail = lazy(() => import('./ExecutionDetail'))
export const AllExecutions = lazy(() => import('$widgets/workflows/AllExecutionsWidget'))
export const Schedules = lazy(() => import('$widgets/schedules/SchedulesWidget'))
export const Settings = lazy(() => import('./Settings'))
