export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
  [key: string]: unknown
}

export declare function Spinner(props: SpinnerProps): JSX.Element
