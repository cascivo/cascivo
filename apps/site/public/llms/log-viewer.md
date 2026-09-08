# LogViewer

Virtualized monospace console for high-frequency log and stream output

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add log-viewer
```

Or use it from the prebuilt package without copying:

```tsx
import { LogViewer } from '@cascivo/react'
```

## Category

`display`

## States

- `following`
- `paused`
- `empty`

## Props

| Prop             | Type                                                       | Required | Default    | Description                                                                                                       |
| ---------------- | ---------------------------------------------------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `lines`          | `ReadonlySignal<readonly LogLine[]> \| readonly LogLine[]` | yes      | —          | The log lines to display (a signal or array).                                                                     |
| `rowHeight`      | `number`                                                   | no       | `20`       | Height of each row in pixels, used for virtualization.                                                            |
| `overscan`       | `number`                                                   | no       | `8`        | Number of extra rows rendered above and below the viewport.                                                       |
| `follow`         | `boolean`                                                  | no       | —          | Whether the view auto-scrolls to follow new lines (controlled).                                                   |
| `onFollowChange` | `(follow: boolean) => void`                                | no       | —          | Called with the new follow state when it changes.                                                                 |
| `ansi`           | `boolean`                                                  | no       | `false`    | When true, parses ANSI color escape codes into colored spans.                                                     |
| `search`         | `string`                                                   | no       | —          | Query used to filter and highlight matching lines.                                                                |
| `maxHeight`      | `string`                                                   | no       | `'24rem'`  | Maximum height of the scroll viewport (CSS length).                                                               |
| `timestampWidth` | `string`                                                   | no       | `'6.5rem'` | Width of the `LogLine.timestamp` gutter (CSS length). Widen it for an ISO stamp, narrow it for a relative offset. |
| `labels`         | `LogViewerLabels`                                          | no       | —          | Overrides for the component’s user-visible strings (i18n).                                                        |

## Examples

### Streaming build log

Backed by createStreamBuffer; auto-follows the tail

```tsx
const logs = useStreamBuffer<LogLine>({ capacity: 1000 })
// socket.onmessage = (e) => logs.append({ id: seq++, text: e.data })
<LogViewer lines={logs.signal} />
```

### Static log with levels

```tsx
<LogViewer
  lines={[
    { id: 1, text: 'Build started', level: 'info' },
    { id: 2, text: 'Type error', level: 'error' },
  ]}
/>
```

### ANSI colored output

```tsx
<LogViewer ansi lines={ansiLines} maxHeight="32rem" />
```

### Timestamped build log

Pass the clock as `timestamp`, not prefixed into `text` — the gutter is dimmed, column-aligned, and excluded from search and copy

```tsx
<LogViewer
  lines={[
    { id: 1, timestamp: '08:59:12', text: 'Build started' },
    { id: 2, timestamp: '08:59:41', text: 'Type error', level: 'error' },
  ]}
/>
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-accent-text`
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

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `log`
- **Keyboard:** Tab, ArrowUp, ArrowDown, PageUp, PageDown

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

log, stream, virtual, console, terminal, monospace

---

_Generated from registry v1.2.0 on 2026-09-08. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
