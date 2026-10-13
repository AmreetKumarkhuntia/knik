import type { Schedule } from '$types/workflow'

export const demoSchedules = [
  {
    id: 1,
    target_workflow_id: 'wf-1',
    schedule_description: 'Every day at 09:00',
    enabled: true,
    timezone: 'UTC',
  },
  {
    id: 2,
    target_workflow_id: 'wf-2',
    schedule_description: 'Every 30 minutes',
    enabled: true,
    timezone: 'UTC',
  },
  {
    id: 3,
    target_workflow_id: 'wf-5',
    schedule_description: 'Fridays at 18:00',
    enabled: true,
    timezone: 'UTC',
  },
  {
    id: 4,
    target_workflow_id: 'wf-4',
    schedule_description: 'Hourly',
    enabled: false,
    timezone: 'UTC',
  },
  {
    id: 5,
    target_workflow_id: 'wf-3',
    schedule_description: 'Weekdays at 07:15',
    enabled: true,
    timezone: 'Europe/Paris',
  },
] satisfies Schedule[]
