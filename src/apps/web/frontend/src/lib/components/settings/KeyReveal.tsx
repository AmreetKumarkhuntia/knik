import Button from '$components/buttons/Button'
import MS from '$components/display/MS'
import Banner from '$components/surfaces/Banner'
import type { KeyRevealProps } from '$types/widgets/settings'

export default function KeyReveal({ value, onCopy, onDismiss }: KeyRevealProps) {
  return (
    <Banner className="mb-3.5" icon={<MS name="key" size={15} />}>
      <div className="mb-2">Supplied demo key — visible until you dismiss it.</div>
      <div className="flex flex-wrap items-center gap-2">
        <code className="font-mono flex-1 min-w-0 break-all text-xs">{value}</code>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Copy demo key"
          onClick={onCopy}
          icon={<MS name="content_copy" size={15} />}
        />
        <Button size="sm" onClick={onDismiss}>
          Done
        </Button>
      </div>
    </Banner>
  )
}
