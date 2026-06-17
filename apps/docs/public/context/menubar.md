# Menubar

**Category:** navigation  
**Description:** Horizontal application menu bar with keyboard-navigable dropdown menus

## When to use

- A persistent application-style command bar (File / Edit / View) where each top-level entry opens a menu of actions
- Desktop-like apps that expose grouped commands across a horizontal bar

## When NOT to use

- Site or section navigation between pages or destinations — use NavigationMenu
- A single trigger that opens one menu of actions — use a Menu/Dropdown
- Switching between peer content panels — use Tabs

## Anti-patterns

### menubar implies commands/actions within the current view, not navigation to other pages

**Bad:** `Using Menubar entries as page links`  
**Good:** `<NavigationMenu> for navigating between destinations`  
**Why:** menubar implies commands/actions within the current view, not navigation to other pages

## Related components

- **NavigationMenu** (alternative): NavigationMenu navigates between destinations; Menubar invokes commands
- **Menu** (contains): Each Menubar entry behaves like a single Menu anchored under its trigger

## Accessibility rationale

Implements the WAI-ARIA menubar pattern: a roving-tabindex row of menuitem triggers (Left/Right/Home/End) where ArrowDown opens the menu and focuses its first item, Up/Down move within the menu, and Escape closes and restores focus to the trigger

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `menus` | `MenubarMenu[]` | Yes | — | — |
| `aria-label` | `string` | Yes | — | — |
| `className` | `string` | No | — | — |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-border`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Examples

### Basic

```jsx
<Menubar aria-label="Main" menus={[{ id: "file", label: "File", items: [{ id: "new", label: "New", onSelect: () => {} }] }]} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| menu content | strict | Menus are described by data (menus prop) so roles and keyboard wiring stay correct |
| token names | strict | Surface, borders, and focus ring must resolve to --cascivo-* tokens |
