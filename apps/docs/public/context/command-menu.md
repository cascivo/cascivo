# CommandMenu

**Category:** overlay  
**Description:** Cmd+K command palette with fuzzy search over grouped commands

## When to use

- Giving power users a global Cmd/Ctrl+K palette to search and run actions or navigate
- Exposing many commands across grouped categories that benefit from fuzzy search
- Multi-step flows where selecting an item drills into a nested page of further commands

## When NOT to use

- Picking a form value from a list — use Combobox
- A small set of actions tied to a specific trigger button — use Dropdown

## Anti-patterns

### CommandMenu is a modal command palette whose items run onSelect callbacks or open sub-pages; it has no controlled form value

**Bad:** `Using CommandMenu as a form field to capture a selected value`  
**Good:** `Use Combobox for value selection inside a form`  
**Why:** CommandMenu is a modal command palette whose items run onSelect callbacks or open sub-pages; it has no controlled form value

### Each item must do exactly one thing — run an action (onSelect) or push a nested page (page)

**Bad:** `Items with both onSelect and page set, or neither`  
**Good:** `undefined`  
**Why:** Each item must do exactly one thing — run an action (onSelect) or push a nested page (page)

## Related components

- **Combobox** (alternative): Use for filtering and selecting a form value rather than running commands
- **Dropdown** (alternative): Use for a small action menu anchored to a button instead of a global palette
- **Modal** (contained-by): Renders inside a native modal dialog with backdrop dismiss

## Accessibility rationale

The search input is role="combobox" with aria-controls, aria-expanded, aria-autocomplete="list" and aria-activedescendant so navigation is announced without moving DOM focus from the input; it renders in a native <dialog> for focus trapping, the empty/loading state uses role="status", and footer hints are aria-hidden as redundant decoration

## Props

| Name            | Type                      | Required | Default                   | Description                                                           |
| --------------- | ------------------------- | -------- | ------------------------- | --------------------------------------------------------------------- |
| `open`          | `boolean`                 | Yes      | —                         | —                                                                     |
| `onOpenChange`  | `(open: boolean) => void` | Yes      | —                         | —                                                                     |
| `groups`        | `CommandGroup[]`          | Yes      | —                         | —                                                                     |
| `placeholder`   | `string`                  | No       | Type a command or search… | —                                                                     |
| `emptyLabel`    | `string`                  | No       | No results found          | —                                                                     |
| `hotkey`        | `boolean`                 | No       | true                      | Global Cmd/Ctrl+K toggles the menu via onOpenChange                   |
| `label`         | `string`                  | No       | Command menu              | —                                                                     |
| `loading`       | `boolean`                 | No       | false                     | Shows a loading spinner in place of the empty state (for async items) |
| `onQueryChange` | `(query: string) => void` | No       | —                         | Fires on every query keystroke — use to fetch async items             |
| `className`     | `string`                  | No       | —                         | —                                                                     |

## Tokens

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

## Examples

### Basic command menu

```jsx
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

## Boundaries

| Area        | Level    | Note                                                                                    |
| ----------- | -------- | --------------------------------------------------------------------------------------- |
| hotkey      | flexible | Global Cmd/Ctrl+K binding can be disabled via hotkey={false} for custom triggering      |
| async items | flexible | onQueryChange + loading allow fetching items per keystroke                              |
| token names | strict   | Palette styling resolves to semantic --cascade-color-\* / --cascade-radius-modal tokens |
