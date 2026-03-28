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
      <div className={`flex border-b border-border ${className}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
              ${
                active === tab.id
                  ? 'text-foreground border-b-2 border-foreground bg-surface'
                  : 'text-foreground/60 hover:text-foreground hover:bg-surface'
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
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                active === tab.id
                  ? 'text-foreground bg-surfaceRaised border border-border'
                  : 'text-foreground/60 hover:text-foreground hover:bg-surface'
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
