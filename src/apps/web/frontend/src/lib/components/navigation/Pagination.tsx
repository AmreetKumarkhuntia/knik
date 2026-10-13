import Button from '$components/buttons/Button'
import type { PaginationProps } from '$types/components'

/** Page navigation controls with ellipsis for large page ranges. */
export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  const pages: (number | '...')[] =
    totalPages <= 7
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : [
          1,
          ...(currentPage > 3 ? ['...' as const] : []),
          ...Array.from({ length: end - start + 1 }, (_, i) => start + i),
          ...(currentPage < totalPages - 2 ? ['...' as const] : []),
          totalPages,
        ]

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-4 py-4 px-6 border-t border-border-1"
    >
      <div className="text-body-sm text-fg-3">
        Page <span className="font-semibold text-fg-1">{currentPage}</span> of{' '}
        <span className="font-semibold text-fg-1">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-[9px]"
        >
          Previous
        </Button>

        <div className="flex gap-1">
          {pages.map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="self-center px-2 text-label text-fg-4">
                ...
              </span>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                key={page}
                onClick={() => page !== currentPage && onPageChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={`min-w-9 rounded-[9px] px-2.5 tabular-nums ${
                  page === currentPage
                    ? 'bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)] hover:!bg-[var(--primary)] hover:!text-[var(--on-primary)] hover:!border-[var(--primary)]'
                    : ''
                }`}
              >
                {page}
              </Button>
            )
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-[9px]"
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
