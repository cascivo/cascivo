# Fab

**Category:** inputs  
**Description:** Floating action button anchored to a screen corner, with an optional speed-dial of secondary actions

## When to use

- A single, high-emphasis primary action that floats above scrolling content (e.g. Compose, Add)
- A small cluster of related create actions revealed from one corner via a speed-dial
- Touch-first screens where the primary action should stay reachable at the thumb

## When NOT to use

- Ordinary form or toolbar buttons — use Button or IconButton in the layout flow
- More than a handful of actions — use a Menu, Drawer, or full navigation
- Primary navigation between top-level destinations — use Dock

## Anti-patterns

### A floating button competes with the in-flow submit and hides the action off the form

**Bad:** `<Fab label="Save"><SaveIcon /></Fab> next to a form submit button`  
**Good:** `<Button type="submit">Save</Button>`  
**Why:** A floating button competes with the in-flow submit and hides the action off the form

## Related components

- **IconButton** (alternative): Use IconButton for an in-flow icon control; Fab floats and is high-emphasis
- **Dock** (alternative): Use Dock for bottom navigation between destinations rather than a single action

## Accessibility rationale

The main button is icon-only and requires a `label` that becomes its aria-label. With a speed-dial it exposes aria-haspopup="menu", aria-expanded, and aria-controls; the dial is a role="menu" of role="menuitem" buttons under vertical roving focus (Arrow keys, Home/End, wrapping). Opening moves focus to the first action and closing (Escape, outside press, or selection via DismissableLayer) returns focus to the button.

## Props

| Name           | Type                      | Required        | Default | Description                                                                 |
| -------------- | ------------------------- | --------------- | ------- | --------------------------------------------------------------------------- | --- |
| `children`     | `React.ReactNode`         | Yes             | —       | The main icon                                                               |
| `label`        | `string`                  | Yes             | —       | Accessible name for the button                                              |
| `onClick`      | `() => void`              | No              | —       | —                                                                           |
| `actions`      | `FabAction[]`             | No              | —       | Speed-dial actions; each has a label, icon, onSelect, and optional disabled |
| `position`     | `'bottom-end'             | 'bottom-start'` | No      | bottom-end                                                                  | —   |
| `open`         | `boolean`                 | No              | —       | —                                                                           |
| `defaultOpen`  | `boolean`                 | No              | —       | —                                                                           |
| `onOpenChange` | `(open: boolean) => void` | No              | —       | —                                                                           |
| `className`    | `string`                  | No              | —       | —                                                                           |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-content`
- `--cascivo-color-accent-hover`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-full`
- `--cascivo-shadow-overlay`
- `--cascivo-target-min-coarse`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-z-dropdown`

## Boundaries

| Area       | Level    | Note                                                                          |
| ---------- | -------- | ----------------------------------------------------------------------------- |
| actions    | flexible | Omit for a single-action button, or provide a speed-dial of secondary actions |
| position   | strict   | Anchored to bottom-end or bottom-start; honours safe-area insets              |
| open state | flexible | Speed-dial is controlled (open/onOpenChange) or uncontrolled (defaultOpen)    |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Fab component (inputs). Floating action button anchored to a screen corner, with an optional speed-dial of secondary actions

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Fab is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-accent-content, --cascivo-color-accent-hover, --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-full, --cascivo-shadow-overlay, --cascivo-target-min-coarse, --cascivo-motion-enter, --cascivo-motion-exit, --cascivo-z-dropdown

Accessibility: role "button", WCAG 2.2-AA, keyboard: Enter/Space/ArrowUp/ArrowDown/Home/End/Escape. Keep it AA.

Do not change (strict): position — Anchored to bottom-end or bottom-start; honours safe-area insets
Flexible: actions, open state.

Do not invent props, tokens, or global viewport media queries.
```
