# Status

**Category:** display  
**Description:** Colored dot with a label communicating the state of a system or entity

## When to use

- Communicating the live state of a system or entity (operational, deploying, down)
- Pairing a colored dot with a text label for an at-a-glance state
- Drawing attention to an active/changing state with an optional pulse

## When NOT to use

- A static category or count label — use Badge
- An identity thumbnail with presence — use Avatar with its status prop

## Anti-patterns

### A bare colored dot conveys nothing to color-blind or screen-reader users; always pair with text

**Bad:** `<Status status="success" /> with no label`  
**Good:** `<Status status="success">Operational</Status>`  
**Why:** A bare colored dot conveys nothing to color-blind or screen-reader users; always pair with text

## Related components

- **Badge** (alternative): Badge labels categories; Status reflects live state with a dot
- **Avatar** (alternative): Avatar embeds presence status on an identity

## Accessibility rationale

Meaning is carried by the text label, never by the dot color alone; the pulse animation is gated behind prefers-reduced-motion: no-preference so it never animates for users who opt out

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `status` | `'success' \| 'warning' \| 'error' \| 'info' \| 'neutral'` | No | neutral | Status state. |
| `pulse` | `boolean` | No | false | Pulses the dot — gated behind prefers-reduced-motion: no-preference |

## Tokens

- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-error`
- `--cascivo-color-info`
- `--cascivo-color-text-muted`
- `--cascivo-color-text`
- `--cascivo-radius-full`

## Examples

### Default

```jsx
<Status>Unknown</Status>
```

### Success

```jsx
<Status status="success">Operational</Status>
```

### Pulsing

The pulse animation respects prefers-reduced-motion

```jsx
<Status status="info" pulse>Deploying</Status>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| pulse | flexible | Enable pulse only for actively-changing states |
| token names | strict | State colors must resolve to --cascivo-color-success/warning/error/info |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Status component (display). Colored dot with a label communicating the state of a system or entity

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Status is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-success, --cascivo-color-warning, --cascivo-color-error, --cascivo-color-info, --cascivo-color-text-muted, --cascivo-color-text, --cascivo-radius-full

Accessibility: role "none", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — State colors must resolve to --cascivo-color-success/warning/error/info
Flexible: pulse.

Do not invent props, tokens, or global viewport media queries.
```
