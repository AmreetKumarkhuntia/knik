import type { TableProps } from '$types/components'
import LoadingSpinner from '$components/LoadingSpinner'

export type { TableColumn } from '$types/components'

/** Generic data table with column definitions and row click handling. */
export default function Table<T>({
  columns,
  data,
  onRowClick,
  loading = false,
  empty,
  className = '',
  maxHeight,
  stickyHeader = false,
  glassContainer = false,
}: TableProps<T>) {
  if (loading) {
    return <LoadingSpinner text="Loading..." className="py-10" />
  }

  if (data.length === 0 && empty) {
    return <div className={className}>{empty}</div>
  }

  const tableWrapperClass = maxHeight ? 'overflow-x-auto overflow-y-auto' : 'overflow-x-auto'
  const containerClass = `${glassContainer ? 'knik-glass rounded-lg overflow-hidden' : ''}`
  const theadClass = stickyHeader
    ? 'sticky top-0 bg-surface-2/90 backdrop-blur-sm z-10'
    : 'border-b border-[var(--border-2)] text-left'

  return (
    <div className={`${containerClass} ${className}`}>
      <div className={tableWrapperClass} style={maxHeight ? { maxHeight } : undefined}>
        <table className="w-full text-left border-collapse">
          <thead className={theadClass}>
            <tr className="bg-surface-2">
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className="px-6 py-4 text-xs font-medium text-fg-4 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-1)]">
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-surface-3 transition-colors"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column, colIdx) => {
                  const value = row[column.key as keyof T] as unknown
                  return (
                    <td key={colIdx} className="px-6 py-4 text-sm text-fg-2">
                      {column.render ? column.render(value, row) : String(value ?? '-')}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
