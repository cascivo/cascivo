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

export declare function Pagination(props: PaginationProps): JSX.Element
