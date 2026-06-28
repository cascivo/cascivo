// Preact-friendly shim for @cascivo/editor in the docs app (avoids pulling the
// React-typed source into the Preact JSX namespace). The Vite alias resolves the
// real source at build time; this only types the showcase usage.
export type EditorTheme = Partial<Record<`--cascivo-editor-${string}`, string>>

export interface CodeEditorHandle {
  applyEdit(range: { from: number; to: number }, text: string): void
  getSelection(): { start: number; end: number }
  focus(): void
  undo(): void
  redo(): void
  openFind(): void
  openCommandMenu(): void
}

export interface SlashCommand {
  id: string
  label: string
  hint?: string
  keywords?: readonly string[]
  insert?: string
  run?: (editor: CodeEditorHandle) => void
}

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
  onSave?: (value: string) => void
  theme?: EditorTheme
  bracketMatching?: boolean
  commands?: readonly SlashCommand[]
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
