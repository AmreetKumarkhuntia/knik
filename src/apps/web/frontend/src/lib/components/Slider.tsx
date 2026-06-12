export interface SliderProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  step?: number
  label?: string
  className?: string
}

/**
 * Slider track with aurora gradient thumb.
 */
export default function Slider({
  min,
  max,
  value,
  onChange,
  step = 1,
  label,
  className = '',
}: SliderProps) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))

  return (
    <div className={`flex items-center gap-3.5 w-full ${className}`}>
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--fg-4)] w-[100px] shrink-0">
          {label}
        </span>
      )}
      <div className="flex-1 h-[4px] bg-[var(--bg-surface-3)] rounded-full relative">
        <div
          className="absolute left-0 top-0 bottom-0 rounded-full"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, var(--aurora-400), var(--teal-400))',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[16px] h-[16px] rounded-full bg-[var(--fg-1)] border-[3px] border-[var(--aurora-400)] pointer-events-none"
          style={{
            left: `${percentage}%`,
            boxShadow:
              '0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent), 0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        />
      </div>
      <span className="font-mono text-[12px] text-[var(--aurora-300)] w-[56px] text-right shrink-0">
        {value}
      </span>
    </div>
  )
}
