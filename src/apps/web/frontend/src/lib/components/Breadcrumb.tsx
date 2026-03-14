import { Link } from 'react-router-dom'
import type { BreadcrumbProps } from '$types/components'

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <span className="material-symbols-outlined text-secondary text-sm">chevron_right</span>
          )}
          {item.path ? (
            <Link
              to={item.path}
              className="text-secondary font-medium hover:text-primary transition-colors text-sm"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-semibold text-sm">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}
