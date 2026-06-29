# ToggleGroup

A set of toggle buttons for single or multiple selection

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add toggle-group
```

Or use it from the prebuilt package without copying:

```tsx
import { ToggleGroup } from '@cascivo/react'
```

## Category

`inputs`

## Variants

- `single`
- `multiple`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `on`
- `off`

## Props

| Prop            | Type                                                                              | Required           | Default | Description                                                        |
| --------------- | --------------------------------------------------------------------------------- | ------------------ | ------- | ------------------------------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------- |
| `type`          | `'single'                                                                         | 'multiple'`        | yes     | —                                                                  | Whether one or multiple items can be pressed at once ('single' | 'multiple').                                          |
| `value`         | `string                                                                           | string[]`          | no      | —                                                                  | The controlled value.                                          |
| `defaultValue`  | `string                                                                           | string[]`          | no      | —                                                                  | The initial value when uncontrolled.                           |
| `onValueChange` | `(value: string                                                                   | string[]) => void` | no      | —                                                                  | Called with the new value when it changes.                     |
| `items`         | `{ value: string; label?: string; icon?: React.ReactNode; disabled?: boolean }[]` | yes                | —       | The items to render.                                               |
| `orientation`   | `'horizontal'                                                                     | 'vertical'`        | no      | `horizontal`                                                       | Layout orientation of the component.                           |
| `size`          | `'sm'                                                                             | 'md'               | 'lg'`   | no                                                                 | `md`                                                           | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `disabled`      | `boolean`                                                                         | no                 | `false` | When true, disables the control and removes it from the tab order. |

## Examples

### Single selection

```tsx
<ToggleGroup
  type="single"
  defaultValue="left"
  items={[
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
  ]}
/>
```

### Multiple selection

```tsx
<ToggleGroup
  type="multiple"
  defaultValue={['bold']}
  items={[
    { value: 'bold', label: 'Bold' },
    { value: 'italic', label: 'Italic' },
  ]}
/>
```

## Design tokens

- `--cascivo-control-height-sm`
- `--cascivo-control-height-md`
- `--cascivo-control-height-lg`
- `--cascivo-radius-control`
- `--cascivo-radius-item`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-surface`
- `--cascivo-color-text`
- `--cascivo-shadow-sm`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `radiogroup`
- **Keyboard:** ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Home, End, Enter, Space

## Dependencies

- `@cascivo/core`

## Tags

selection, segmented, toolbar, choice
