export interface TextareaProps {
  label?: string
  hint?: string
  error?: string
  rows?: number
  resize?: 'none' | 'vertical' | 'both'
  placeholder?: string
  disabled?: boolean
  className?: string
  [key: string]: unknown
}

export declare function Textarea(props: TextareaProps): JSX.Element
