'use client'
import {
  cn,
  useClipboard,
  useComputed,
  useControllableSignal,
  useResizeObserver,
  useSignal,
  useSignalEffect,
  useSignals,
  VisuallyHidden,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes, ReactNode, UIEvent } from 'react'
import { Fragment } from 'react'
import styles from './log-viewer.module.css'

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogLine {
  /** Stable identity for the line (e.g. a sequence number). */
  id: string | number
  /** The line text. May contain ANSI SGR escapes when `ansi` is set. */
  text: string
  /** Semantic level driving the row color when `ansi` is off. */
  level?: LogLevel
}

export interface LogViewerLabels {
  searchPlaceholder?: string
  follow?: string
  paused?: string
  copy?: string
  copied?: string
  empty?: string
  matchCount?: (count: number) => string
  lineCount?: (count: number) => string
}

export interface LogViewerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The log lines — a signal (for live streams) or a plain array. */
  lines: { readonly value: readonly LogLine[] } | readonly LogLine[]
  /** Pixel height of one row. Default 20. */
  rowHeight?: number
  /** Extra rows rendered above/below the viewport. Default 8. */
  overscan?: number
  /** Controlled pin-to-bottom. Omit for uncontrolled (defaults to following). */
  follow?: boolean
  onFollowChange?: (follow: boolean) => void
  /** Parse ANSI SGR color escapes. Default false (use `level` instead). */
  ansi?: boolean
  /** Seed the search/highlight box. */
  search?: string
  /** Max block size of the scroll region (CSS length). Default '24rem'. */
  maxHeight?: string
  labels?: LogViewerLabels
}

const FG: Record<number, string> = {
  30: 'black',
  31: 'red',
  32: 'green',
  33: 'yellow',
  34: 'blue',
  35: 'magenta',
  36: 'cyan',
  37: 'white',
  90: 'bright-black',
  91: 'red',
  92: 'green',
  93: 'yellow',
  94: 'blue',
  95: 'magenta',
  96: 'cyan',
  97: 'white',
}

interface Segment {
  text: string
  color?: string | undefined
  bold?: boolean | undefined
}

