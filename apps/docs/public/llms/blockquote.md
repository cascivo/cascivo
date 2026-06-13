# Blockquote

Quoted passage with optional attribution footer

## Install

```bash
npx cascade add blockquote
```

## Category

`display`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `cite` | `string` | no | `undefined` | — |

## Examples

### Default

```tsx
<Blockquote>Less, but better.</Blockquote>
```

### With attribution

Attribution renders as <footer><cite>

```tsx
<Blockquote cite="Dieter Rams">Less, but better.</Blockquote>
```

## Design tokens

- `--cascade-color-border-strong`
- `--cascade-color-text`
- `--cascade-color-text-subtle`
- `--cascade-font-sans`
- `--cascade-font-medium`
- `--cascade-leading-relaxed`
- `--cascade-text-sm`
- `--cascade-text-base`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `blockquote`

## Dependencies

- `@cascade-ui/core`

## Tags

typography, quote, blockquote, citation
