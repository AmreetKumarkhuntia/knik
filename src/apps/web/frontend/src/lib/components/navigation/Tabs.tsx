import { useId, useRef } from 'react'
import type { TabsProps } from '$types/components'
import Button from '../buttons/Button'
export type { Tab } from '$types/components'
export default function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  variant = 'underline',
  orientation = 'horizontal',
  idPrefix,
  className = '',
}: TabsProps<T>) {
  const generated = useId(),
    prefix = idPrefix ?? generated
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={`flex ${orientation === 'vertical' ? 'flex-col gap-1' : 'gap-2'} ${variant === 'underline' ? 'border-b border-border-2' : ''} ${className}`}
    >
      {tabs.map((tab, index) => (
        <Button
          key={tab.id}
          ref={element => {
            refs.current[index] = element
          }}
          role="tab"
          id={`${prefix}-tab-${tab.id}`}
          aria-selected={active === tab.id}
          aria-controls={`${prefix}-panel-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
          variant="ghost"
          onClick={() => onChange(tab.id)}
          onKeyDown={event => {
            const next = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight',
              previous = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
            if (![next, previous, 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const target =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? tabs.length - 1
                  : (index + (event.key === next ? 1 : -1) + tabs.length) % tabs.length
            onChange(tabs[target].id)
            refs.current[target]?.focus()
          }}
          className={`justify-start ${active === tab.id ? 'text-[var(--acc-text)] bg-[var(--acc-soft)]' : 'text-fg-3'}`}
        >
          {tab.icon && (
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              {tab.icon}
            </span>
          )}
          {tab.label}
        </Button>
      ))}
    </div>
  )
}
