# Menu

**Category:** overlay  
**Description:** Dropdown menu with keyboard navigation, built on usePopover

## When to use

- Presenting a list of actions or commands triggered from a button
- Action lists that need arrow-key navigation and Enter/Space activation
- Grouping related commands with separators behind a single trigger

## When NOT to use

- Selecting a persistent value from options — use Select or MultiSelect
- Right-click contextual actions on an element — use ContextMenu
- A single non-list action — use a Button

## Anti-patterns

### Menu items use role="menuitem" and close on activation — they are not selectable options and do not model a chosen value

**Bad:** `Using Menu items to pick a form value and showing the choice as selected`  
**Good:** `Use Select for value selection; Menu items are one-shot actions`  
**Why:** Menu items use role="menuitem" and close on activation — they are not selectable options and do not model a chosen value

## Related components

- **ContextMenu** (alternative): Use ContextMenu for right-click activation on a target element
- **Select** (alternative): Use Select when the user is choosing a value rather than firing an action
- **Button** (pairs-with): A button (MenuTrigger) opens the menu

## Accessibility rationale

The trigger exposes aria-haspopup="menu" and aria-expanded, the panel is role="menu" with role="menuitem" children, focus moves to the first enabled item on open, ArrowUp/ArrowDown rove focus between items, disabled items are aria-disabled and removed from the tab order, and separators use role="separator".

## Props

| Name       | Type              | Required | Default | Description                                                         |
| ---------- | ----------------- | -------- | ------- | ------------------------------------------------------------------- |
| `children` | `React.ReactNode` | Yes      | —       | The MenuTrigger first, followed by MenuItem/MenuSeparator children. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-md`
- `--cascivo-shadow-md`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-color-bg-subtle`

## Examples

### Basic

```jsx
<Menu>
  <MenuTrigger>Options</MenuTrigger>
  <MenuItem onSelect={rename}>Rename</MenuItem>
  <MenuItem onSelect={duplicate}>Duplicate</MenuItem>
</Menu>
```

### With separator and disabled item

```jsx
<Menu>
  <MenuTrigger aria-label="More actions">…</MenuTrigger>
  <MenuItem onSelect={share}>Share</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={remove} disabled>
    Delete
  </MenuItem>
</Menu>
```

## Boundaries

| Area         | Level    | Note                                                                                       |
| ------------ | -------- | ------------------------------------------------------------------------------------------ |
| token names  | strict   | Surface, border, radius, shadow, and motion must resolve to the listed --cascivo-\* tokens |
| item content | flexible | MenuItem accepts arbitrary children; onSelect defines the action                           |
| composition  | flexible | MenuItem and MenuSeparator can be mixed freely under the trigger                           |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Menu component (overlay). Dropdown menu with keyboard navigation, built on usePopover

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Menu is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-md, --cascivo-shadow-md, --cascivo-motion-enter, --cascivo-motion-exit, --cascivo-color-bg-subtle

Accessibility: role "menu", WCAG 2.2-AA, keyboard: ArrowDown/ArrowUp/Enter/Space/Escape. Keep it AA.

Do not change (strict): token names — Surface, border, radius, shadow, and motion must resolve to the listed --cascivo-* tokens
Flexible: item content, composition.

Do not invent props, tokens, or global viewport media queries.
```
