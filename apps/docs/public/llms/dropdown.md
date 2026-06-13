# Dropdown

Menu of actions revealed from a trigger

## Install

```bash
npx cascade add dropdown
```

## Category

`overlay`

## States

- `closed`
- `open`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `trigger` | `ReactElement` | yes | — | — |
| `items` | `{ label: string; value: string; icon?: ReactNode; disabled?: boolean; separator?: boolean }[]` | yes | — | — |
| `onSelect` | `(value: string) => void` | no | — | — |
| `placement` | `'bottom-start' | 'bottom-end'` | no | `bottom-start` | — |
| `open` | `boolean` | no | — | — |
| `onOpenChange` | `(open: boolean) => void` | no | — | — |

## Examples

### Basic

```tsx
<Dropdown trigger={<Button>Actions</Button>} items={[{ label: "Edit", value: "edit" }]} onSelect={handle} />
```

## Design tokens

- `--cascade-color-surface-overlay`
- `--cascade-color-border`
- `--cascade-color-bg-subtle`
- `--cascade-radius-md`
- `--cascade-z-dropdown`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `menu`
- **Keyboard:** ArrowDown, ArrowUp, Home, End, Enter, Space, Escape

## Dependencies

- `@cascade-ui/core`

## Tags

overlay, menu, actions
