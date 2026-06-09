export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  className?: string
  [key: string]: unknown
}

export declare function Separator(props: SeparatorProps): JSX.Element
