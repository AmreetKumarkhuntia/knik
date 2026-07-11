import type { TabsProps } from '$types/components'

export type { Tab } from '$types/components'

/** Tab switcher with underline or pill variants. */
export default function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-[var(--border-2)] ${className}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
              ${
                active === tab.id
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-fg-3 hover:text-fg-1'
              }
            `}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${
                active === tab.id
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                  : 'text-fg-3 hover:text-fg-1 hover:bg-surface-3'
              }
          `}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
