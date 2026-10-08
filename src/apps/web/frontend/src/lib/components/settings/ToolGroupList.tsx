import Checkbox from '$components/forms/Checkbox'
import type { ToolGroupListProps } from '$types/widgets/settings'

export default function ToolGroupList({ groups, onToggle }: ToolGroupListProps) {
  if (groups.length === 0) {
    return <p className="py-3 text-sm text-fg-3">No tool groups available.</p>
  }

  return (
    <ul className="divide-y divide-[var(--border-1)]">
      {groups.map(group => (
        <li key={group.name} className="flex min-h-12 items-center justify-between gap-3 py-2">
          <Checkbox
            className="min-h-9 min-w-0 flex-1"
            checked={group.enabled}
            onChange={enabled => onToggle(group.name, enabled)}
            label={<span className="break-words text-sm">{group.name}</span>}
          />
          <span className="shrink-0 text-xs tabular-nums text-fg-3">
            {group.count} {group.count === 1 ? 'tool' : 'tools'}
          </span>
        </li>
      ))}
    </ul>
  )
}
