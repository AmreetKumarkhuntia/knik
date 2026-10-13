import { useId } from 'react'
import MS from '$components/display/MS'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import { TOOL_GROUP_FALLBACK_ICON, TOOL_GROUP_ICONS } from '$lib/constants'
import type { ToolGroupListProps } from '$types/widgets/settings'

export default function ToolGroupList({ groups, onToggle, variant = 'rows' }: ToolGroupListProps) {
  const id = useId()
  if (groups.length === 0) {
    return <p className="py-3 text-body-sm text-fg-4">No tool groups available.</p>
  }

  const cards = variant === 'cards'
  return (
    <ul className={cards ? 'flex flex-col gap-1.5' : undefined}>
      {groups.map((group, index) => (
        <li
          key={group.name}
          className={`flex items-center gap-3 ${
            cards
              ? 'rounded-[12px] border border-border-1 bg-panel px-3 py-2.5 transition-colors duration-base ease-out hover:bg-panel-2'
              : 'border-b border-border-1 py-3 last:border-b-0'
          }`}
        >
          {/* The switch keeps its own aria-label; this label only widens the click target to the row. */}
          <label
            htmlFor={`${id}-${index}`}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
          >
            <span className="knik-tile h-8 w-8 rounded-[9px] border-0">
              <MS
                name={
                  Object.hasOwn(TOOL_GROUP_ICONS, group.name)
                    ? TOOL_GROUP_ICONS[group.name]
                    : TOOL_GROUP_FALLBACK_ICON
                }
                size={17}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block break-words font-mono text-body font-medium text-fg-1">
                {group.name}
              </span>
              <span className="block text-caption tabular-nums text-fg-4">
                {group.count} {group.count === 1 ? 'tool' : 'tools'}
              </span>
            </span>
          </label>
          <ToggleSwitch
            id={`${id}-${index}`}
            aria-label={group.name}
            checked={group.enabled}
            onChange={enabled => onToggle(group.name, enabled)}
          />
        </li>
      ))}
    </ul>
  )
}
