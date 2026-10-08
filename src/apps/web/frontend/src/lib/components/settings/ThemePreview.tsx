import type { ThemePreviewProps } from '$types/widgets/settings'

export default function ThemePreview({ mode }: ThemePreviewProps) {
  const dark = mode === 'dark'
  return (
    <span className="block w-full text-left overflow-hidden">
      <span className="block h-20 p-3" style={{ background: dark ? '#0d1117' : '#f5f6f8' }}>
        <span
          className="block w-[55%] h-2 rounded"
          style={{ background: dark ? '#1c2430' : '#dfe3e9' }}
        />
        <span className="block w-[40%] h-2 rounded mt-2 bg-[var(--acc)]" />
        <span
          className="block w-[70%] h-2 rounded mt-2"
          style={{ background: dark ? '#161c27' : '#e9ecf1' }}
        />
      </span>
      <span className="block px-3 py-2.5 text-[13px] font-semibold text-[var(--fg-1)]">
        {dark ? 'Dark' : 'Light'}
      </span>
    </span>
  )
}
