import Button from '$components/buttons/Button'
import Chip from '$components/display/Chip'
import MS from '$components/display/MS'
import { formatDate } from '$utils/format'
import type { ApiKeyRowProps } from '$types/widgets/settings'

export default function ApiKeyRow({ apiKey, last, onDelete }: ApiKeyRowProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3.5 py-3.5 ${last ? '' : 'border-b border-border-1'}`}
    >
      <span className="knik-tile h-9 w-9">
        <MS name="key" size={18} />
      </span>
      <div className="min-w-[160px] flex-1">
        <div className="break-words text-body font-medium text-fg-1">{apiKey.label}</div>
        <code className="mt-0.5 block font-mono text-caption text-fg-4">
          {apiKey.key_prefix}••••••••
        </code>
      </div>
      {apiKey.scopes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {apiKey.scopes.map(scope => (
            <Chip key={scope} label={scope} />
          ))}
        </div>
      )}
      <div className="text-body-sm sm:text-right">
        <div className="text-fg-3">
          {apiKey.last_used_at ? `Used ${formatDate(apiKey.last_used_at)}` : 'Never used'}
        </div>
        {apiKey.created_at && <div className="text-fg-4">{formatDate(apiKey.created_at)}</div>}
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="knik-btn--destructive rounded-[9px]"
          aria-label={`Remove ${apiKey.label}`}
          title="Remove key"
          onClick={onDelete}
        >
          Remove
        </Button>
      )}
    </div>
  )
}
