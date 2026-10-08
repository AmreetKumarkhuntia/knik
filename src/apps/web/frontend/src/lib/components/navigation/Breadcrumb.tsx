import { Link } from 'react-router-dom'
import type { BreadcrumbProps } from '$types/components'
export default function Breadcrumb({
  items,
  separator = 'chevron',
  className = '',
}: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-fg-3">
        {items.map((item, index) => (
          <li key={`${item.path ?? item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">{separator === '/' ? '/' : '›'}</span>}
            {item.path && index < items.length - 1 ? (
              <Link to={item.path}>{item.label}</Link>
            ) : (
              <span aria-current={index === items.length - 1 ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
