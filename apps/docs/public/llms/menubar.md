# Menubar

Horizontal application menu bar with keyboard-navigable dropdown menus

## Install

```bash
npx cascivo add menubar
```

## Category

`navigation`

## States

- `closed`
- `open`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `menus` | `MenubarMenu[]` | yes | — | — |
| `aria-label` | `string` | yes | — | — |
| `className` | `string` | no | — | — |

## Examples

### Basic

```tsx
<Menubar aria-label="Main" menus={[{ id: "file", label: "File", items: [{ id: "new", label: "New", onSelect: () => {} }] }]} />
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-border`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `menubar`
- **Keyboard:** ArrowLeft, ArrowRight, ArrowDown, ArrowUp, Home, End, Enter, Escape

## Dependencies

- `@cascivo/core`

## Tags

navigation, menubar, menu, application
