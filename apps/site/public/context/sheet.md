# Sheet

**Category:** overlay  
**Description:** Slide-in panel from any edge, using popover=manual and @starting-style animations

## When to use

- Showing secondary content or a form in a panel that slides in from a screen edge
- Navigation, filters, or detail views that benefit from full-height side space without leaving the page
- Mobile-friendly drawers where a centered modal would feel cramped

## When NOT to use

- A short confirmation or focused decision — use Modal or AlertDialog
- Small contextual content anchored to a trigger — use Popover

## Anti-patterns

### A full edge-to-edge panel is overkill for a yes/no decision; AlertDialog is the right scale and semantics

**Bad:** `<Sheet title="Delete item?">Are you sure?</Sheet>`  
**Good:** `<AlertDialog title="Delete item?" />`  
**Why:** A full edge-to-edge panel is overkill for a yes/no decision; AlertDialog is the right scale and semantics

## Related components

- **Modal** (alternative): Use for centered, focused dialogs rather than edge panels
- **Popover** (alternative): Use for small content anchored to a trigger element

## Accessibility rationale

Uses popover="manual" with role="dialog" and aria-modal so it is announced as a modal surface; when a title is provided it labels the dialog via aria-labelledby (so rich title nodes stay accessible), and Escape/Tab handling comes from the popover platform behavior.

## Props

| Name      | Type              | Required | Default | Description                                 |
| --------- | ----------------- | -------- | ------- | ------------------------------------------- | --- | --- | ---------------------------------- |
| `open`    | `boolean`         | Yes      | —       | Whether the component is open (controlled). |
| `onClose` | `() => void`      | Yes      | —       | Called when the component is closed.        |
| `title`   | `React.ReactNode` | No       | —       | Title text for the component.               |
| `side`    | `'start'          | 'end'    | 'top'   | 'bottom'`                                   | No  | end | Edge the component is anchored to. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-lg`
- `--cascivo-shadow-xl`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Examples

### Basic

```jsx
<Sheet open={isOpen} onClose={() => setIsOpen(false)} title="Filters">
  <FilterForm />
</Sheet>
```

### Bottom sheet

```jsx
<Sheet open={isOpen} onClose={close} side="bottom" title="Share">
  <ShareOptions />
</Sheet>
```

## Boundaries

| Area         | Level    | Note                                           |
| ------------ | -------- | ---------------------------------------------- | --- | --- | ------------------------------------------------- |
| side         | strict   | Limited to start                               | end | top | bottom — drives the slide direction and animation |
| body content | flexible | Any children; consumer owns the panel contents |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Sheet component (overlay). Slide-in panel from any edge, using popover=manual and @starting-style animations

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Sheet is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-lg, --cascivo-shadow-xl, --cascivo-motion-enter, --cascivo-motion-exit

Accessibility: role "dialog", WCAG 2.2-AA, keyboard: Escape/Tab/Shift+Tab. Keep it AA.

Do not change (strict): side — Limited to start | end | top | bottom — drives the slide direction and animation
Flexible: body content.

Do not invent props, tokens, or global viewport media queries.
```
