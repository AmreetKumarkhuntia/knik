import KnikGlyph from '$components/display/KnikGlyph'
import type { VoiceOptionProps } from '$types/widgets/settings'

export default function VoiceOption({ voice, active = false }: VoiceOptionProps) {
  const descriptor = voice.tags?.join(', ')
  const meta = [voice.lang, descriptor].filter(Boolean).join(' · ') || voice.id
  return (
    <span className="flex w-full min-w-0 items-center gap-3 text-left">
      <span className="min-w-0 flex-1">
        <span className="block break-words text-body font-medium text-fg-1">{voice.name}</span>
        <span className="block text-caption text-fg-4">{meta}</span>
      </span>
      {active && <KnikGlyph size={14} animated className="knik-enter-fade ml-auto shrink-0" />}
    </span>
  )
}
