# Blockquote

Quoted passage with optional attribution footer

## Install

```bash
npx cascivo add blockquote
```

## Category

`display`

## Props

| Prop   | Type     | Required | Default     | Description |
| ------ | -------- | -------- | ----------- | ----------- |
| `cite` | `string` | no       | `undefined` | —           |

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

- `--cascivo-color-border-strong`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-font-sans`
- `--cascivo-font-medium`
- `--cascivo-leading-relaxed`
- `--cascivo-text-sm`
- `--cascivo-text-base`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `blockquote`

## Dependencies

- `@cascivo/core`

## Tags

typography, quote, blockquote, citation
