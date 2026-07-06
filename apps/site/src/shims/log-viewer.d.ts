export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogLine {
  id: string | number
  text: string
  level?: LogLevel
}

export declare function LogViewer(props: {
  lines: { readonly value: readonly LogLine[] } | readonly LogLine[]
  rowHeight?: number
  maxHeight?: string
  ansi?: boolean
  search?: string
  follow?: boolean
  className?: string
  [key: string]: unknown
}): JSX.Element
