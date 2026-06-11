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

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `options` | `SegmentedControlOption[]` | yes | — | — |
| `value` | `string` | yes | — | — |
| `onValueChange` | `(v: string) => void` | yes | — | — |
| `size` | `'sm' | 'md' | 'lg'` | no | `md` | — |
| `disabled` | `boolean` | no | `false` | — |

## Examples

### Basic

```tsx
<SegmentedControl options={[{label:'Day',value:'day'},{label:'Week',value:'week'},{label:'Month',value:'month'}]} value="day" onValueChange={() => {}} />
```

## Design tokens

- `--cascade-color-bg-subtle`
- `--cascade-color-border`
- `--cascade-color-surface`
- `--cascade-color-text`
- `--cascade-radius-md`
- `--cascade-radius-sm`
- `--cascade-shadow-sm`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `group`
- **Keyboard:** ArrowLeft, ArrowRight

## Dependencies

- `@cascade-ui/core`

## Tags

form, toggle, group, segmented, input
