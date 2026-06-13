# CommandMenu

Cmd+K command palette with fuzzy search over grouped commands

## Install

```bash
npx cascade add command-menu
```

## Category

`overlay`

## States

- `closed`
- `open`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | yes | — | — |
| `onOpenChange` | `(open: boolean) => void` | yes | — | — |
| `groups` | `CommandGroup[]` | yes | — | — |
| `placeholder` | `string` | no | `Type a command or search…` | — |
| `emptyLabel` | `string` | no | `No results found` | — |
| `hotkey` | `boolean` | no | `true` | Global Cmd/Ctrl+K toggles the menu via onOpenChange |
| `label` | `string` | no | `Command menu` | — |
| `loading` | `boolean` | no | `false` | Shows a loading spinner in place of the empty state (for async items) |
| `onQueryChange` | `(query: string) => void` | no | — | Fires on every query keystroke — use to fetch async items |
| `className` | `string` | no | — | — |

## Examples

### Basic command menu

```tsx
<CommandMenu
  open={open}
  onOpenChange={setOpen}
  groups={[
    {
      heading: 'Actions',
      items: [
        { id: 'new', label: 'New file', shortcut: ['⌘', 'N'], onSelect: createFile },
        { id: 'search', label: 'Search docs', keywords: ['find'], onSelect: openSearch },
      ],
    },
  ]}
/>
```

## Design tokens

- `--cascade-color-surface-overlay`
- `--cascade-color-border`
- `--cascade-color-bg-subtle`
- `--cascade-color-text`
- `--cascade-color-text-muted`
- `--cascade-color-text-subtle`
- `--cascade-radius-modal`
- `--cascade-radius-sm`
- `--cascade-shadow-xl`
- `--cascade-motion-enter`
- `--cascade-motion-exit`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `combobox`
- **Keyboard:** Cmd/Ctrl+K, ArrowDown, ArrowUp, Home, End, Enter, Escape

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

overlay, command, palette, search, cmdk, keyboard
