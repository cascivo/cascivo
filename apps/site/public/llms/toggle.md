# Toggle

On/off switch built as an accessible button

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add toggle
```

Or use it from the prebuilt package without copying:

```tsx
import { Toggle } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`

## States

- `off`
- `on`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `checked` | `boolean` | no | — | Whether the control is checked (controlled). |
| `defaultChecked` | `boolean` | no | `false` | Whether the control is checked on first render (uncontrolled). |
| `onValueChange` | `(checked: boolean) => void` | no | — | Called with the new checked state when the switch is toggled. |
| `onChange` | `(checked: boolean) => void` | no | — | Deprecated: use onValueChange (same checked boolean). |
| `label` | `string` | no | — | Visible text label beside the switch; it also becomes the accessible name. When a heading already labels the control, omit this and pass aria-label instead to avoid duplicated text. Rendered on screen. |
| `size` | `'sm' \| 'md'` | no | `md` | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `disabled` | `boolean` | no | `false` | When true, disables the control and removes it from the tab order. |

## Examples

### Uncontrolled

```tsx
<Toggle label="Notifications" defaultChecked />
```

### Controlled

```tsx
<Toggle checked={enabled} onValueChange={setEnabled} label="Dark mode" />
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-surface`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `switch`
- **Keyboard:** Space, Enter

## Dependencies

- `@cascivo/core`

## Tags

switch, form, boolean

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
