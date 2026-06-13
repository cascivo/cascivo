# Input

Text input field with optional label, hint, and error state

## Install

```bash
npx cascivo add input
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

| Prop          | Type      | Required | Default | Description |
| ------------- | --------- | -------- | ------- | ----------- | ---- | --- |
| `label`       | `string`  | no       | —       | —           |
| `hint`        | `string`  | no       | —       | —           |
| `error`       | `string`  | no       | —       | —           |
| `size`        | `'sm'     | 'md'     | 'lg'`   | no          | `md` | —   |
| `placeholder` | `string`  | no       | —       | —           |
| `disabled`    | `boolean` | no       | `false` | —           |

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

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `textbox`
- **Keyboard:** Tab, Shift+Tab

## Dependencies

- `@cascivo/core`

## Tags

form, text, input
