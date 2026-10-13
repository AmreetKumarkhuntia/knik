import type { TableProps } from '$types/components'
import { TableRoot, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from './TableParts'

export default function Table<T>({
  columns,
  data,
  getRowKey,
  empty,
  maxHeight,
  stickyHeader = false,
}: TableProps<T>) {
  return (
    <div className="knik-card min-w-0 overflow-hidden">
      {!data.length ? (
        <div className="p-4">{empty ?? 'No records to display.'}</div>
      ) : (
        <div className="overflow-auto" style={{ maxHeight }}>
          <TableRoot className="w-full text-left border-collapse">
            <TableHead className={stickyHeader ? 'sticky top-0 z-10 bg-surface' : undefined}>
              <TableRow>
                {columns.map(column => (
                  <TableHeaderCell
                    key={String(column.key)}
                    className="px-4 py-2 border-b border-border-1 text-micro font-semibold uppercase tracking-[.08em] text-fg-4 whitespace-nowrap"
                  >
                    {column.label}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow
                  key={getRowKey(row)}
                  className="knik-enter-rise border-b border-border-1 last:border-0 transition-colors duration-base ease-out hover:bg-[var(--row-hover)]"
                  // Capped so long lists never hold rows back for seconds; --m drops the delay under reduced motion.
                  style={{ animationDelay: `calc(${Math.min(index, 8) * 0.05}s * var(--m))` }}
                >
                  {columns.map(column => (
                    <TableCell
                      key={String(column.key)}
                      className="px-4 py-3 align-middle text-body-sm text-fg-2"
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
