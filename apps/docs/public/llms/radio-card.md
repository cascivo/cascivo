# RadioCard

Selectable card backed by a native radio input. Use RadioCardGroup for single-select groups.

## Install

```bash
npx cascade add radio-card
```

## Category

`inputs`

## States

- `default`
- `checked`
- `disabled`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string` | yes | — | Radio value |
| `title` | `ReactNode` | yes | — | Card title |
| `description` | `ReactNode` | no | — | Optional description |
| `disabled` | `boolean` | no | — | Disables the card |

## Examples

### Plan selector

Single-select plan picker

```tsx
<RadioCardGroup name="plan" defaultValue="pro" label="Plan">
  <RadioCard value="free" title="Free" description="For hobbyists" />
  <RadioCard value="pro" title="Pro" description="For professionals" />
  <RadioCard value="team" title="Team" description="For teams" />
</RadioCardGroup>
```

## Design tokens

- `--cascade-color-accent`
- `--cascade-color-border`
- `--cascade-radius-surface`
- `--cascade-color-active-bg`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `radiogroup`
- **Keyboard:** ArrowDown, ArrowUp, Space

## Dependencies

- `@cascade-ui/core`

## Tags

radio, card, selectable, form
