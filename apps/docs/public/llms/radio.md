# Radio

Single choice from a set, grouped with RadioGroup

## Install

```bash
npx cascade add radio
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

- `--cascade-color-surface`
- `--cascade-color-accent`
- `--cascade-color-border-strong`
- `--cascade-color-text-on-accent`
- `--cascade-radius-full`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `radio`
- **Keyboard:** ArrowUp, ArrowDown, ArrowLeft, ArrowRight

## Dependencies

- `@cascade-ui/core`

## Tags

form, choice, group
