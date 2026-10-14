# Terminal

An animated terminal that types out a script of commands and output — for demos, onboarding and agent transcripts

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add terminal
```

Or use it from the prebuilt package without copying:

```tsx
import { Terminal } from '@cascivo/react'
```

## Category

`display`

## Props

| Prop         | Type                 | Required | Default | Description                                                                                                                                 |
| ------------ | -------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `lines`      | `TerminalLine[]`     | yes      | —       | The script. Each line has `text`, an optional `prefix` (e.g. `$`) and a `type` (`command \| output \| error \| comment`, default `output`). |
| `speed`      | `number`             | no       | `3`     | Characters typed per animation frame.                                                                                                       |
| `loop`       | `boolean`            | no       | `false` | Restart from the first line after the last one.                                                                                             |
| `onComplete` | `() => void`         | no       | —       | Called each time the last line finishes typing.                                                                                             |
| `labels`     | `{ label?: string }` | no       | —       | Overrides for the component’s user-visible strings (i18n) — `label` names the terminal for screen readers.                                  |

## Object types

### `TerminalLine`

One line of the script.

| Field    | Type                                            | Required | Description                                             |
| -------- | ----------------------------------------------- | -------- | ------------------------------------------------------- |
| `text`   | `string`                                        | yes      | What the line says.                                     |
| `prefix` | `string`                                        | no       | A prompt marker such as `$`, styled and not selectable. |
| `type`   | `'command' \| 'output' \| 'error' \| 'comment'` | no       | Colours the line. Defaults to `output`.                 |

## Examples

### Install transcript

```tsx
<Terminal
  lines={[
    { text: 'npx cascivo add button', prefix: '$', type: 'command' },
    { text: 'Added button to src/components.', type: 'output' },
    { text: '# done in 1.2s', type: 'comment' },
  ]}
/>
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-terminal-bg`
- `--cascivo-terminal-fg`
- `--cascivo-editor-bg`
- `--cascivo-editor-fg`
- `--cascivo-editor-border`
- `--cascivo-editor-syntax-keyword`
- `--cascivo-editor-syntax-string`
- `--cascivo-editor-syntax-comment`
- `--cascivo-color-destructive`
- `--cascivo-font-mono`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

ai, terminal, cli, demo, typewriter, agent, transcript

---

_Generated from registry v1.9.0 on 2026-10-09. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
