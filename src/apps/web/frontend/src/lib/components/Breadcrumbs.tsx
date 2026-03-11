import type { BreadcrumbProps } from '$types/components'

export default function Breadcrumbs({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-sm text-textSecondary">{item.label}</span>
          {index < items.length - 1 && (
            <span className="material-symbols-outlined text-xs text-textSecondary">
              chevron_right
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
