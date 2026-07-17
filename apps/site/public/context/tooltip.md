# Tooltip

**Category:** overlay  
**Description:** Contextual label shown on hover or focus

## When to use

- Labeling an icon-only control or clarifying a terse element on hover or focus
- Showing brief, supplementary text that is non-essential to completing the task
- Progressive disclosure of a short hint anchored to a trigger element

## When NOT to use

- The content is interactive (links, buttons, inputs) — use Popover
- Richer non-interactive preview content is needed — use HoverCard
- The information is essential and must always be visible — render it inline instead

## Anti-patterns

### Tooltips are hover/focus hints and cannot reliably hold focusable content; interactive content belongs in a Popover

**Bad:** `<Tooltip content={<button>Undo</button>}><Icon /></Tooltip>`  
**Good:** `<Popover><button>Undo</button></Popover>`  
**Why:** Tooltips are hover/focus hints and cannot reliably hold focusable content; interactive content belongs in a Popover

## Related components

- **Popover** (alternative): Use when the floating content is interactive
- **HoverCard** (alternative): Use for richer non-interactive preview content
- **Button** (pairs-with): Commonly wraps an icon button to explain its action

## Accessibility rationale

The floating element uses role="tooltip" and is linked to the trigger via aria-describedby only while visible; it shows on both hover and keyboard focus so it is reachable without a pointer.

## Props

| Name        | Type                                     | Required | Default | Description                               |
| ----------- | ---------------------------------------- | -------- | ------- | ----------------------------------------- |
| `content`   | `ReactNode`                              | Yes      | —       | The tooltip content shown on hover/focus. |
| `placement` | `'top' \| 'right' \| 'bottom' \| 'left'` | No       | top     | Placement relative to the trigger.        |
| `children`  | `ReactElement`                           | Yes      | —       | Content rendered inside the component.    |
| `delay`     | `number`                                 | No       | 200     | Milliseconds to wait before showing       |

## Tokens

- `--cascivo-color-text`
- `--cascivo-color-text-on-accent`
- `--cascivo-radius-sm`
- `--cascivo-z-tooltip`

## Examples

### Basic

```jsx
<Tooltip content="Copy to clipboard">
  <Button>Copy</Button>
</Tooltip>
```

## Boundaries

| Area      | Level    | Note                                                                 |
| --------- | -------- | -------------------------------------------------------------------- |
| placement | strict   | Limited to top \| right \| bottom \| left, positioned via CSS anchor |
| delay     | flexible | Consumer can tune the show delay (default 200ms)                     |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Tooltip component (overlay). Contextual label shown on hover or focus

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Tooltip is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-text, --cascivo-color-text-on-accent, --cascivo-radius-sm, --cascivo-z-tooltip

Accessibility: role "tooltip", WCAG 2.2-AA, keyboard: Tab/Escape. Keep it AA.

Do not change (strict): placement — Limited to top | right | bottom | left, positioned via CSS anchor
Flexible: delay.

Do not invent props, tokens, or global viewport media queries.
```
