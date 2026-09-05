/**
 * Substring search over rows that stays cheap while the user types.
 *
 * The naive filter — `String(cell).toLowerCase().includes(q)` per column per row on every
 * keystroke — is what a million-row table paid: ~500–850 ms of main-thread time per key
 * (measured), so the search box lagged a word behind the user. Two things fix it:
 *
 * 1. **One haystack per row.** `haystackOf` is expected to be cached by the caller (the
 *    table keys a `Map` on the row entry), so a key costs one `includes` per row, not one
 *    `String`/`toLowerCase` per cell.
 * 2. **Incremental narrowing.** A query that extends the previous one (`per` → `pers`) can
 *    only match a subset of the previous result, so it is filtered from that result rather
 *    than from every row. Typing gets cheaper with every character; only a shorter or
 *    different query — or a different base `rows` array — starts over.
 *
 * Order is preserved, which is what lets the table sort **once** and filter the sorted rows
 * per keystroke instead of re-sorting the filtered rows.
 */
export interface RowSearch<T> {
  /** The rows of `rows` whose haystack contains `query` (lower-cased, trimmed by the caller), in order. */
  filter(rows: readonly T[], query: string): readonly T[]
  /**
   * Build the haystacks of `rows[from, from + count)` ahead of any query, so the first
   * keystroke does not pay for the whole index (~1.5 s at a million rows). Returns the next
   * index to prime; the caller spreads calls over idle time.
   */
  prime(rows: readonly T[], from: number, count: number): number
}

/** Build a {@link RowSearch}; `haystackOf` yields the lower-cased searchable text of one row. */
export function createRowSearch<T>(haystackOf: (row: T) => string): RowSearch<T> {
  let lastRows: readonly T[] | undefined
  let lastQuery = ''
  let lastResult: readonly T[] = []

  return {
    filter(rows, query) {
      if (query === '') {
        lastRows = rows
        lastQuery = ''
        lastResult = rows
        return rows
      }
      const sameBase = rows === lastRows
      if (sameBase && query === lastQuery) return lastResult
      const narrowing = sameBase && lastQuery !== '' && query.startsWith(lastQuery)
      const candidates = narrowing ? lastResult : rows
      const out: T[] = []
      for (const row of candidates) if (haystackOf(row).includes(query)) out.push(row)
      lastRows = rows
      lastQuery = query
      lastResult = out
      return out
    },
    prime(rows, from, count) {
      const to = Math.min(rows.length, from + count)
      for (let i = from; i < to; i++) haystackOf(rows[i] as T)
      return to
    },
  }
}
