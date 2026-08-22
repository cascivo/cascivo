# ColorPicker

Interactive color selection widget with saturation/lightness area, hue and alpha sliders

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add color-picker
```

Or use it from the prebuilt package without copying:

```tsx
import { ColorPicker } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `labels` | `ColorPickerLabels` | no | — | Overrides for the component’s user-visible strings (i18n). |
| `value` | `string` | no | — | Controlled hex color value |
| `defaultValue` | `string` | no | `#3b82f6` | The initial value when uncontrolled. |
| `onValueChange` | `(value: string) => void` | no | — | Called with the new value when it changes. |
| `presets` | `string[]` | no | — | Preset swatch colors |
| `alpha` | `boolean` | no | `true` | When true, enables alpha (opacity) selection. |
| `label` | `string` | no | — | Text label for the control. Rendered on screen. |
| `disabled` | `boolean` | no | `false` | When true, disables the control and removes it from the tab order. |
| `size` | `'sm' \| 'md' \| 'lg'` | no | `md` | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `aria-labelledby` | `string` | no | — | Wired automatically by a wrapping `Field` — its label id, forwarded to the focusable control so the Field's label names it. |
| `aria-describedby` | `string` | no | — | Wired automatically by a wrapping `Field` — the ids of its hint/error text, forwarded to the focusable control so the supporting text is announced. |
| `aria-invalid` | `boolean` | no | — | Wired automatically by a wrapping `Field` when it is in an error state. |
| `id` | `string` | no | — | Id for the **focusable control** (not the wrapper), so a `<label for>` names what actually takes focus. `Field` supplies this automatically. |

## Examples

### Basic

```tsx
<ColorPicker defaultValue="#3b82f6" onValueChange={setColor} />
```

### With presets

```tsx
<ColorPicker presets={["#ef4444", "#3b82f6", "#10b981"]} alpha={false} />
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-md`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `slider`
- **Keyboard:** ArrowLeft, ArrowRight, ArrowUp, ArrowDown

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

color, input, form, picker, hue, alpha

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
