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

| Prop             | Type                         | Required | Default | Description                                                                                                                                                                           |
| ---------------- | ---------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checked`        | `boolean`                    | no       | —       | Whether the control is checked (controlled).                                                                                                                                          |
| `defaultChecked` | `boolean`                    | no       | `false` | Whether the control is checked on first render (uncontrolled).                                                                                                                        |
| `onChange`       | `(checked: boolean) => void` | no       | —       | Called when the value changes.                                                                                                                                                        |
| `label`          | `string`                     | no       | —       | Visible text label beside the switch; it also becomes the accessible name. When a heading already labels the control, omit this and pass aria-label instead to avoid duplicated text. |
| `size`           | `'sm' \| 'md'`               | no       | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg').                                                                                                                                 |
| `disabled`       | `boolean`                    | no       | `false` | When true, disables the control and removes it from the tab order.                                                                                                                    |

## Examples

### Uncontrolled

```tsx
<Toggle label="Notifications" defaultChecked />
```

### Controlled

```tsx
<Toggle checked={enabled} onChange={setEnabled} label="Dark mode" />
```

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
