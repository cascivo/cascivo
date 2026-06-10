'use client'
import { cn, useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import styles from './pagination.module.css'

export interface PaginationLabels {
  nav?: string
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
  useSignals()
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalItems)

  const navLabel = labels?.nav ?? t(builtin.pagination.nav)
  const itemsPerPageLabel = labels?.itemsPerPage ?? t(builtin.pagination.itemsPerPage)
  const pageOfLabel =
    labels?.pageOf?.(currentPage, totalPages) ??
    t(builtin.pagination.pageOf, { page: currentPage, total: totalPages })
  const rangeLabel =
    labels?.range?.(rangeStart, rangeEnd, totalItems) ??
    t(builtin.pagination.range, { start: rangeStart, end: rangeEnd, total: totalItems })
  const previousLabel = labels?.previous ?? t(builtin.pagination.previous)
  const nextLabel = labels?.next ?? t(builtin.pagination.next)

  return (
    <nav aria-label={navLabel} className={cn(styles['pagination'], className)}>
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
