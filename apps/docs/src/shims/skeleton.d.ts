export interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect'
  width?: string
  height?: string
  lines?: number
  className?: string
  [key: string]: unknown
}

export declare function Skeleton(props: SkeletonProps): JSX.Element
