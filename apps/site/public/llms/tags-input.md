# TagsInput

Free-form multi-value chip input

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add tags-input
```

Or use it from the prebuilt package without copying:

```tsx
import { TagsInput } from '@cascivo/react'
```

## Category

`inputs`

## States

- `idle`
- `focused`
- `disabled`

## Props

| Prop            | Type                       | Required | Default | Description                                                        |
| --------------- | -------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `value`         | `string[]`                 | yes      | —       | The controlled value.                                              |
| `onValueChange` | `(v: string[]) => void`    | yes      | —       | Called with the new value when it changes.                         |
| `placeholder`   | `string`                   | no       | —       | Placeholder text shown when the field is empty.                    |
| `validate`      | `(tag: string) => boolean` | no       | —       | Returns whether a candidate tag is allowed.                        |
| `max`           | `number`                   | no       | —       | Maximum allowed value.                                             |
| `disabled`      | `boolean`                  | no       | `false` | When true, disables the control and removes it from the tab order. |

## Examples

### Basic

```tsx
<TagsInput value={['react', 'vue']} onValueChange={() => {}} placeholder="Add tag…" />
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-input`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `textbox`
- **Keyboard:** Enter, ,, Backspace

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

form, tags, chips, multi, input

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
