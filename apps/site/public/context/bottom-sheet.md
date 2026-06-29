# BottomSheet

**Category:** overlay  
**Description:** Mobile bottom sheet with drag-to-resize detents, velocity-projected snapping, and drag-to-dismiss

## When to use

- A mobile surface that rises from the bottom and can be resized between detents by dragging
- Showing secondary content, filters, or a form where the user can peek at half height then expand
- A touch-first overlay that dismisses by flinging or dragging it down past the lowest detent

## When NOT to use

- A short yes/no confirmation — use AlertDialog
- A non-resizable edge panel without gestures — use Drawer or Sheet
- A desktop-first side panel for navigation — use Drawer

## Anti-patterns

### A resizable gesture surface is overkill for a focused yes/no decision

**Bad:** `<BottomSheet title="Delete item?">Are you sure?</BottomSheet>`  
**Good:** `<AlertDialog title="Delete item?" />`  
**Why:** A resizable gesture surface is overkill for a focused yes/no decision

## Related components

- **Sheet** (alternative): Use Sheet for a fixed-height panel from any edge; BottomSheet adds resize detents
- **Drawer** (alternative): Use Drawer for a plain edge dialog without resize detents

## Accessibility rationale

Renders role="dialog" with aria-modal; the title labels it via aria-labelledby and the description via aria-describedby. FocusScope traps Tab focus and restores it on close; DismissableLayer handles Escape and outside-pointer dismissal. The grab handle is a labelled separator and a Close button gives a non-gesture dismissal path so the sheet stays keyboard-operable.

## Props

| Name           | Type                                  | Required | Default     | Description                                                   |
| -------------- | ------------------------------------- | -------- | ----------- | ------------------------------------------------------------- |
| `open`         | `boolean`                             | No       | —           | Whether the component is open (controlled).                   |
| `defaultOpen`  | `boolean`                             | No       | —           | Whether the component is open on first render (uncontrolled). |
| `onOpenChange` | `(open: boolean) => void`             | No       | —           | Called with the next open state when it changes.              |
| `snapPoints`   | `number[]`                            | No       | [0.5, 0.92] | Detent heights as ascending fractions of the viewport (0–1)   |
| `activeSnap`   | `number`                              | No       | —           | The controlled snap-point index.                              |
| `defaultSnap`  | `number`                              | No       | 0           | The initial snap-point index when uncontrolled.               |
| `onSnapChange` | `(index: number) => void`             | No       | —           | Called with the new snap-point index when it changes.         |
| `title`        | `React.ReactNode`                     | No       | —           | Title text for the component.                                 |
| `description`  | `React.ReactNode`                     | No       | —           | Supporting description text.                                  |
| `children`     | `React.ReactNode`                     | No       | —           | Content rendered inside the component.                        |
| `labels`       | `{ close?: string; handle?: string }` | No       | —           | Overrides for the component’s user-visible strings (i18n).    |
| `className`    | `string`                              | No       | —           | Additional CSS class names merged onto the root element.      |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-overlay`
- `--cascivo-shadow-overlay`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-target-min-coarse`
- `--cascivo-z-overlay`

## Boundaries

| Area          | Level    | Note                                                                   |
| ------------- | -------- | ---------------------------------------------------------------------- |
| snapPoints    | flexible | Any ascending list of viewport fractions; the sheet snaps between them |
| open state    | flexible | Controlled (open/onOpenChange) or uncontrolled (defaultOpen)           |
| active detent | flexible | Controlled (activeSnap/onSnapChange) or uncontrolled (defaultSnap)     |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo BottomSheet component (overlay). Mobile bottom sheet with drag-to-resize detents, velocity-projected snapping, and drag-to-dismiss

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

BottomSheet is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-overlay, --cascivo-shadow-overlay, --cascivo-motion-enter, --cascivo-motion-exit, --cascivo-target-min-coarse, --cascivo-z-overlay

Accessibility: role "dialog", WCAG 2.2-AA, keyboard: Escape/Tab/Shift+Tab. Keep it AA.
Flexible: snapPoints, open state, active detent.

Do not invent props, tokens, or global viewport media queries.
```
