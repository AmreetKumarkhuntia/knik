import { describe, expect, it } from 'vitest'
import { createDemoSeed } from '$stores/demo'
import { createWorkflowStore } from '$stores/workflows/store'
import { createScheduleStore } from '$stores/schedules/store'
import { createScheduleCommand } from '$stores/schedules/actions'
function setup() {
  const seed = createDemoSeed({
    workflows: [
      { id: 'one', name: 'Existing workflow', definition: { nodes: {}, connections: [] } },
    ],
  })
  const stores = { workflows: createWorkflowStore(seed), schedules: createScheduleStore(seed) }
  stores.schedules.getState().initScope('form')
  return { ...stores, save: createScheduleCommand(stores) }
}
describe('schedule commands', () => {
  it('rejects missing workflows without a partial update and retains the draft', () => {
    const stores = setup()
    stores.schedules.getState().patchScope('form', {
      creating: true,
      draft: {
        target_workflow_id: 'missing',
        schedule_description: 'Every Monday',
        timezone: 'UTC',
      },
    })
    expect(stores.save('form').ok).toBe(false)
    expect(stores.schedules.getState().schedules).toHaveLength(0)
    expect(stores.schedules.getState().scopes.form!.draft.schedule_description).toBe('Every Monday')
    expect(stores.schedules.getState().scopes.form!.error).toContain('Select a workflow')
  })
  it('reports the first failure when the description and timezone are both invalid', () => {
    const stores = setup()
    stores.schedules.getState().patchScope('form', {
      draft: { target_workflow_id: 'one', schedule_description: '  ', timezone: 'not-a-timezone' },
    })
    expect(stores.save('form')).toEqual({ ok: false, error: 'Enter a schedule description.' })
    expect(stores.schedules.getState().scopes.form!.error).toBe('Enter a schedule description.')
  })
  it('validates timezone before committing and clears only the saved scope', () => {
    const stores = setup()
    stores.schedules.getState().initScope('other')
    stores.schedules.getState().patchScope('form', {
      creating: true,
      draft: {
        target_workflow_id: 'one',
        schedule_description: '  Every Monday  ',
        timezone: 'not-a-timezone',
      },
    })
    expect(stores.save('form').ok).toBe(false)
    stores.schedules.getState().patchScope('form', {
      draft: { ...stores.schedules.getState().scopes.form!.draft, timezone: 'UTC' },
    })
    expect(stores.save('form')).toEqual({ ok: true, id: 1 })
    expect(stores.schedules.getState().schedules[0]).toMatchObject({
      target_workflow_id: 'one',
      schedule_description: 'Every Monday',
      timezone: 'UTC',
    })
    expect(stores.schedules.getState().scopes.form!.creating).toBe(false)
    expect(stores.schedules.getState().scopes.other).toBeDefined()
  })
  it('cancels a draft without changing committed schedules', () => {
    const stores = setup()
    stores.schedules.getState().patchScope('form', {
      creating: true,
      draft: { target_workflow_id: 'one', schedule_description: 'Every day' },
    })
    stores.schedules.getState().closeCreate('form')
    expect(stores.schedules.getState().schedules).toHaveLength(0)
    expect(stores.schedules.getState().scopes.form!.draft.schedule_description).toBe('')
  })
})
