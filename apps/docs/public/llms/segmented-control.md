# SegmentedControl

Mutually exclusive toggle group

## Install

```bash
npx cascade add segmented-control
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `idle`
- `selected`
- `disabled`

## Props

| Prop            | Type                       | Required | Default | Description |
| --------------- | -------------------------- | -------- | ------- | ----------- | ---- | --- |
| `options`       | `SegmentedControlOption[]` | yes      | —       | —           |
| `value`         | `string`                   | yes      | —       | —           |
| `onValueChange` | `(v: string) => void`      | yes      | —       | —           |
| `size`          | `'sm'                      | 'md'     | 'lg'`   | no          | `md` | —   |
| `disabled`      | `boolean`                  | no       | `false` | —           |

## Examples

### Basic

```tsx
<SegmentedControl
  options={[
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ]}
  value="day"
  onValueChange={() => {}}
/>
```

## Design tokens

- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-color-text`
- `--cascivo-radius-md`
- `--cascivo-radius-sm`
- `--cascivo-shadow-sm`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`
- **Keyboard:** ArrowLeft, ArrowRight

## Dependencies

- `@cascade-ui/core`

## Tags

form, toggle, group, segmented, input
