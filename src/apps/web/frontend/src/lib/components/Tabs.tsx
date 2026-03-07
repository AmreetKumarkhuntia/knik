import type { TabsProps } from '$types/components'

export type { Tab } from '$types/components'

export default function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-white/10 ${className}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
              ${
                active === tab.id
                  ? 'text-white border-b-2 border-white bg-white/5'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
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
                ? 'text-white bg-white/10 border border-white/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
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
