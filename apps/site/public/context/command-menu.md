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
| token names | strict   | Palette styling resolves to semantic --cascivo-color-\* / --cascivo-radius-modal tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo CommandMenu component (overlay). Cmd+K command palette with fuzzy search over grouped commands

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

CommandMenu is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface-overlay, --cascivo-color-border, --cascivo-color-bg-subtle, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-text-subtle, --cascivo-radius-modal, --cascivo-radius-sm, --cascivo-shadow-xl, --cascivo-motion-enter, --cascivo-motion-exit

Accessibility: role "combobox", WCAG 2.2-AA, keyboard: Cmd/Ctrl+K/ArrowDown/ArrowUp/Home/End/Enter/Escape. Keep it AA.

Do not change (strict): token names — Palette styling resolves to semantic --cascivo-color-* / --cascivo-radius-modal tokens
Flexible: hotkey, async items.

Do not invent props, tokens, or global viewport media queries.
```