// Minimal SGR-16 parser: foreground colors + bold + reset. Unknown codes are
// ignored; on any malformed input the whole line falls back to a plain segment.
function parseAnsi(text: string): Segment[] {
  if (!text.includes('[')) return [{ text }]
  try {
    const segments: Segment[] = []
    const re = /\[([0-9;]*)m/g
    let last = 0
    let color: string | undefined
    let bold = false
    let match: RegExpExecArray | null
    while ((match = re.exec(text)) !== null) {
      if (match.index > last) segments.push({ text: text.slice(last, match.index), color, bold })
      for (const raw of match[1]!.split(';')) {
        const code = Number(raw || '0')
        if (code === 0) {
          color = undefined
          bold = false
        } else if (code === 1) bold = true
        else if (code === 22) bold = false
        else if (FG[code]) color = FG[code]
      }
      last = re.lastIndex
    }
    if (last < text.length) segments.push({ text: text.slice(last), color, bold })
    return segments.length > 0 ? segments : [{ text }]
  } catch {
    return [{ text }]
  }
}

// Split a segment's text on the query, wrapping matches in <mark>.
function highlight(text: string, query: string, keyBase: string): ReactNode {
  if (!query) return text
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  const parts: ReactNode[] = []
  let from = 0
  let at = lower.indexOf(q, from)
  let k = 0
  while (at !== -1) {
    if (at > from) parts.push(text.slice(from, at))
    parts.push(<mark key={`${keyBase}-${k++}`}>{text.slice(at, at + q.length)}</mark>)
    from = at + q.length
    at = lower.indexOf(q, from)
  }
  if (from < text.length) parts.push(text.slice(from))
  return parts
}

function renderLine(line: LogLine, ansi: boolean, query: string): ReactNode {
  const segments = ansi ? parseAnsi(line.text) : [{ text: line.text }]
  return segments.map((seg, i) => (
    <span
      key={i}
      data-ansi={seg.color}
      style={seg.bold ? { fontWeight: 700 } : undefined}
      className={seg.color ? styles['ansi'] : undefined}
    >
      {highlight(seg.text, query, `${String(line.id)}-${i}`)}
    </span>
  ))
}

/**
 * A virtualized monospace console for high-frequency log/stream output. Only the
 * visible rows mount (windowed DOM), so a 100k-line buffer stays responsive.
 * Auto-follows the tail and releases when the user scrolls up. Pairs with
 * `createStreamBuffer` from `@cascivo/core`. No `useState`/`useEffect`.
 */
export function LogViewer({
  lines,
  rowHeight = 20,
  overscan = 8,
  follow,
  onFollowChange,
  ansi = false,
  search,
  maxHeight = '24rem',
  labels,
  className,
  ...props
}: LogViewerProps) {
  useSignals()

  const text = {
    searchPlaceholder: labels?.searchPlaceholder ?? t(builtin.logViewer.search),
    follow: labels?.follow ?? t(builtin.logViewer.follow),
    paused: labels?.paused ?? t(builtin.logViewer.paused),
    copy: labels?.copy ?? t(builtin.logViewer.copy),
    copied: labels?.copied ?? t(builtin.logViewer.copied),
    empty: labels?.empty ?? t(builtin.logViewer.empty),
    label: t(builtin.logViewer.label),
  }

  // Normalize `lines` (signal or array) to a single readable signal.
  const arraySig = useSignal<readonly LogLine[]>(Array.isArray(lines) ? lines : [])
  if (Array.isArray(lines)) arraySig.value = lines
  const linesSig = (Array.isArray(lines) ? arraySig : lines) as { value: readonly LogLine[] }

  const { ref: containerRef, size } = useResizeObserver<HTMLDivElement>()
  const scrollTop = useSignal(0)
  const [followSig, setFollow] = useControllableSignal<boolean>({
    value: follow,
    defaultValue: true,
    onChange: onFollowChange,
  })
  const querySig = useSignal(search ?? '')
  const { copied, copy } = useClipboard()

  // While following, pin the window to the tail immediately (don't wait for the
  // async scroll event), so newly appended lines render the same frame.
  const windowing = useComputed(() => {
    const all = linesSig.value
    const total = all.length
    const vpH = size.value?.height ?? 320
    const maxScroll = Math.max(0, total * rowHeight - vpH)
    const top = followSig.value ? maxScroll : scrollTop.value
    const first = Math.floor(top / rowHeight)
    const count = Math.ceil(vpH / rowHeight) + overscan * 2
    const start = Math.max(0, first - overscan)
    const end = Math.min(total, start + count)
    return { total, start, end, rows: all.slice(start, end) }
  })

  const matchCount = useComputed(() => {
    const q = querySig.value.trim().toLowerCase()
    if (!q) return 0
    let n = 0
    for (const line of linesSig.value) if (line.text.toLowerCase().includes(q)) n++
    return n
  })

  // Keep the tail pinned while following and lines arrive.
  useSignalEffect(() => {
    void linesSig.value // dependency: re-run on every append
    if (!followSig.value) return
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  })

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    scrollTop.value = el.scrollTop
    // Re-engage follow at the bottom; release it on scroll-up (> one row).
    const distance = el.scrollHeight - el.clientHeight - el.scrollTop
    setFollow(distance <= rowHeight)
  }

  const w = windowing.value
  const query = querySig.value.trim()

  return (
    <div className={cn(styles['root'], className)} {...props}>
      <div className={styles['toolbar']}>
        <input
          type="search"
          className={styles['search']}
          placeholder={text.searchPlaceholder}
          aria-label={text.searchPlaceholder}
          value={querySig.value}
          onInput={(e) => {
            querySig.value = e.currentTarget.value
          }}
        />
        {query ? (
          <span className={styles['count']} aria-live="polite">
            {t(builtin.logViewer.matches, { count: matchCount.value })}
          </span>
        ) : null}
        <span className={styles['spacer']} />
        <button
          type="button"
          className={styles['toggle']}
          aria-pressed={followSig.value}
          onClick={() => {
            const next = !followSig.value
            setFollow(next)
            if (next) {
              const el = containerRef.current
              if (el) el.scrollTop = el.scrollHeight
            }
          }}
        >
          {followSig.value ? text.follow : text.paused}
        </button>
        <button
          type="button"
          className={styles['copy']}
          onClick={() => void copy(linesSig.value.map((l) => l.text).join('\n'))}
        >
          {copied.value ? text.copied : text.copy}
        </button>
      </div>

      <div
        ref={containerRef}
        className={styles['scroll']}
        role="log"
        aria-live="polite"
        aria-label={text.label}
        tabIndex={0}
        style={{ maxBlockSize: maxHeight }}
        onScroll={onScroll}
      >
        {w.total === 0 ? (
          <div className={styles['empty']}>{text.empty}</div>
        ) : (
          <div className={styles['sizer']} style={{ blockSize: w.total * rowHeight }}>
            {w.rows.map((line, i) => (
              <Fragment key={line.id}>
                <div
                  className={styles['line']}
                  data-level={line.level}
                  style={{
                    insetBlockStart: (w.start + i) * rowHeight,
                    blockSize: rowHeight,
                  }}
                >
                  {renderLine(line, ansi, query)}
                </div>
              </Fragment>
            ))}
          </div>
        )}
      </div>

      <VisuallyHidden aria-live="polite">
        {t(builtin.logViewer.lines, { count: w.total })}
      </VisuallyHidden>
    </div>
  )
}
