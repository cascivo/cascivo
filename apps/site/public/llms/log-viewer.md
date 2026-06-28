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

| Prop             | Type                                | Required            | Default   | Description |
| ---------------- | ----------------------------------- | ------------------- | --------- | ----------- | --- |
| `lines`          | `ReadonlySignal<readonly LogLine[]> | readonly LogLine[]` | yes       | —           | —   |
| `rowHeight`      | `number`                            | no                  | `20`      | —           |
| `overscan`       | `number`                            | no                  | `8`       | —           |
| `follow`         | `boolean`                           | no                  | —         | —           |
| `onFollowChange` | `(follow: boolean) => void`         | no                  | —         | —           |
| `ansi`           | `boolean`                           | no                  | `false`   | —           |
| `search`         | `string`                            | no                  | —         | —           |
| `maxHeight`      | `string`                            | no                  | `'24rem'` | —           |
| `labels`         | `LogViewerLabels`                   | no                  | —         | —           |

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

## Design tokens

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
