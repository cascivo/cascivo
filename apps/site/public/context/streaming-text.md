# StreamingText

**Category:** display  
**Description:** Reveals text character by character with a blinking cursor, catching up as a streamed reply grows

## When to use

- Rendering an assistant reply as it streams in, smoothing bursty token arrival into steady typing

## When NOT to use

- Static text — render it directly
- Announcing the reply to screen readers — StreamingText is never a live region; announce completion with announce() or AiStatus

## Anti-patterns

### A live region around typing text announces fragments on every frame

**Bad:** `Wrapping StreamingText in aria-live`  
**Good:** `Leave it silent and announce the finished reply once`  
**Why:** A live region around typing text announces fragments on every frame

## Related components

- **AiStatus** (pairs-with): AiStatus announces the phase while StreamingText renders the words
- **TypingIndicator** (alternative): Before the first token arrives, show TypingIndicator instead

## Accessibility rationale

Plain text, never a live region, so a screen reader reads it on demand rather than being fed every character; the cursor is aria-hidden and blinks only under prefers-reduced-motion: no-preference

## Props

| Name         | Type         | Required | Default | Description                                                                                                                                    |
| ------------ | ------------ | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`       | `string`     | Yes      | —       | The target text. Pass the accumulating reply as it streams; typing catches up as it grows, and restarts if it is replaced by a shorter string. |
| `speed`      | `number`     | No       | 2       | Characters revealed per animation frame.                                                                                                       |
| `onComplete` | `() => void` | No       | —       | Called when the displayed text has caught up with `text`.                                                                                      |

## Tokens

- `--cascivo-duration-loop-fast`

## Examples

### Typing

```jsx
<StreamingText text="Hello, I am cascivo." speed={3} />
```

## Boundaries

| Area          | Level    | Note                                                 |
| ------------- | -------- | ---------------------------------------------------- |
| speed         | flexible | Characters per frame                                 |
| announcements | strict   | Do not add aria-live; announce completion separately |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo StreamingText component (display). Reveals text character by character with a blinking cursor, catching up as a streamed reply grows

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

StreamingText is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-duration-loop-fast

Accessibility: role "none", WCAG 2.2-AA. Keep it AA.

Do not change (strict): announcements — Do not add aria-live; announce completion separately
Flexible: speed.

Do not invent props, tokens, or global viewport media queries.
```
