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

### Each item does one thing on Enter — run onSelect, run its first action, or push a nested page (page)

**Bad:** `Items that set both page and an activation (onSelect/actions), or neither`  
**Good:** `undefined`  
**Why:** Each item does one thing on Enter — run onSelect, run its first action, or push a nested page (page)

## Related components

- **Combobox** (alternative): Use for filtering and selecting a form value rather than running commands
- **Dropdown** (alternative): Use for a small action menu anchored to a button instead of a global palette
- **Modal** (contained-by): Renders inside a native modal dialog with backdrop dismiss

## Accessibility rationale

The search input is role="combobox" with aria-controls, aria-expanded, aria-autocomplete="list" and aria-activedescendant so navigation is announced without moving DOM focus from the input; it renders in a native <dialog> for focus trapping, the empty/loading state uses role="status", and footer hints, match highlights, status dots, and keycaps are aria-hidden as redundant decoration (status labels remain readable text). Scope pills are real buttons and the scope chip exposes an aria-labelled clear control

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | — | Whether the component is open (controlled). |
| `onOpenChange` | `(open: boolean) => void` | Yes | — | Called with the next open state when it changes. |
| `groups` | `CommandGroup[]` | Yes | — | The grouped commands to display. |
| `placeholder` | `string` | No | Type a command or search… | Placeholder text shown when the field is empty. |
| `emptyLabel` | `string` | No | No results found | Text shown when no commands match the query. |
| `hotkey` | `boolean` | No | true | Global Cmd/Ctrl+K toggles the menu via onOpenChange |
| `label` | `string` | No | Command menu | Text label for the control. |
| `loading` | `boolean` | No | false | Shows a loading spinner in place of the empty state (for async items) |
| `onQueryChange` | `(query: string) => void` | No | — | Fires on every query keystroke — use to fetch async items |
| `scopes` | `CommandScope[]` | No | — | Selectable filter scopes. Renders a scope bar + chip; a scope activates by clicking its pill, typing its prefix (c:/c ), or cycling with Tab, and filters to groups tagged with a matching scope (plus untagged groups). |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

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

### Scoped search with rich rows and inline actions

A scope chip filters to Clusters, matched glyphs are highlighted, each row carries a mono metadata line + status pill, and the selected row reveals Open (↵) / New tab (⌘↵) inline actions.

```jsx
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
            { id: 'tab', label: 'New tab', shortcut: ['⌘', '↵'], onSelect: () => openInTab('prod-eu') },
          ],
        },
      ],
    },
  ]}
/>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| hotkey | flexible | Global Cmd/Ctrl+K binding can be disabled via hotkey={false} for custom triggering |
| async items | flexible | onQueryChange + loading allow fetching items per keystroke |
| scopes | flexible | Optional scopes prop adds a filter bar/chip + typed prefixes; groups opt in via a scope id, untagged groups stay visible under any scope |
| inline actions | flexible | Items may declare actions[]; the first is Enter, the second Cmd/Ctrl+Enter, and each is clickable. Rows also support a description metadata line and a status pill |
| token names | strict | Palette styling resolves to semantic --cascivo-color-* / --cascivo-radius-modal tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo CommandMenu component (overlay). Cmd+K command palette with fuzzy search over grouped commands

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

CommandMenu is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface-overlay, --cascivo-color-border, --cascivo-color-bg-subtle, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-text-subtle, --cascivo-color-accent-content, --cascivo-color-accent-muted, --cascivo-color-accent-subtle, --cascivo-color-success-subtle, --cascivo-color-success-foreground, --cascivo-color-warning-subtle, --cascivo-color-warning-foreground, --cascivo-font-mono, --cascivo-radius-modal, --cascivo-radius-sm, --cascivo-shadow-xl, --cascivo-motion-enter, --cascivo-motion-exit

Accessibility: role "combobox", WCAG 2.2-AA, keyboard: Cmd/Ctrl+K/ArrowDown/ArrowUp/Home/End/Enter/Cmd/Ctrl+Enter/Tab/Backspace/Escape. Keep it AA.

Do not change (strict): token names — Palette styling resolves to semantic --cascivo-color-* / --cascivo-radius-modal tokens
Flexible: hotkey, async items, scopes, inline actions.

Do not invent props, tokens, or global viewport media queries.
```
