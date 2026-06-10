export interface ProgressBarProps {
  value?: number
  max?: number
  label?: string
  helperText?: string
  size?: 'sm' | 'md'
  status?: 'active' | 'success' | 'error'
  className?: string
}

export declare function ProgressBar(props: ProgressBarProps): JSX.Element
