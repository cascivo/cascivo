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

| Prop            | Type                       | Required | Default | Description                                                                                                                                                                                                      |
| --------------- | -------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`         | `string[]`                 | yes      | —       | The controlled value.                                                                                                                                                                                            |
| `onValueChange` | `(v: string[]) => void`    | yes      | —       | Called with the new value when it changes.                                                                                                                                                                       |
| `placeholder`   | `string`                   | no       | —       | Placeholder text shown when the field is empty.                                                                                                                                                                  |
| `validate`      | `(tag: string) => boolean` | no       | —       | Returns whether a candidate tag is allowed.                                                                                                                                                                      |
| `max`           | `number`                   | no       | —       | Maximum allowed value.                                                                                                                                                                                           |
| `disabled`      | `boolean`                  | no       | `false` | When true, disables the control and removes it from the tab order.                                                                                                                                               |
| `id`            | `string`                   | no       | —       | Id for the **inner text input** — the focusable control, so a `<label for>` names the thing that actually takes focus. `Field` supplies this automatically.                                                      |
| `ariaLabel`     | `string`                   | no       | —       | Invisible accessible name for the tag entry field. Use when no visible label names it; inside a `Field` it is not needed, as the Field label is wired through automatically. Not rendered — screen readers only. |
| `label`         | `string`                   | no       | —       | Alias of `ariaLabel` — the same invisible accessible name under the other spelling. Not rendered. Not rendered — screen readers only.                                                                            |

## Examples

### Basic

```tsx
<TagsInput value={['react', 'vue']} onValueChange={() => {}} placeholder="Add tag…" />
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

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

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
