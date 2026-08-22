# ContextMenu

**Category:** overlay  
**Description:** Right-click context menu anchored at pointer coordinates via CSS custom properties

## When to use

- Offering actions contextual to an element via right-click (rename, delete, copy on a row or canvas item)
- Power-user surfaces where the desktop right-click affordance is expected

## When NOT to use

- Primary actions that must be discoverable by all users — right-click is hidden; use a visible Button or Dropdown
- Selecting a value or filtering a list — use Combobox/Select

## Anti-patterns

### Right-click is undiscoverable and unavailable on touch, so critical actions become unreachable for many users

**Bad:** `Putting the only path to an action behind a right-click ContextMenu`  
**Good:** `Also expose it via a visible Dropdown or Button; treat the context menu as a shortcut`  
**Why:** Right-click is undiscoverable and unavailable on touch, so critical actions become unreachable for many users

## Related components

- **Dropdown** (alternative): Use a button-triggered menu when actions must be visible and touch-accessible
- **Menu** (alternative): Use a general menu when the trigger is not a right-click gesture

## Accessibility rationale

The menu container is role="menu" and items are role="menuitem" with roving keyboard navigation (ArrowDown/ArrowUp/Home/End skip disabled items, Enter/Space activate) and aria-disabled, and it uses popover="auto" so it light-dismisses on Escape or outside click; the toggle event syncs that dismissal back into state so focus and open state stay consistent

## Props

| Name       | Type              | Required | Default | Description                                                         |
| ---------- | ----------------- | -------- | ------- | ------------------------------------------------------------------- |
| `children` | `React.ReactNode` | Yes      | —       | The right-click target first, followed by ContextMenuItem children. |

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
<ContextMenu>
  <div>Right-click me</div>
  <ContextMenuItem onSelect={rename}>Rename</ContextMenuItem>
  <ContextMenuItem onSelect={remove}>Delete</ContextMenuItem>
</ContextMenu>
```

### Disabled item

```jsx
<ContextMenu>
  <FileRow file={file} />
  <ContextMenuItem onSelect={copy}>Copy</ContextMenuItem>
  <ContextMenuItem onSelect={paste} disabled>
    Paste
  </ContextMenuItem>
</ContextMenu>
```

## Boundaries

| Area            | Level    | Note                                                                                           |
| --------------- | -------- | ---------------------------------------------------------------------------------------------- |
| menu contents   | flexible | Accepts arbitrary ContextMenuItem children after the trigger child                             |
| anchor position | strict   | Anchored at pointer coordinates via --cascivo-context-x/y custom properties set on right-click |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ContextMenu component (overlay). Right-click context menu anchored at pointer coordinates via CSS custom properties

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ContextMenu is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-md, --cascivo-shadow-md, --cascivo-motion-enter, --cascivo-motion-exit, --cascivo-color-bg-subtle

Accessibility: role "menu", WCAG 2.2-AA, keyboard: ArrowDown/ArrowUp/Home/End/Enter/Space/Escape. Keep it AA.

Do not change (strict): anchor position — Anchored at pointer coordinates via --cascivo-context-x/y custom properties set on right-click
Flexible: menu contents.

Do not invent props, tokens, or global viewport media queries.
```
