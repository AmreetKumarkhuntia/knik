import Button from '$components/buttons/Button'
import Chip from '$components/display/Chip'
import MS from '$components/display/MS'
import IconTile from '$components/display/IconTile'
import { formatDate } from '$utils/format'
import type { ApiKeyRowProps } from '$types/widgets/settings'

export default function ApiKeyRow({ apiKey, last, onDelete }: ApiKeyRowProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-3.5 py-3"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border-1)' }}
    >
      <IconTile bg="var(--bg-surface-3)" color="var(--fg-3)" icon={<MS name="key" size={17} />} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-semibold text-[var(--fg-1)]">{apiKey.label}</span>
          {apiKey.scopes.map(scope => (
            <Chip key={scope} label={scope} />
          ))}
        </div>
        <code className="font-mono text-xs text-[var(--fg-4)]">
          {apiKey.key_prefix}••••••••••••
        </code>
      </div>
      <div className="text-right">
        <div className="text-xs text-[var(--fg-3)]">
          {apiKey.last_used_at ? `Used ${formatDate(apiKey.last_used_at)}` : 'Never used'}
        </div>
        {apiKey.created_at && (
          <div className="font-mono text-[10.5px] text-[var(--fg-5)]">
            {formatDate(apiKey.created_at)}
          </div>
        )}
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Remove ${apiKey.label}`}
          title="Remove key"
          onClick={onDelete}
          icon={<MS name="delete" size={15} />}
        />
      )}
    </div>
  )
}
