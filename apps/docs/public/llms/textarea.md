# Textarea

Multi-line text input with optional label, hint, and error state

## Install

```bash
npx cascade add textarea
```

## Category

`inputs`

## States

- `idle`
- `focused`
- `error`

## Props

| Prop       | Type      | Required   | Default | Description |
| ---------- | --------- | ---------- | ------- | ----------- | ---------- | --- |
| `label`    | `string`  | no         | —       | —           |
| `hint`     | `string`  | no         | —       | —           |
| `error`    | `string`  | no         | —       | —           |
| `rows`     | `number`  | no         | `4`     | —           |
| `resize`   | `'none'   | 'vertical' | 'both'` | no          | `vertical` | —   |
| `disabled` | `boolean` | no         | `false` | —           |

## Examples

### With label

```tsx
<Textarea label="Message" placeholder="Type here…" />
```

### With error

```tsx
<Textarea label="Bio" error="Bio is required" />
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

form, text, multiline
