import type { TableProps } from '$types/components'
import LoadingSpinner from '../feedback/LoadingSpinner'
import { TableRoot, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from './TableParts'
export type { TableColumn } from '$types/components'

export default function Table<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  loading = false,
  empty,
  error,
  className = '',
  maxHeight,
  stickyHeader = false,
  glassContainer = false,
  density = 'comfortable',
}: TableProps<T>) {
  const padding = density === 'compact' ? 'px-4 py-2' : 'px-6 py-4'
  return (
    <div
      className={`${glassContainer ? 'knik-glass rounded-lg overflow-hidden' : ''} ${className}`}
      aria-busy={loading}
    >
      {error && (
        <div role="alert" className="p-4 text-[var(--danger)]">
          {error}
        </div>
      )}
      {loading && !data.length ? (
        <LoadingSpinner text="Loading…" className="py-10" />
      ) : !data.length ? (
        <div className="p-4">{empty ?? 'No records to display.'}</div>
      ) : (
        <div className="overflow-auto" style={{ maxHeight }}>
          <TableRoot className="w-full text-left border-collapse">
            <TableHead
              className={
                stickyHeader
                  ? 'sticky top-0 bg-surface-2/90 backdrop-blur-sm z-10'
                  : 'border-b border-[var(--border-2)]'
              }
            >
              <TableRow className="bg-surface-2">
                {columns.map(column => (
                  <TableHeaderCell
                    key={column.id ?? String(column.key)}
                    className={`${padding} text-xs font-medium text-fg-4 uppercase tracking-wider ${column.className ?? ''}`}
                    style={{ textAlign: column.align }}
                  >
                    {column.label}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody className="divide-y divide-[var(--border-1)]">
              {data.map(row => (
                <TableRow
                  key={getRowKey(row)}
                  className="hover:bg-surface-3 transition-colors"
                  onClick={event => {
                    if (
                      (event.target as HTMLElement).closest(
                        'a,button,input,select,textarea,label,summary,[role="button"],[role="checkbox"],[role="switch"]'
                      )
                    )
                      return
                    onRowClick?.(row)
                  }}
                >
                  {columns.map(column => (
                    <TableCell
                      key={column.id ?? String(column.key)}
                      className={`${padding} text-sm text-fg-2 ${column.className ?? ''}`}
                      style={{ textAlign: column.align }}
                    >
                      {column.render
                        ? column.render(row[column.key as keyof T], row)
                        : String(row[column.key as keyof T] ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </div>
      )}
    </div>
  )
}
