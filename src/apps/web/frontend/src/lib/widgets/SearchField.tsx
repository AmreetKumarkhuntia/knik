import { useState } from 'react'
import { MS } from '$components'
import type { SearchFieldProps } from '$types'

/** Search input with a leading icon and a focus ring. */
export default function SearchField({
  value,
  onChange,
  placeholder = 'Search workflows…',
}: SearchFieldProps) {
  const [f, setF] = useState(false)
  return (
    <div
      className="flex items-center"
      style={{
        gap: 8,
        padding: '7px 11px',
        width: 220,
        borderRadius: 'var(--r-btn, 8px)',
        background: 'var(--bg-surface)',
        border: `1px solid ${f ? 'var(--acc-border, rgba(0,217,244,0.45))' : 'var(--border-2)'}`,
        transition: 'all 150ms var(--ease-out)',
      }}
    >
      <MS name="search" size={16} style={{ color: 'var(--fg-4)' }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        className="flex-1 border-none outline-none bg-transparent font-sans min-w-0"
        style={{ color: 'var(--fg-1)', fontSize: 13 }}
      />
    </div>
  )
}
