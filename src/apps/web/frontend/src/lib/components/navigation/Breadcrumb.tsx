import { Link } from 'react-router-dom'
import MS from '../display/MS'
import type { BreadcrumbProps } from '$types/components'
export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-2 min-w-0 text-body-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li
              key={`${item.path ?? item.label}-${index}`}
              className={`flex items-center gap-2 ${last ? 'min-w-0' : 'shrink-0'}`}
            >
              {index > 0 && <MS name="chevron_right" size={16} className="text-fg-4" />}
              {item.path && !last ? (
                <Link
                  to={item.path}
                  className="knik-focus rounded-xs font-medium text-fg-3 transition-colors hover:text-fg-1"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={`truncate ${last ? 'font-semibold text-fg-1' : 'font-medium text-fg-3'}`}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
