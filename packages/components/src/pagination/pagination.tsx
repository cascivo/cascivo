'use client'
import { cn } from '@cascade-ui/core'
import styles from './pagination.module.css'

export interface PaginationLabels {
  itemsPerPage?: string
  pageOf?: (page: number, total: number) => string
  range?: (start: number, end: number, total: number) => string
  previous?: string
  next?: string
}

export interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  labels?: PaginationLabels
  className?: string
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  labels,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalItems)

  const itemsPerPageLabel = labels?.itemsPerPage ?? 'Items per page'
  const pageOfLabel =
    labels?.pageOf?.(currentPage, totalPages) ?? `Page ${currentPage} of ${totalPages}`
  const rangeLabel =
    labels?.range?.(rangeStart, rangeEnd, totalItems) ??
    `${rangeStart}–${rangeEnd} of ${totalItems} items`
  const previousLabel = labels?.previous ?? 'Previous page'
  const nextLabel = labels?.next ?? 'Next page'

  return (
    <nav aria-label="Pagination" className={cn(styles['pagination'], className)}>
      {onPageSizeChange && (
        <label className={styles['group']}>
          <span className={styles['label']}>{itemsPerPageLabel}</span>
          <select
            className={styles['select']}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      )}
      <span className={styles['range']}>{rangeLabel}</span>
      <div className={styles['group']}>
        <select
          className={styles['select']}
          aria-label={pageOfLabel}
          value={currentPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
        <span className={styles['label']} aria-hidden="true">
          {pageOfLabel}
        </span>
      </div>
      <div className={styles['buttons']}>
        <button
          type="button"
          className={styles['button']}
          aria-label={previousLabel}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <span aria-hidden="true">&#8249;</span>
        </button>
        <button
          type="button"
          className={styles['button']}
          aria-label={nextLabel}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span aria-hidden="true">&#8250;</span>
        </button>
      </div>
    </nav>
  )
}
