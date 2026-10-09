import { lazy } from 'react'

// Routes load on first visit so page-only code (workflow canvas, chat markdown and
// syntax highlighting) stays out of the entry chunk.
export const Home = lazy(() => import('./Home'))
export const Workflows = lazy(() => import('./Workflows'))
export const WorkflowBuilder = lazy(() => import('./WorkflowBuilder'))
export const ExecutionDetail = lazy(() => import('./ExecutionDetail'))
export const AllExecutions = lazy(() => import('./AllExecutions'))
export const Schedules = lazy(() => import('./Schedules'))
export const Settings = lazy(() => import('./Settings'))
