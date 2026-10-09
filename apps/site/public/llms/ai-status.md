# AiStatus

Announces what an AI is doing — thinking, generating, done, failed or stopped — with a shimmering label and an optional Stop button

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add ai-status
```

Or use it from the prebuilt package without copying:

```tsx
import { AiStatus } from '@cascivo/react'
```

## Category

`feedback`

## States

- `thinking`
- `generating`
- `complete`
- `error`
- `stopped`

## Props

| Prop     | Type                                                                                                             | Required | Default | Description                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status` | `'thinking' \| 'generating' \| 'complete' \| 'error' \| 'stopped'`                                               | yes      | —       | The phase: `thinking` (working, nothing produced yet), `generating` (output is streaming), `complete`, `error`, or `stopped` (the reader pressed Stop). |
| `label`  | `ReactNode`                                                                                                      | no       | —       | Replaces the default text for the current status, e.g. "Searching 12 documents…". Rendered on screen.                                                   |
| `labels` | `{ thinking?: string; generating?: string; complete?: string; error?: string; stopped?: string; stop?: string }` | no       | —       | Overrides for the component’s user-visible strings (i18n).                                                                                              |
| `onStop` | `() => void`                                                                                                     | no       | —       | Called when the reader presses Stop. When set, a Stop button renders while the status is `thinking` or `generating`.                                    |

## Examples

### Thinking

```tsx
<AiStatus status="thinking" />
```

### Generating, with Stop

```tsx
<AiStatus status="generating" onStop={() => {}} />
```

### Custom label

```tsx
<AiStatus status="thinking" label="Searching 12 documents…" />
```

### Complete

```tsx
<AiStatus status="complete" />
```

### Error

```tsx
<AiStatus status="error" />
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-color-ai`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-success`
- `--cascivo-color-destructive`
- `--cascivo-duration-loop-slow`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `status`
- **Keyboard:** Tab, Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

ai, status, loading, thinking, generating, progress, stop

---

_Generated from registry v1.9.0 on 2026-10-09. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
