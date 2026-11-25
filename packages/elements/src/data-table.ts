import { signal } from '@preact/signals-core'
import { CvElement, define as defineTag, set, targetOf } from './base.ts'

type Dir = 'ascending' | 'descending'
const NEXT = { none: 'ascending', ascending: 'descending', descending: 'none' } as const
const SHORT = { none: 'none', ascending: 'asc', descending: 'desc' } as const
const REMOTE = '[hx-get],[hx-post]'

const keyOf = (th: HTMLElement): string => th.dataset['key'] ?? th.textContent.trim()
const num = (s: string): number => (s.trim() === '' ? NaN : Number(s.replace(/[,\s%$]/g, '')))

/**
 * `<cv-data-table>`: enhances a server-rendered table (the markup `DataTable` renders).
 *
 * Sort: click, Enter or Space on the `<button>` inside a `th[aria-sort]` cycles
 * none, ascending, descending, none and fires `cv-sort` (`detail.key` = the th's `data-key`,
 * else its text; `detail.direction` = `asc` | `desc` | `none`) so htmx can refetch. Unless the
 * `remote` attribute or an `hx-get`/`hx-post` on the th, button or host says the server sorts,
 * the rows are also reordered in place (`data-sort-value` on a cell overrides its text).
 *
 * Select: the `thead` checkbox is select-all (tri-state through `indeterminate`), the `tbody`
 * checkboxes select rows (id: the checkbox `value`, else the row's `data-id`, else its `id`,
 * else its index). `[data-cv-count]` or `.cv-data-table-batchCount` shows the count
 * (`count-label`, default "{count} selected"). Fires `cv-selection-change` (`detail.selected`).
 *
 * Not included: row virtualisation (windowing thousands of rows, `aria-rowcount`/`rowindex`
 * bookkeeping, scroll anchoring) is the React `DataTable`'s job. In the server-first model
 * paginate or `hx-trigger="revealed"` more rows instead.
 */
export class CvDataTable extends CvElement {
  /** `undefined`: the server's `aria-sort` rules until the first interaction. */
  readonly sort = signal<{ key: string; dir: Dir } | null | undefined>(undefined)
  /** `undefined`: the server's `checked` boxes rule until the first interaction. */
  readonly picked = signal<Set<string> | undefined>(undefined)

  constructor() {
    super()
    this.addEventListener('click', (e) => {
      const th = targetOf(e).closest<HTMLElement>('th[aria-sort]')
      if (th && (targetOf(e).closest('button') || th === targetOf(e))) this.#cycle(th)
    })
    // A th with no button: make it keyboard operable.
    this.addEventListener('keydown', (e) => {
      const t = targetOf(e)
      if ((e.key === 'Enter' || e.key === ' ') && t.matches('th[aria-sort]')) {
        e.preventDefault()
        this.#cycle(t as HTMLElement)
      }
    })
    this.addEventListener('change', (e) => {
      const box = targetOf(e)
      if (!(box instanceof HTMLInputElement) || box.type !== 'checkbox') return
      const rows = this.#rows()
      const next = new Set(this.picked.peek() ?? this.#checked(rows))
      if (box.closest('thead'))
        for (const [id, cb] of rows) {
          if (!cb.disabled) next[box.checked ? 'add' : 'delete'](id)
        }
      else {
        const id = rows.find(([, cb]) => cb === box)?.[0]
        if (id === undefined) return
        next[box.checked ? 'add' : 'delete'](id)
      }
      this.picked.value = next
      this.emit('cv-selection-change', { selected: [...next] })
    })
  }

  #rows(): [string, HTMLInputElement][] {
    return this.$$<HTMLInputElement>('tbody input[type="checkbox"]').map((cb, i) => {
      const tr = cb.closest('tr')
      return [cb.getAttribute('value') ?? tr?.dataset['id'] ?? (tr?.id || String(i)), cb]
    })
  }

  #checked(rows: [string, HTMLInputElement][]): Set<string> {
    return new Set(rows.filter(([, cb]) => cb.hasAttribute('checked')).map(([id]) => id))
  }

  #cycle(th: HTMLElement): void {
    const cur = th.getAttribute('aria-sort') as keyof typeof NEXT
    const to = NEXT[cur] ?? 'ascending'
    const key = keyOf(th)
    this.sort.value = to === 'none' ? null : { key, dir: to }
    this.emit('cv-sort', { key, direction: SHORT[to] })
    if (this.hasAttribute('remote') || th.closest(REMOTE) || this.querySelector(REMOTE)) return
    this.#reorder((th as HTMLTableCellElement).cellIndex, to)
  }

  /** Client-side sort; `none` restores the order the server sent (stamped on first sort). */
  #reorder(col: number, dir: keyof typeof NEXT): void {
    for (const body of this.$$<HTMLTableSectionElement>('tbody')) {
      const rows = Array.from(body.rows)
      rows.forEach((r, i) => r.hasAttribute('data-cv-i') || r.setAttribute('data-cv-i', String(i)))
      const cell = (r: HTMLTableRowElement) => {
        const c = r.cells[col]
        return c?.dataset['sortValue'] ?? c?.textContent.trim() ?? ''
      }
      const sign = dir === 'descending' ? -1 : 1
      rows.sort((a, b) => {
        if (dir === 'none') return Number(a.dataset['cvI']) - Number(b.dataset['cvI'])
        const [x, y] = [cell(a), cell(b)]
        const [nx, ny] = [num(x), num(y)]
        const d =
          nx === nx && ny === ny ? nx - ny : x.localeCompare(y, undefined, { numeric: true })
        return d * sign
      })
      body.append(...rows)
    }
  }

  protected render(): void {
    const sort = this.sort.value
    if (sort !== undefined)
      for (const th of this.$$('th[aria-sort]')) {
        const dir = sort && sort.key === keyOf(th) ? sort.dir : 'none'
        set(th, 'aria-sort', dir)
        set(th.querySelector('button'), 'data-state', dir)
      }
    const rows = this.#rows()
    const on = this.picked.value ?? this.#checked(rows)
    for (const [id, cb] of rows) {
      const v = on.has(id)
      // Mirror to the attribute so a morph that resets it leaves a mutation to repair.
      set(cb, 'checked', v ? '' : null)
      if (cb.checked !== v) cb.checked = v
      set(cb.closest('tr'), 'data-state', v ? 'selected' : null)
    }
    const all = this.$<HTMLInputElement>('thead input[type="checkbox"]')
    if (all) {
      const n = rows.filter(([id]) => on.has(id)).length
      set(all, 'checked', n && n === rows.length ? '' : null)
      all.checked = n > 0 && n === rows.length
      all.indeterminate = n > 0 && n < rows.length
    }
    const count = this.$('[data-cv-count], .cv-data-table-batchCount')
    const text = (this.getAttribute('count-label') ?? '{count} selected').replace(
      '{count}',
      String(rows.filter(([id]) => on.has(id)).length),
    )
    if (count && count.textContent !== text) count.textContent = text
  }
}

export function define(): void {
  defineTag('cv-data-table', CvDataTable)
}
