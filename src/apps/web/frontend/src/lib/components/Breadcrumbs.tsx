interface Breadcrumb {
  label: string
  path?: string
}

interface BreadcrumbsProps {
  items: Breadcrumb[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
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
