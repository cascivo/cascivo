// Preact-friendly shim for @cascivo/editor in the docs app (avoids pulling the
// React-typed source into the Preact JSX namespace). The Vite alias resolves the
// real source at build time; this only types the showcase usage.
export declare function CodeEditor(props: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  language?: string
  lineNumbers?: boolean
  tabSize?: number
  insertSpaces?: boolean
  wrap?: boolean
  virtualize?: boolean
  readOnly?: boolean
  disabled?: boolean
  placeholder?: string
  label?: string
  [key: string]: unknown
}): JSX.Element

export declare function Highlight(props: {
  value: string
  language?: string
  lineNumbers?: boolean
  wrap?: boolean
  tabSize?: number
  label?: string
  [key: string]: unknown
}): JSX.Element
