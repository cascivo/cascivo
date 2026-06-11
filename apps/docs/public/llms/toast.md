# Toast

Transient notification surfaced via the useToast hook

## Install

```bash
npx cascade add toast
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

- `--cascade-color-surface-overlay`
- `--cascade-color-success`
- `--cascade-color-warning`
- `--cascade-color-destructive`
- `--cascade-radius-md`
- `--cascade-z-toast`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `status`
- **Keyboard:** Tab

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

overlay, notification, feedback
