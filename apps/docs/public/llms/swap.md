# Swap

Animated toggle between two icon/content states with rotate or flip transition

## Install

```bash
npx cascivo add swap
```

## Category

`inputs`

## Variants

- `rotate`
- `flip`

## States

- `unchecked`
- `checked`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `on` | `React.ReactNode` | yes | — | — |
| `off` | `React.ReactNode` | yes | — | — |
| `checked` | `boolean` | no | `false` | — |
| `onChange` | `(checked: boolean) => void` | no | — | — |
| `mode` | `'rotate' | 'flip'` | no | `rotate` | — |
| `aria-label` | `string` | no | — | — |
| `className` | `string` | no | — | — |

## Examples

### Theme toggle (rotate)

Sun/moon icon that rotates between two states

```tsx
<Swap on={<SunIcon />} off={<MoonIcon />} mode="rotate" aria-label="Toggle theme" />
```

### Flip mode

Heart icon that flips to filled on activation

```tsx
<Swap on={<HeartFilledIcon />} off={<HeartIcon />} mode="flip" aria-label="Favorite" />
```

## Design tokens

- `--cascivo-ring-width`
- `--cascivo-ring-color`
- `--cascivo-radius-control`
- `--cascivo-ease-out`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `switch`
- **Keyboard:** Space, Enter

## Dependencies

- `@cascivo/core`

## Tags

toggle, icon, animate, switch, flip, rotate
