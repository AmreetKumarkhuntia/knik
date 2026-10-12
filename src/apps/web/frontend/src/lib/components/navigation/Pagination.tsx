import Button from '$components/buttons/Button'
import type { PaginationProps } from '$types/components'

const STEP_BUTTON =
  'px-3 py-1.5 text-label rounded-md border border-[var(--border-2)] bg-surface-2 text-fg-2 hover:bg-surface-3 hover:text-fg-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all'

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
      className="flex items-center justify-between gap-4 py-4 px-6 border-t border-[var(--border-2)]"
    >
      <div className="text-body-sm text-fg-3">
        Page <span className="font-semibold text-fg-1">{currentPage}</span> of{' '}
        <span className="font-semibold text-fg-1">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={STEP_BUTTON}
        >
          Previous
        </Button>

        <div className="flex gap-1">
          {pages.map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-3 py-1.5 text-fg-4">
                ...
              </span>
            ) : (
              <Button
                variant="ghost"
                key={page}
                onClick={() => page !== currentPage && onPageChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={`px-3 py-1.5 text-label rounded-md border transition-all ${
                  page === currentPage
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]'
                    : 'border-[var(--border-2)] bg-surface-2 text-fg-2 hover:bg-surface-3 hover:text-fg-1'
                }`}
              >
                {page}
              </Button>
            )
          )}
        </div>

        <Button
          variant="ghost"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={STEP_BUTTON}
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
