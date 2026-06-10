export interface ProgressStep {
  label: string
  description?: string
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[]
  currentIndex: number
  vertical?: boolean
  className?: string
}

export declare function ProgressIndicator(props: ProgressIndicatorProps): JSX.Element
