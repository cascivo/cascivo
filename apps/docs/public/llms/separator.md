# Separator

Visual or semantic divider between content

## Install

```bash
npx cascivo add separator
```

## Category

`display`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `orientation` | `'horizontal' | 'vertical'` | no | `horizontal` | — |
| `decorative` | `boolean` | no | `false` | When true, the separator is purely visual and hidden from assistive tech |

## Examples

### Horizontal

```tsx
<Separator />
```

### Vertical

```tsx
<Separator orientation="vertical" />
```

## Design tokens

- `--cascivo-color-border`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `separator`

## Dependencies

- `@cascivo/core`

## Tags

divider, rule, layout
