# MultiSelect

Searchable multi-value select with popover listbox

## Install

```bash
npx cascade add multi-select
```

## Category

`inputs`

## States

- `closed`
- `open`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `options` | `MultiSelectOption[]` | yes | — | — |
| `value` | `string[]` | yes | — | — |
| `onValueChange` | `(v: string[]) => void` | yes | — | — |
| `placeholder` | `string` | no | — | — |
| `disabled` | `boolean` | no | `false` | — |
| `labels` | `MultiSelectLabels` | no | — | — |

## Examples

### Basic

```tsx
<MultiSelect options={[{label:'One',value:'1'},{label:'Two',value:'2'}]} value={[]} onValueChange={() => {}} />
```

## Design tokens

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-accent`
- `--cascade-radius-input`
- `--cascade-radius-md`
- `--cascade-shadow-md`
- `--cascade-focus-ring`
- `--cascade-motion-enter`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `listbox`
- **Keyboard:** ArrowDown, ArrowUp, Space, Enter, Escape

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

form, select, multi, input, popover
