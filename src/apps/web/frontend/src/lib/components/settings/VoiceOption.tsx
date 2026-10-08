import type { VoiceOptionProps } from '$types/widgets/settings'

export default function VoiceOption({ voice }: VoiceOptionProps) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 text-left">
      <span className="text-sm text-fg-1">{voice.name}</span>
      <span className="text-xs text-fg-3">{voice.lang ?? voice.id}</span>
    </span>
  )
}
