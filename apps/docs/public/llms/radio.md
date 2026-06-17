# Radio

Single choice from a set, grouped with RadioGroup

## Install

```bash
npx cascivo add radio
```

## Category

`inputs`

## States

- `unchecked`
- `checked`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | no | — | — |
| `value` | `string` | yes | — | — |
| `disabled` | `boolean` | no | `false` | — |
| `name` | `string` | no | — | — |

## Examples

### Group

```tsx
<RadioGroup name="plan" defaultValue="pro"><Radio value="pro" label="Pro" /><Radio value="team" label="Team" /></RadioGroup>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-text-on-accent`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `radio`
- **Keyboard:** ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space

## Dependencies

- `@cascivo/core`

## Tags

form, choice, group
