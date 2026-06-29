# LogViewer

**Category:** display  
**Description:** Virtualized monospace console for high-frequency log and stream output

## When to use

- Rendering continuous, high-volume log or stream output (build/deploy logs, server output)
- Showing thousands of lines without mounting a DOM node per line
- Auto-following live output while letting the user scroll back to inspect history

## When NOT to use

- A short, static block of code or output — use a <pre> or Code block
- Tabular data with columns — use DataTable
- A rich interactive terminal with cursor addressing — out of scope (line-oriented only)

## Anti-patterns

### The slice pattern reallocates the whole array per line (O(n)) and renders per line; the stream buffer is O(1) and renders once per frame

**Bad:** `logsSignal.value = [...logsSignal.value.slice(1), line]`  
**Good:** `const logs = useStreamBuffer({ capacity: 1000 }); logs.append(line)`  
**Why:** The slice pattern reallocates the whole array per line (O(n)) and renders per line; the stream buffer is O(1) and renders once per frame

## Related components

- **createStreamBuffer** (pairs-with): Provides the bounded, O(1) signal LogViewer renders
- **DataTable** (alternative): DataTable virtualizes tabular rows; LogViewer virtualizes monospace lines

## Accessibility rationale

The scroll region is role="log" with aria-live="polite" so assistive tech announces new output without stealing focus; the container is keyboard-scrollable and a visually-hidden live status reports the line count; color is paired with level semantics, never the sole encoding

## Props

| Name             | Type                                | Required            | Default | Description                                                     |
| ---------------- | ----------------------------------- | ------------------- | ------- | --------------------------------------------------------------- | --------------------------------------------- |
| `lines`          | `ReadonlySignal<readonly LogLine[]> | readonly LogLine[]` | Yes     | —                                                               | The log lines to display (a signal or array). |
| `rowHeight`      | `number`                            | No                  | 20      | Height of each row in pixels, used for virtualization.          |
| `overscan`       | `number`                            | No                  | 8       | Number of extra rows rendered above and below the viewport.     |
| `follow`         | `boolean`                           | No                  | —       | Whether the view auto-scrolls to follow new lines (controlled). |
| `onFollowChange` | `(follow: boolean) => void`         | No                  | —       | Called with the new follow state when it changes.               |
| `ansi`           | `boolean`                           | No                  | false   | When true, parses ANSI color escape codes into colored spans.   |
| `search`         | `string`                            | No                  | —       | Query used to filter and highlight matching lines.              |
| `maxHeight`      | `string`                            | No                  | '24rem' | Maximum height of the scroll viewport (CSS length).             |
| `labels`         | `LogViewerLabels`                   | No                  | —       | Overrides for the component’s user-visible strings (i18n).      |

## Tokens

- `--cascivo-font-mono`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-surface`
- `--cascivo-color-surface-raised`
- `--cascivo-color-border`
- `--cascivo-color-error`
- `--cascivo-color-warning`
- `--cascivo-color-success`
- `--cascivo-color-info`
- `--cascivo-color-accent`
- `--cascivo-target-min-coarse`

## Examples

### Streaming build log

Backed by createStreamBuffer; auto-follows the tail

```jsx
const logs = useStreamBuffer<LogLine>({ capacity: 1000 })
// socket.onmessage = (e) => logs.append({ id: seq++, text: e.data })
<LogViewer lines={logs.signal} />
```

### Static log with levels

```jsx
<LogViewer
  lines={[
    { id: 1, text: 'Build started', level: 'info' },
    { id: 2, text: 'Type error', level: 'error' },
  ]}
/>
```

### ANSI colored output

```jsx
<LogViewer ansi lines={ansiLines} maxHeight="32rem" />
```

## Boundaries

| Area        | Level    | Note                                                                               |
| ----------- | -------- | ---------------------------------------------------------------------------------- |
| data source | flexible | Accepts a live signal or a plain array                                             |
| rowHeight   | strict   | Virtualization assumes a fixed row height; variable-height lines are not supported |
| coloring    | flexible | Per-line level or ANSI SGR-16 escapes                                              |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo LogViewer component (display). Virtualized monospace console for high-frequency log and stream output

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

LogViewer is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-font-mono, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-surface, --cascivo-color-surface-raised, --cascivo-color-border, --cascivo-color-error, --cascivo-color-warning, --cascivo-color-success, --cascivo-color-info, --cascivo-color-accent, --cascivo-target-min-coarse

Accessibility: role "log", WCAG 2.2-AA, keyboard: Tab/ArrowUp/ArrowDown/PageUp/PageDown. Keep it AA.

Do not change (strict): rowHeight — Virtualization assumes a fixed row height; variable-height lines are not supported
Flexible: data source, coloring.

Do not invent props, tokens, or global viewport media queries.
```
