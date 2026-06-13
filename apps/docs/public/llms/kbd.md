# Kbd

Displays a keyboard key or shortcut

## Install

```bash
npx cascade add kbd
```

## Category

`display`

## Sizes

- `sm`
- `md`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `'sm' | 'md'` | no | `md` | — |

## Examples

### Single key

```tsx
<Kbd>⌘</Kbd>
```

### Shortcut

Compose multiple keys to show a shortcut

```tsx
<span><Kbd>⌘</Kbd> + <Kbd>K</Kbd></span>
```

### Small

```tsx
<Kbd size="sm">Esc</Kbd>
```

## Design tokens

- `--cascade-color-text-subtle`
- `--cascade-color-surface-raised`
- `--cascade-color-border`
- `--cascade-color-border-strong`
- `--cascade-radius-sm`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `kbd`

## Dependencies

- `@cascade-ui/core`

## Tags

keyboard, shortcut, hotkey
