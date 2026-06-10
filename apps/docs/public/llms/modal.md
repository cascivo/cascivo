# Modal

Accessible dialog overlay using native <dialog> element

## Install

```bash
npx cascade add modal
```

## Category

`overlay`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `closed`
- `open`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | no | `false` | — |
| `onClose` | `() => void` | no | — | — |
| `title` | `string` | no | — | — |
| `description` | `string` | no | — | — |
| `size` | `'sm' | 'md' | 'lg'` | no | `md` | — |

## Examples

### Basic modal

```tsx
<Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm action">
  <p>Are you sure?</p>
</Modal>
```

## Design tokens

- `--cascade-color-surface-overlay`
- `--cascade-color-border`
- `--cascade-radius-modal`
- `--cascade-shadow-xl`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `dialog`
- **Keyboard:** Escape, Tab, Shift+Tab

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

overlay, dialog, popup
