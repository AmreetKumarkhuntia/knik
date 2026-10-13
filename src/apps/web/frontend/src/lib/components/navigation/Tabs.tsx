import { useId, useRef } from 'react'
import { motion } from 'framer-motion'
import { MOTION_DURATION, MOTION_EASE_SPRING } from '$lib/constants/motion'
import { TAB_LOOKS } from '$lib/constants/atomsUi'
import type { TabsProps } from '$types/components'
import Button from '../buttons/Button'
import MS from '../display/MS'
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
  const vertical = orientation === 'vertical'
  const look = TAB_LOOKS[vertical ? 'vertical' : variant]
  return (
    <div role="tablist" aria-orientation={orientation} className={`${look.list} ${className}`}>
      {tabs.map((tab, index) => {
        const selected = active === tab.id
        return (
          <Button
            key={tab.id}
            ref={element => {
              refs.current[index] = element
            }}
            role="tab"
            id={`${prefix}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${prefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            variant="ghost"
            onClick={() => onChange(tab.id)}
            onKeyDown={event => {
              const next = vertical ? 'ArrowDown' : 'ArrowRight',
                previous = vertical ? 'ArrowUp' : 'ArrowLeft'
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
            className={`${look.tab} ${selected ? look.selected : look.idle}`}
          >
            {vertical && selected && (
              <motion.span
                layoutId={`${prefix}-pill`}
                aria-hidden="true"
                className="absolute inset-0 -z-10 rounded-[11px] bg-[var(--acc-soft)] shadow-[inset_0_0_0_1px_var(--acc-border)]"
                transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE_SPRING }}
              />
            )}
            {tab.icon && (
              <MS name={tab.icon} size={vertical ? 19 : 16} fill={selected && vertical ? 1 : 0} />
            )}
            {tab.label}
          </Button>
        )
      })}
    </div>
  )
}
