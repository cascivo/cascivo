# Modal

**Category:** overlay  
**Description:** Accessible dialog overlay using native <dialog> element

## When to use

- Presenting focused content or a task that must interrupt the current flow
- Confirmations and forms that require the user to act before continuing
- Cases needing a modal backdrop, focus trap, and Escape-to-close from the native <dialog>

## When NOT to use

- Anchored, non-modal content next to a trigger — use Popover
- A side panel or drawer for secondary content — use Sheet
- A destructive confirmation with a clear yes/no decision — use AlertDialog

## Anti-patterns

### The open prop drives showModal()/close() on the native dialog, which manages the top layer, backdrop, and focus trap; hiding with CSS breaks all three

**Bad:** `Rendering <Modal> mounted but driving visibility with CSS display`  
**Good:** `Control visibility with the open prop`  
**Why:** The open prop drives showModal()/close() on the native dialog, which manages the top layer, backdrop, and focus trap; hiding with CSS breaks all three

## Related components

- **AlertDialog** (alternative): Use AlertDialog for a focused confirm/cancel decision, especially destructive ones
- **Sheet** (alternative): Use Sheet for an edge-anchored drawer rather than a centered dialog
- **Popover** (alternative): Use Popover for lightweight, non-modal content anchored to a trigger

## Accessibility rationale

Built on the native <dialog> element so showModal() provides a real focus trap, top-layer rendering, and inert background for free; role="dialog" plus aria-labelledby/aria-describedby tie the title and description to the dialog, and Escape closes via the platform.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | No | false | Whether the component is open (controlled). |
| `onClose` | `() => void` | No | — | Called when the component is closed. |
| `title` | `string` | No | — | Title text for the component. |
| `description` | `string` | No | — | Supporting description text. |
| `size` | `'sm' \| 'md' \| 'lg'` | No | md | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `draggable` | `boolean` | No | false | Allow dragging the dialog by its header |

## Tokens

- `--cascivo-color-surface-overlay`
- `--cascivo-color-border`
- `--cascivo-radius-modal`
- `--cascivo-shadow-xl`
- `--cascivo-focus-ring`

## Examples

### Basic modal

```jsx
<Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm action">
  <p>Are you sure?</p>
</Modal>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| token names | strict | Overlay surface, border, radius, shadow, and focus-ring must resolve to the listed --cascivo-* tokens |
| size | flexible | sm \| md \| lg, defaulting to md |
| title / description / body | flexible | All optional; body accepts arbitrary children |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Modal component (overlay). Accessible dialog overlay using native <dialog> element

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Modal is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface-overlay, --cascivo-color-border, --cascivo-radius-modal, --cascivo-shadow-xl, --cascivo-focus-ring

Accessibility: role "dialog", WCAG 2.2-AA, keyboard: Escape/Tab/Shift+Tab. Keep it AA.

Do not change (strict): token names — Overlay surface, border, radius, shadow, and focus-ring must resolve to the listed --cascivo-* tokens
Flexible: size, title / description / body.

Do not invent props, tokens, or global viewport media queries.
```
