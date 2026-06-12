# Input

Text input field with optional label, hint, and error state

## Install

```bash
npx cascade add input
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
| `size` | `'sm' | 'md' | 'lg'` | no | `md` | — |
| `placeholder` | `string` | no | — | — |
| `disabled` | `boolean` | no | `false` | — |

## Examples

### With label

```tsx
<Input label="Email" placeholder="you@example.com" />
```

### With error

```tsx
<Input label="Email" error="Invalid email address" />
```

## Design tokens

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-accent`
- `--cascade-color-destructive`
- `--cascade-radius-input`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `textbox`
- **Keyboard:** Tab, Shift+Tab

## Dependencies

- `@cascade-ui/core`

## Tags

form, text, input
