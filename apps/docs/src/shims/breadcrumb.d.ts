export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  maxVisible?: number
  className?: string
  ariaLabel?: string
}

export declare function Breadcrumb(props: BreadcrumbProps): JSX.Element
