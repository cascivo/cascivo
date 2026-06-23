import type { KeyboardEvent } from 'react'

/**
 * The cross-platform "primary" modifier: `Cmd` on macOS, `Ctrl` elsewhere. Chord
 * strings use `Mod` for it so a single keymap works on both. Detection is
 * SSR-safe (defaults to non-mac when `navigator` is absent).
 */
const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '')

/** What a {@link Command} receives: the live textarea, the originating event, and the commit fn. */
export interface CommandContext {
  textarea: HTMLTextAreaElement
  event: KeyboardEvent<HTMLTextAreaElement>
  /** Commit a new document value through the editor's controllable signal + history. */
  setText: (value: string) => void
}

/** A keymap command. Returns `true` when it handled the event (the caller then prevents default). */
export type Command = (ctx: CommandContext) => boolean

/** A public keymap: chord string → command. Merged over the built-ins (user wins). */
export type KeyMap = Record<string, Command>

/**
 * Normalize a keyboard event to a canonical chord string, e.g. `'Mod-z'`,
 * `'Mod-Shift-z'`, `'Mod-Alt-f'`, `'Shift-Tab'`, `'Escape'`. Single-character keys
 * are lowercased so Shift is expressed only via the `Shift-` segment. Pure and
 * deterministic — unit-testable without a DOM.
 */
export function chordOf(event: {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
}): string {
  const parts: string[] = []
  if (isMac ? event.metaKey : event.ctrlKey) parts.push('Mod')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  let key = event.key
  if (key.length === 1) key = key.toLowerCase()
  parts.push(key)
  return parts.join('-')
}

/** Merge a user keymap over the built-ins; user entries override on the same chord. */
export function mergeKeymap(builtins: KeyMap, user?: KeyMap): Map<string, Command> {
  const map = new Map<string, Command>(Object.entries(builtins))
  if (user) for (const [chord, command] of Object.entries(user)) map.set(chord, command)
  return map
}

/** Look up and run the command for an event's chord. Returns whether it was handled. */
export function dispatch(map: Map<string, Command>, ctx: CommandContext): boolean {
  const command = map.get(chordOf(ctx.event))
  if (!command) return false
  return command(ctx)
}

/**
 * Build the built-in `Tab`/`Shift-Tab` indent commands, parameterized by tab
 * settings. Extracted verbatim from the original inline handler so the move to a
 * keymap is behavior-preserving: Tab inserts indent (or indents a selection),
 * Shift-Tab dedents the touched lines.
 */
export function createIndentCommands(opts: { tabSize: number; insertSpaces: boolean }): {
  indent: Command
  dedent: Command
} {
  const indentText = (): string => (opts.insertSpaces ? ' '.repeat(opts.tabSize) : '\t')

  const indent: Command = ({ textarea, setText }) => {
    const { selectionStart, selectionEnd, value: current } = textarea
    const lineStart = current.lastIndexOf('\n', selectionStart - 1) + 1
    if (selectionStart === selectionEnd) {
      textarea.setRangeText(indentText(), selectionStart, selectionEnd, 'end')
    } else {
      const block = current.slice(lineStart, selectionEnd)
      const indented = block.replace(/^/gm, indentText())
      textarea.setRangeText(indented, lineStart, selectionEnd, 'select')
    }
    setText(textarea.value)
    return true
  }

  const dedent: Command = ({ textarea, setText }) => {
    const { selectionStart, selectionEnd, value: current } = textarea
    const lineStart = current.lastIndexOf('\n', selectionStart - 1) + 1
    const block = current.slice(lineStart, selectionEnd)
    const dedented = block.replace(new RegExp(`^(?:\\t| {1,${opts.tabSize}})`, 'gm'), '')
    textarea.setRangeText(dedented, lineStart, selectionEnd, 'select')
    setText(textarea.value)
    return true
  }

  return { indent, dedent }
}
