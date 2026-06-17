# Field

Form-field wrapper composing label, control, description, and error

## Install

```bash
npx cascivo add field
```

## Category

`inputs`

## States

- `default`
- `disabled`
- `invalid`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `ReactNode` | no | — | — |
| `description` | `ReactNode` | no | — | — |
| `error` | `ReactNode` | no | — | — |
| `required` | `boolean` | no | `false` | — |
| `disabled` | `boolean` | no | `false` | — |
| `id` | `string` | no | — | — |
| `children` | `ReactElement` | yes | — | — |

## Examples

### Basic

```tsx
<Field label="Email"><Input type="email" /></Field>
```

### With description

```tsx
<Field label="Email" description="We never share it."><Input /></Field>
```

### With error

Sets aria-invalid on the control and announces the error via role="alert".

```tsx
<Field label="Email" error="Email is required" required><Input /></Field>
```

## Design tokens

- `--cascivo-space-2`
- `--cascivo-font-sans`
- `--cascivo-text-sm`
- `--cascivo-leading-snug`
- `--cascivo-color-text-muted`
- `--cascivo-color-destructive`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`

## Dependencies

- `@cascivo/core`

## Tags

form, layout, validation, accessibility
