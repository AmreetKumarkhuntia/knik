import MS from '$components/display/MS'
import IconTile from '$components/display/IconTile'
import type { VoiceOptionProps } from '$types/widgets/settings'

export default function VoiceOption({ voice }: VoiceOptionProps) {
  return (
    <span className="block text-left">
      <IconTile
        size={30}
        bg="var(--acc-soft)"
        color="var(--acc-text)"
        icon={<MS name="graphic_eq" size={16} />}
      />
      <span className="block mt-2 text-[13px] font-semibold text-[var(--fg-1)]">{voice.name}</span>
      <span className="block font-mono text-[10.5px] text-[var(--fg-4)]">
        {voice.lang ?? voice.id}
      </span>
    </span>
  )
}
