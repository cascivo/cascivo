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

| Prop            | Type                      | Required | Default   | Description                |
| --------------- | ------------------------- | -------- | --------- | -------------------------- | ---- | --- |
| `value`         | `string`                  | no       | —         | Controlled hex color value |
| `defaultValue`  | `string`                  | no       | `#3b82f6` | —                          |
| `onValueChange` | `(value: string) => void` | no       | —         | —                          |
| `presets`       | `string[]`                | no       | —         | Preset swatch colors       |
| `alpha`         | `boolean`                 | no       | `true`    | —                          |
| `label`         | `string`                  | no       | —         | —                          |
| `disabled`      | `boolean`                 | no       | `false`   | —                          |
| `size`          | `'sm'                     | 'md'     | 'lg'`     | no                         | `md` | —   |

## Examples

### Basic

```tsx
<ColorPicker defaultValue="#3b82f6" onValueChange={setColor} />
```

### With presets

```tsx
<ColorPicker presets={['#ef4444', '#3b82f6', '#10b981']} alpha={false} />
```

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
