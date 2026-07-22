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

| Prop            | Type                      | Required | Default                     | Description                                                                                                                                                                                                              |
| --------------- | ------------------------- | -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `open`          | `boolean`                 | yes      | —                           | Whether the component is open (controlled).                                                                                                                                                                              |
| `onOpenChange`  | `(open: boolean) => void` | yes      | —                           | Called with the next open state when it changes.                                                                                                                                                                         |
| `groups`        | `CommandGroup[]`          | yes      | —                           | The grouped commands to display.                                                                                                                                                                                         |
| `placeholder`   | `string`                  | no       | `Type a command or search…` | Placeholder text shown when the field is empty.                                                                                                                                                                          |
| `emptyLabel`    | `string`                  | no       | `No results found`          | Text shown when no commands match the query.                                                                                                                                                                             |
| `hotkey`        | `boolean`                 | no       | `true`                      | Global Cmd/Ctrl+K toggles the menu via onOpenChange                                                                                                                                                                      |
| `label`         | `string`                  | no       | `Command menu`              | Text label for the control.                                                                                                                                                                                              |
| `loading`       | `boolean`                 | no       | `false`                     | Shows a loading spinner in place of the empty state (for async items)                                                                                                                                                    |
| `onQueryChange` | `(query: string) => void` | no       | —                           | Fires on every query keystroke — use to fetch async items                                                                                                                                                                |
| `scopes`        | `CommandScope[]`          | no       | —                           | Selectable filter scopes. Renders a scope bar + chip; a scope activates by clicking its pill, typing its prefix (c:/c ), or cycling with Tab, and filters to groups tagged with a matching scope (plus untagged groups). |
| `className`     | `string`                  | no       | —                           | Additional CSS class names merged onto the root element.                                                                                                                                                                 |

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

### Scoped search with rich rows and inline actions

A scope chip filters to Clusters, matched glyphs are highlighted, each row carries a mono metadata line + status pill, and the selected row reveals Open (↵) / New tab (⌘↵) inline actions.

```tsx
<CommandMenu
  open={open}
  onOpenChange={setOpen}
  scopes={[
    { id: 'clusters', label: 'Clusters', prefix: 'c' },
    { id: 'orgs', label: 'Orgs', prefix: 'o' },
    { id: 'commands', label: 'Commands', prefix: '>' },
  ]}
  groups={[
    {
      heading: 'Clusters',
      scope: 'clusters',
      items: [
        {
          id: 'prod-eu',
          label: 'prod-eu-central-1',
          description: 'eu-central-1 · Enterprise · c9f21a04',
          status: { label: 'Healthy', tone: 'healthy' },
          actions: [
            { id: 'open', label: 'Open', shortcut: ['↵'], onSelect: () => open('prod-eu') },
            {
              id: 'tab',
              label: 'New tab',
              shortcut: ['⌘', '↵'],
              onSelect: () => openInTab('prod-eu'),
            },
          ],
        },
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
- `--cascivo-color-accent-content`
- `--cascivo-color-accent-muted`
- `--cascivo-color-accent-subtle`
- `--cascivo-color-success-subtle`
- `--cascivo-color-success-foreground`
- `--cascivo-color-warning-subtle`
- `--cascivo-color-warning-foreground`
- `--cascivo-font-mono`
- `--cascivo-radius-modal`
- `--cascivo-radius-sm`
- `--cascivo-shadow-xl`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `combobox`
- **Keyboard:** Cmd/Ctrl+K, ArrowDown, ArrowUp, Home, End, Enter, Cmd/Ctrl+Enter, Tab, Backspace, Escape

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, command, palette, search, cmdk, keyboard, scope, fuzzy

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
