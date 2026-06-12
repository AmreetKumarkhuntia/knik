import React from 'react'

export interface TooltipProps {
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  children: React.ReactNode
  className?: string
}

export default function Tooltip({
  content,
  placement = 'top',
  delay = 200,
  children,
  className = '',
}: TooltipProps) {
  let placementClasses = ''
  let arrowClasses = ''

  switch (placement) {
    case 'top':
      placementClasses = 'bottom-full left-1/2 -translate-x-1/2 mb-2'
      arrowClasses =
        'top-full left-1/2 -translate-x-1/2 border-t-border-2 border-b-transparent border-x-transparent'
      break
    case 'bottom':
      placementClasses = 'top-full left-1/2 -translate-x-1/2 mt-2'
      arrowClasses =
        'bottom-full left-1/2 -translate-x-1/2 border-b-border-2 border-t-transparent border-x-transparent'
      break
    case 'left':
      placementClasses = 'right-full top-1/2 -translate-y-1/2 mr-2'
      arrowClasses =
        'left-full top-1/2 -translate-y-1/2 border-l-border-2 border-r-transparent border-y-transparent'
      break
    case 'right':
      placementClasses = 'left-full top-1/2 -translate-y-1/2 ml-2'
      arrowClasses =
        'right-full top-1/2 -translate-y-1/2 border-r-border-2 border-l-transparent border-y-transparent'
      break
  }

  return (
    <div className={`relative inline-flex group ${className}`}>
      {children}
      <div
        className={`absolute z-50 pointer-events-none whitespace-nowrap px-2 py-1 bg-surface-3 text-fg-1 font-mono text-[11px] border border-border-2 rounded-[5px] shadow-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${placementClasses}`}
        style={{ transitionDelay: `${delay}ms` }}
        role="tooltip"
      >
        {content}
        {/* Arrow */}
        <div className={`absolute border-[5px] ${arrowClasses}`} aria-hidden="true" />
      </div>
    </div>
  )
}
