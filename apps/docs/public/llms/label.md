# Label

Accessible caption for a form control

## Install

```bash
npx cascivo add label
```

## Category

`inputs`

## States

- `default`
- `disabled`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `htmlFor` | `string` | no | — | — |
| `asChild` | `boolean` | no | `false` | — |
| `required` | `boolean` | no | `false` | — |
| `disabled` | `boolean` | no | `false` | — |
| `children` | `ReactNode` | yes | — | — |
| `labels` | `{ required?: string }` | no | — | — |

## Examples

### Basic

```tsx
<Label htmlFor="email">Email</Label>
```

### Required

```tsx
<Label htmlFor="email" required>Email</Label>
```

### asChild

Render the label semantics onto a custom element via Slot.

```tsx
<Label asChild htmlFor="email"><span>Email</span></Label>
```

## Design tokens

- `--cascivo-space-1`
- `--cascivo-font-sans`
- `--cascivo-text-sm`
- `--cascivo-font-medium`
- `--cascivo-leading-snug`
- `--cascivo-leading-none`
- `--cascivo-color-text`
- `--cascivo-color-destructive`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `label`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

form, caption, accessibility
