import type { PaginationProps } from '$types/components'

/** Page navigation controls with ellipsis for large page ranges. */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      pages.push(totalPages)
    }

    return pages
  }

  const handlePrevious = () => {
    if (currentPage > 1 && !disabled) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages && !disabled) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageClick = (page: number) => {
    if (!disabled && page !== currentPage) {
      onPageChange(page)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 py-4 px-6 border-t border-[var(--border-2)]">
      <div className="text-sm text-fg-3">
        Page <span className="font-semibold text-fg-1">{currentPage}</span> of{' '}
        <span className="font-semibold text-fg-1">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={disabled || currentPage === 1}
          className="px-3 py-1.5 text-sm font-medium rounded-md border border-[var(--border-2)] bg-surface-2 text-fg-2 hover:bg-surface-3 hover:text-fg-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Previous
        </button>

        <div className="flex gap-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-3 py-1.5 text-fg-4">
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <button
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                disabled={disabled}
                className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
                  isActive
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]'
                    : 'border-[var(--border-2)] bg-surface-2 text-fg-2 hover:bg-surface-3 hover:text-fg-1'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          onClick={handleNext}
          disabled={disabled || currentPage === totalPages}
          className="px-3 py-1.5 text-sm font-medium rounded-md border border-[var(--border-2)] bg-surface-2 text-fg-2 hover:bg-surface-3 hover:text-fg-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Next
        </button>
      </div>
    </div>
  )
}
