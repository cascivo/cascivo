/** An active slash trigger: the `/` index and the query typed after it. */
export interface Trigger {
  /** Offset of the `/` that opened the menu. */
  start: number
  /** Text between the `/` and the caret (no whitespace). */
  query: string
}

/**
 * Decide whether a slash-command menu should be open for the caret position.
 * Active iff a `/` sits at a word boundary (document start, or after whitespace /
 * a newline) and the run from that `/` to the caret contains no whitespace. Scans
 * backward from the caret, stopping at the first whitespace or `/` — O(query
 * length), not O(document). Returns `null` to close the menu.
 */
export function detectTrigger(text: string, caret: number): Trigger | null {
  for (let i = caret - 1; i >= 0; i--) {
    const ch = text[i]
    if (ch === '/') {
      const before = text[i - 1]
      if (before === undefined || /\s/.test(before)) {
        return { start: i, query: text.slice(i + 1, caret) }
      }
      return null // a `/` not at a word boundary (e.g. http://, a path)
    }
    if (ch === undefined || /\s/.test(ch)) return null // whitespace before any `/`
  }
  return null
}

/**
 * Filter a command list by a query — a case-insensitive substring match on the
 * label or any keyword. An empty query keeps everything. Input order is preserved
 * (no fuzzy ranking).
 */
export function filterCommands<T extends { label: string; keywords?: readonly string[] }>(
  commands: readonly T[],
  query: string,
): T[] {
  if (query === '') return [...commands]
  const q = query.toLowerCase()
  return commands.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      (c.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false),
  )
}
