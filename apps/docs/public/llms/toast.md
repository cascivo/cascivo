# Toast

Transient notification surfaced via the useToast hook

## Install

```bash
npx cascivo add toast
```

## Category

`overlay`

## Variants

- `default`
- `success`
- `warning`
- `destructive`

## States

- `visible`
- `dismissing`
- `gone`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | yes | — | — |
| `description` | `string` | no | — | — |
| `variant` | `'default' | 'success' | 'warning' | 'destructive'` | no | `default` | — |
| `duration` | `number` | no | `5000` | — |

## Examples

### Trigger

```tsx
const { toast } = useToast()
toast({ title: "Saved", variant: "success" })
```

## Design tokens

- `--cascivo-color-surface-overlay`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-radius-md`
- `--cascivo-z-toast`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `status`
- **Keyboard:** Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, notification, feedback
