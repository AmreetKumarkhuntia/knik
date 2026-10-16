import { useCallback, useEffect, useId, useRef } from 'react'
import Button from '$components/buttons/Button'
import EmptyState from '$components/display/EmptyState'
import LoadingSpinner from '$components/feedback/LoadingSpinner'
import Input from '$components/forms/Input'
import Select from '$components/forms/Select'
import Textarea from '$components/forms/Textarea'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import FormGroup from '$widgets/FormGroup'
import FormRow from '$widgets/FormRow'
import { useSettingsScope, useSettingsStore, useSettingsTransport } from '$stores/settings'
import { useFeedbackStore } from '$stores/feedback'
import { useRemoteSettingsView } from '$stores/views'
import type { SettingDefinition } from '$types/sections/settings'
import type { SettingFieldProps } from '$types/widgets/settings'

const describe = (failure: unknown) =>
  failure instanceof Error ? failure.message : 'Settings request failed.'

/** The backend's user settings, drawn from its schema; the one pane that leaves the demo session. */
export default function RemoteSettingsPane() {
  const { scopeId, scope, patch } = useSettingsScope()
  const { status, definitions, error, groups, values, changes, errors, saving } =
    useRemoteSettingsView(scopeId)
  const startLoad = useSettingsStore(s => s.startLoad)
  const finishLoad = useSettingsStore(s => s.finishLoad)
  const dropDraftKeys = useSettingsStore(s => s.dropDraftKeys)
  const transport = useSettingsTransport()
  const addToast = useFeedbackStore(s => s.addToast)
  const id = useId()
  // Saving disables the Save button, which drops keyboard focus; it lands on the first saved field instead.
  const refocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (saving || !refocus.current) return
    refocus.current.focus()
    refocus.current = null
  }, [saving])

  const load = useCallback(async () => {
    const loadId = startLoad()
    try {
      finishLoad(loadId, { status: 'ready', error: null, definitions: await transport.load() })
    } catch (failure) {
      finishLoad(loadId, { status: 'error', error: describe(failure) })
    }
  }, [startLoad, finishLoad, transport])
  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    if (saving) return
    const keys = Object.keys(changes)
    const active = document.activeElement
    refocus.current =
      active instanceof HTMLElement && active.tagName !== 'BUTTON'
        ? active
        : document.getElementById(`${id}-${keys[0]}`)
    patch({ saving: true })
    try {
      await transport.save(changes)
      await load()
      dropDraftKeys(scopeId, keys)
      addToast('Settings saved.', 'success')
    } catch (failure) {
      addToast(describe(failure), 'error')
    } finally {
      patch({ saving: false })
    }
  }
  const reset = async (field: SettingDefinition) => {
    try {
      await transport.reset(field.key)
      await load()
      dropDraftKeys(scopeId, [field.key])
      // The Reset button is gone once the value is no longer stored, so focus moves to the control.
      document.getElementById(`${id}-${field.key}`)?.focus()
      addToast(`Reset ${field.label}.`, 'success')
    } catch (failure) {
      addToast(describe(failure), 'error')
    }
  }

  if (status === 'error')
    return (
      <EmptyState
        icon="cloud_off"
        title="Settings are unavailable"
        description={error ?? undefined}
        action={
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        }
      />
    )
  if (definitions.length === 0)
    return status === 'ready' ? (
      <EmptyState icon="tune" title="No settings to show" />
    ) : (
      <LoadingSpinner className="py-10" />
    )
  const dirty = Object.keys(scope.draft).length > 0
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={event => {
        event.preventDefault()
        void save()
      }}
    >
      {groups.map(([group, fields]) => (
        <FormGroup key={group} title={group}>
          {fields.map((field, index) => (
            <SettingField
              key={field.key}
              id={`${id}-${field.key}`}
              field={field}
              value={values[field.key] ?? ''}
              error={errors[field.key]}
              last={index === fields.length - 1}
              onChange={value => patch({ draft: { ...scope.draft, [field.key]: value } })}
              onReset={field.source === 'db' ? () => void reset(field) : undefined}
            />
          ))}
        </FormGroup>
      ))}
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!dirty || saving}
          onClick={() => patch({ draft: {} })}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={saving}
          disabled={Object.keys(changes).length === 0 || Object.keys(errors).length > 0}
        >
          Save settings
        </Button>
      </div>
    </form>
  )
}

function SettingField({ id, field, value, error, last, onChange, onReset }: SettingFieldProps) {
  const hintId = field.description ? `${id}-hint` : undefined
  const text = typeof value === 'string' ? value : ''
  // shortcut: only system_instruction is multiline, add a schema flag when the backend exposes one
  const multiline = field.key === 'system_instruction'
  const numeric = field.type === 'int' || field.type === 'float'
  const control =
    field.type === 'bool' ? (
      <ToggleSwitch
        id={id}
        aria-label={field.label}
        aria-describedby={hintId}
        checked={value === true}
        onChange={onChange}
      />
    ) : field.options ? (
      <Select
        id={id}
        aria-describedby={hintId}
        presentation="native"
        className="w-full bg-surface"
        options={field.options.map(option => ({ value: option, label: option }))}
        value={text}
        onValueChange={onChange}
      />
    ) : multiline ? (
      <Textarea
        id={id}
        aria-describedby={hintId}
        rows={4}
        className="bg-surface px-3 py-1.5"
        value={text}
        error={error}
        onChange={event => onChange(event.target.value)}
      />
    ) : (
      <Input
        id={id}
        aria-describedby={hintId}
        className="bg-surface"
        type={field.secret ? 'password' : numeric ? 'number' : 'text'}
        step={field.type === 'int' ? 1 : field.type === 'float' ? 'any' : undefined}
        min={numeric ? (field.minimum ?? undefined) : undefined}
        max={numeric ? (field.maximum ?? undefined) : undefined}
        inputMode={numeric ? 'decimal' : undefined}
        autoComplete={field.secret ? 'new-password' : undefined}
        placeholder={field.secret ? (field.value ? 'Set (hidden)' : 'Not set') : undefined}
        value={text}
        error={error}
        onChange={event => onChange(event.target.value)}
      />
    )
  return (
    <FormRow
      label={field.label}
      hint={field.description || undefined}
      hintId={hintId}
      htmlFor={id}
      last={last}
    >
      <div
        className={`flex min-w-0 items-start gap-2 ${multiline ? 'w-full' : 'w-full sm:w-auto'}`}
      >
        <div className={multiline ? 'w-full' : 'w-full min-w-0 sm:w-[260px]'}>{control}</div>
        {onReset && (
          <Button variant="ghost" size="xs" aria-label={`Reset ${field.label}`} onClick={onReset}>
            Reset
          </Button>
        )}
      </div>
    </FormRow>
  )
}
