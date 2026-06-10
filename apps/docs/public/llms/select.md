# Select

Native select menu styled to match the design system

## Install

```bash
npx cascade add select
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `idle`
- `focused`
- `error`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | no | — | — |
| `hint` | `string` | no | — | — |
| `error` | `string` | no | — | — |
| `placeholder` | `string` | no | — | — |
| `options` | `{ value: string; label: string; disabled?: boolean }[]` | yes | — | — |
| `size` | `'sm' | 'md' | 'lg'` | no | `md` | — |
| `disabled` | `boolean` | no | `false` | — |

## Examples

### Basic

```tsx
<Select label="Role" options={[{ value: "admin", label: "Admin" }]} />
```

### With placeholder

```tsx
<Select label="Country" placeholder="Choose…" options={countries} />
```

## Design tokens

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-accent`
- `--cascade-color-text-muted`
- `--cascade-radius-input`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `combobox`
- **Keyboard:** Tab, Space, ArrowUp, ArrowDown

## Dependencies

- `@cascade-ui/core`

## Tags

form, dropdown, menu
