import type { TableProps } from '$types/components'
import LoadingSpinner from '$components/LoadingSpinner'

export type { TableColumn } from '$types/components'

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

  const tableWrapperClass = `overflow-x-auto ${maxHeight ? `max-h-[${maxHeight}] overflow-y-auto` : ''}`
  const containerClass = `${glassContainer ? 'glass border border-white/10 rounded-xl overflow-hidden' : ''}`
  const theadClass = stickyHeader
    ? 'sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10'
    : 'border-b border-white/10 text-left'

  return (
    <div className={`${containerClass} ${className}`}>
      <div className={tableWrapperClass}>
        <table className="w-full text-left border-collapse">
          <thead className={theadClass}>
            <tr className="bg-white/5">
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-white/5 transition-colors"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column, colIdx) => {
                  const value = row[column.key as keyof T] as unknown
                  return (
                    <td key={colIdx} className="px-6 py-4 text-sm text-slate-100">
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
