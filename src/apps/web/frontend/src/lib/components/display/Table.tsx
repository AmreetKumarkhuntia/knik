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
    <div className="min-w-0 rounded-lg border border-[var(--border-2)] bg-surface overflow-hidden">
      {!data.length ? (
        <div className="p-4">{empty ?? 'No records to display.'}</div>
      ) : (
        <div className="overflow-auto" style={{ maxHeight }}>
          <TableRoot className="w-full text-left border-collapse">
            <TableHead
              className={
                stickyHeader
                  ? 'sticky top-0 bg-surface-2 z-10'
                  : 'border-b border-[var(--border-2)]'
              }
            >
              <TableRow className="bg-surface-2">
                {columns.map(column => (
                  <TableHeaderCell
                    key={String(column.key)}
                    className="px-4 py-2 text-label text-fg-3 whitespace-nowrap"
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
                  className="h-11 hover:bg-surface-2 transition-colors"
                >
                  {columns.map(column => (
                    <TableCell
                      key={String(column.key)}
                      className="px-4 py-2 text-body-sm text-fg-2"
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
