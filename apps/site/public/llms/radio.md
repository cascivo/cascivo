# Radio

Single choice from a set, grouped with RadioGroup

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add radio
```

Or use it from the prebuilt package without copying:

```tsx
import { Radio } from '@cascivo/react'
```

## Category

`inputs`

## States

- `unchecked`
- `checked`

## Props

| Prop       | Type      | Required | Default | Description                                                        |
| ---------- | --------- | -------- | ------- | ------------------------------------------------------------------ |
| `label`    | `string`  | no       | —       | Text label for the control.                                        |
| `value`    | `string`  | yes      | —       | The controlled value.                                              |
| `disabled` | `boolean` | no       | `false` | When true, disables the control and removes it from the tab order. |
| `name`     | `string`  | no       | —       | Form field name shared by the radio group.                         |

## Examples

### Group

```tsx
<RadioGroup name="plan" defaultValue="pro">
  <Radio value="pro" label="Pro" />
  <Radio value="team" label="Team" />
</RadioGroup>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-text-on-accent`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `radio`
- **Keyboard:** ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space

## Dependencies

- `@cascivo/core`

## Tags

form, choice, group

---

_Generated from registry v0.10.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
