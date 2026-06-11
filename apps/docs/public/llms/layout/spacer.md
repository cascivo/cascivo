# Spacer

Fixed-height spacing block using design token steps.

## Install

```bash
npx cascade add layout/spacer
```

## Category

`layout`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `1|2|3|4|5|6|8|10|12` | no | — | Spacing token step |

## Examples

### Spacer

Adds vertical space between elements

```tsx
<Spacer size={8} />
```

## Design tokens

- `--cascade-space-*`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `none`

## Dependencies

- `@cascade-ui/core`

## Tags

layout, spacer, spacing
