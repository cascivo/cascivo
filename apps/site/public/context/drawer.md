# Drawer

**Category:** overlay  
**Description:** Edge-anchored dialog panel that slides in from a screen edge with CSS-only enter/exit motion

## When to use

- A side or edge panel for navigation, filters, or detail views that needs full-height space
- A modal surface that slides in and locks the page behind it while open
- A controllable open/close panel where the parent owns the state via open/onOpenChange

## When NOT to use

- A short yes/no confirmation — use AlertDialog
- Small content anchored to a trigger element — use Popover
- A gesture-driven, swipe-to-dismiss sheet — use Sheet

## Anti-patterns

### A full edge panel with focus trap and scroll lock is overkill for a yes/no decision

**Bad:** `<Drawer title="Delete item?">Are you sure?</Drawer>`  
**Good:** `<AlertDialog title="Delete item?" />`  
**Why:** A full edge panel with focus trap and scroll lock is overkill for a yes/no decision

## Related components

- **Sheet** (alternative): Use Sheet when swipe/gesture dismissal is wanted; Drawer is a plain dialog panel
- **Modal** (alternative): Use a centered modal rather than an edge panel for focused decisions

## Accessibility rationale

Renders role="dialog" with aria-modal; the title labels it via aria-labelledby and the description via aria-describedby. FocusScope traps Tab focus and restores it on close; DismissableLayer handles Escape and outside-pointer dismissal.

## Props

| Name             | Type                                    | Required | Default | Description                                                                   |
| ---------------- | --------------------------------------- | -------- | ------- | ----------------------------------------------------------------------------- |
| `open`           | `boolean`                               | No       | —       | Whether the component is open (controlled).                                   |
| `defaultOpen`    | `boolean`                               | No       | —       | Whether the component is open on first render (uncontrolled).                 |
| `onOpenChange`   | `(open: boolean) => void`               | No       | —       | Called with the next open state when it changes.                              |
| `side`           | `'start' \| 'end' \| 'top' \| 'bottom'` | No       | end     | Edge the panel is anchored to. Drives the slide direction.                    |
| `size`           | `string`                                | No       | —       | Panel size along its cross axis (width for start/end, height for top/bottom). |
| `title`          | `React.ReactNode`                       | No       | —       | Title text for the component.                                                 |
| `description`    | `React.ReactNode`                       | No       | —       | Supporting description text.                                                  |
| `children`       | `React.ReactNode`                       | No       | —       | Content rendered inside the component.                                        |
| `labels`         | `{ close?: string }`                    | No       | —       | Overrides for the component’s user-visible strings (i18n).                    |
| `className`      | `string`                                | No       | —       | Additional CSS class names merged onto the root element.                      |
| `swipeToDismiss` | `boolean`                               | No       | false   | Allow dragging the header toward its edge to dismiss (opt-in).                |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-overlay`
- `--cascivo-shadow-overlay`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Examples

### Basic

```jsx
<Drawer open={isOpen} onOpenChange={setIsOpen} title="Settings">
  <SettingsForm />
</Drawer>
```

### Bottom drawer with swipe-to-dismiss

Dragging the header past a threshold toward the edge dismisses the panel.

```jsx
<Drawer defaultOpen side="bottom" size="20rem" swipeToDismiss title="Details">
  <OrderDetails />
</Drawer>
```

## Boundaries

| Area         | Level    | Note                                                                                |
| ------------ | -------- | ----------------------------------------------------------------------------------- |
| side         | strict   | Limited to start \| end \| top \| bottom — drives the slide direction and animation |
| open state   | flexible | Controlled (open/onOpenChange) or uncontrolled (defaultOpen)                        |
| body content | flexible | Any children; the consumer owns the panel contents                                  |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Drawer component (overlay). Edge-anchored dialog panel that slides in from a screen edge with CSS-only enter/exit motion

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Drawer is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-overlay, --cascivo-shadow-overlay, --cascivo-motion-enter, --cascivo-motion-exit

Accessibility: role "dialog", WCAG 2.2-AA, keyboard: Escape/Tab/Shift+Tab. Keep it AA.

Do not change (strict): side — Limited to start | end | top | bottom — drives the slide direction and animation
Flexible: open state, body content.

Do not invent props, tokens, or global viewport media queries.
```
