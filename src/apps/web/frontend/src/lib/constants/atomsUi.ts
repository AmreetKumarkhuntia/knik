/** Class sets for the shared form and navigation atoms (Radio, Tabs). */
import type { RadioProps } from '$types/components/forms'

const SEGMENTED_BOX = 'inline-flex gap-0.5 p-[3px] rounded-[11px] bg-panel border border-border-1'
const SEGMENTED_SELECTED =
  'bg-panel-3 text-fg-1 shadow-[0_1px_2px_rgba(0,0,0,.3),inset_0_0_0_1px_var(--border-3)]'
// Compact heights apply to a mouse on desktop widths; touch and narrow screens keep the 44px target from primitives.css.
const SEGMENTED_HEIGHT = '[@media(pointer:fine)_and_(min-width:768px)]:min-h-[28px]'

/** Option layout and states per Radio presentation; `selected`/`idle` swap with the checked option. */
export const RADIO_PRESENTATION: Record<
  NonNullable<RadioProps['presentation']>,
  { options: string; option: string; selected: string; idle: string; label: string; mono: string }
> = {
  standard: {
    options: 'flex flex-col gap-3',
    option: 'flex items-center gap-3 rounded-sm',
    selected: '',
    idle: '',
    label: 'text-label text-fg-2',
    mono: 'text-mono-sm',
  },
  card: {
    options: 'flex flex-col gap-0.5',
    option:
      'flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 transition-colors duration-base ease-out',
    selected: 'bg-[var(--acc-soft)]',
    idle: 'hover:bg-panel-2',
    label: 'min-w-0 flex-1 text-body font-medium text-fg-1',
    mono: 'text-caption',
  },
  chip: {
    options: 'flex flex-wrap gap-2',
    option:
      'inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-label transition-colors duration-base ease-out',
    selected: 'border-[var(--acc-border)] bg-[var(--acc-soft)] text-[var(--acc-text)]',
    idle: 'border-border-2 bg-panel-2 text-fg-2 hover:bg-panel-3',
    label: 'inline-flex items-center gap-1.5',
    mono: 'text-mono-sm',
  },
  segmented: {
    options: SEGMENTED_BOX,
    option: `inline-flex items-center justify-center whitespace-nowrap rounded-[8px] px-3 py-1 text-label transition-[background-color,color,box-shadow] duration-base ease-out ${SEGMENTED_HEIGHT}`,
    selected: SEGMENTED_SELECTED,
    idle: 'text-fg-3 hover:bg-panel-2 hover:text-fg-1',
    label: 'inline-flex items-center gap-1.5',
    mono: 'text-mono-sm',
  },
}

/**
 * Tab list and tab classes per look (Tabs). Tabs are ghost Buttons, whose primitive hover rule
 * outranks plain utilities, so hover overrides carry `!`.
 */
export const TAB_LOOKS = {
  vertical: {
    list: 'relative flex flex-col gap-0.5',
    tab: 'relative isolate justify-start gap-2.5 rounded-[11px] px-3 text-body font-medium [@media(pointer:fine)]:min-h-[38px]',
    selected: 'text-[var(--acc-text)] hover:!bg-transparent hover:!text-[var(--acc-text)]',
    idle: 'text-fg-3 hover:!bg-panel-2 hover:!text-fg-1',
  },
  pills: {
    list: SEGMENTED_BOX,
    tab: `gap-1.5 rounded-[8px] px-3 py-1 text-label ${SEGMENTED_HEIGHT}`,
    selected: `${SEGMENTED_SELECTED} hover:!bg-panel-3`,
    idle: 'text-fg-3',
  },
  underline: {
    list: 'flex gap-1 border-b border-border-1',
    tab: 'relative -mb-px rounded-none px-3 text-label hover:!bg-transparent',
    selected:
      "text-[var(--acc-text)] hover:!text-[var(--acc-text)] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-[var(--primary)] after:content-['']",
    idle: 'text-fg-3',
  },
} as const
