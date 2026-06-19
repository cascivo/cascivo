# Comparison

Reveals the difference between two layers with a draggable divider

## Install

```bash
npx cascivo add comparison
```

## Category

`display`

## States

- `default`

## Props

| Prop               | Type                         | Required    | Default | Description                          |
| ------------------ | ---------------------------- | ----------- | ------- | ------------------------------------ | --- |
| `after`            | `ReactNode`                  | yes         | —       | Base layer shown underneath          |
| `before`           | `ReactNode`                  | yes         | —       | Top layer revealed up to the divider |
| `position`         | `number`                     | no          | —       | Divider position 0–100 (controlled)  |
| `defaultPosition`  | `number`                     | no          | `50`    | —                                    |
| `onPositionChange` | `(position: number) => void` | no          | —       | —                                    |
| `orientation`      | `'horizontal'                | 'vertical'` | no      | `horizontal`                         | —   |
| `keyboardStep`     | `number`                     | no          | `5`     | —                                    |
| `label`            | `string`                     | no          | —       | —                                    |

## Examples

### Image before/after

```tsx
<Comparison
  before={<img src="/edited.jpg" alt="" />}
  after={<img src="/original.jpg" alt="Original" />}
  label="Reveal edited image"
/>
```

### Vertical

```tsx
<Comparison orientation="vertical" before={<Before />} after={<After />} />
```

### Controlled

```tsx
<Comparison
  position={position}
  onPositionChange={setPosition}
  before={<Before />}
  after={<After />}
/>
```

## Design tokens

- `--cascivo-radius-md`
- `--cascivo-radius-full`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-focus-ring`
- `--cascivo-shadow-sm`
- `--cascivo-target-min-coarse`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `slider`
- **Keyboard:** ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, End, PageUp, PageDown

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

comparison, before-after, image, slider, display
