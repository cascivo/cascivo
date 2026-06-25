# CommandMenu

Cmd+K command palette with fuzzy search over grouped commands

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add command-menu
```

Or use it from the prebuilt package without copying:

```tsx
import { CommandMenu } from '@cascivo/react'
```

## Category

`overlay`

## States

- `closed`
- `open`

## Props

| Prop            | Type                      | Required | Default                     | Description                                                           |
| --------------- | ------------------------- | -------- | --------------------------- | --------------------------------------------------------------------- |
| `open`          | `boolean`                 | yes      | —                           | —                                                                     |
| `onOpenChange`  | `(open: boolean) => void` | yes      | —                           | —                                                                     |
| `groups`        | `CommandGroup[]`          | yes      | —                           | —                                                                     |
| `placeholder`   | `string`                  | no       | `Type a command or search…` | —                                                                     |
| `emptyLabel`    | `string`                  | no       | `No results found`          | —                                                                     |
| `hotkey`        | `boolean`                 | no       | `true`                      | Global Cmd/Ctrl+K toggles the menu via onOpenChange                   |
| `label`         | `string`                  | no       | `Command menu`              | —                                                                     |
| `loading`       | `boolean`                 | no       | `false`                     | Shows a loading spinner in place of the empty state (for async items) |
| `onQueryChange` | `(query: string) => void` | no       | —                           | Fires on every query keystroke — use to fetch async items             |
| `className`     | `string`                  | no       | —                           | —                                                                     |

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

- `--cascivo-color-surface-overlay`
- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-text-subtle`
- `--cascivo-radius-modal`
- `--cascivo-radius-sm`
- `--cascivo-shadow-xl`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `combobox`
- **Keyboard:** Cmd/Ctrl+K, ArrowDown, ArrowUp, Home, End, Enter, Escape

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, command, palette, search, cmdk, keyboard
