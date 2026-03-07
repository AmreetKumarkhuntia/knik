import type { TableProps } from '$types/components'

export type { TableColumn } from '$types/components'

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  loading = false,
  empty,
  className = '',
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="text-center py-10 text-white/50">
        <span className="animate-spin inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
        <p className="mt-2">Loading...</p>
      </div>
    )
  }

  if (data.length === 0 && empty) {
    return <div className={className}>{empty}</div>
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 text-left">
            {columns.map((column, idx) => (
              <th key={idx} className="px-4 py-3 text-white/60 font-medium text-sm">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, colIdx) => {
                const value = row[column.key as keyof T] as unknown
                return (
                  <td key={colIdx} className="px-4 py-3 text-white/80 text-sm">
                    {column.render ? column.render(value, row) : String(value ?? '-')}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
