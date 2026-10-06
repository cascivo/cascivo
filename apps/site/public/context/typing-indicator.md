# TypingIndicator

**Category:** feedback  
**Description:** Three bouncing dots that hold a chat message slot while an assistant (or a person) is composing a reply

## When to use

- Holding the place of an assistant reply between sending a prompt and the first token arriving
- Showing that another participant in a conversation is composing a message

## When NOT to use

- Naming what the AI is doing ("Searching…", "Generating…") or offering Stop — use AiStatus
- Once text has started streaming — render the text; the dots mean nothing has arrived yet
- Non-conversational loading — use Spinner or Skeleton

## Anti-patterns

### Two progress signals at once compete, and the status region would keep claiming nothing has been written

**Bad:** `Keeping TypingIndicator below a reply that is already streaming`  
**Good:** `Swap TypingIndicator for the message content when the first token arrives`  
**Why:** Two progress signals at once compete, and the status region would keep claiming nothing has been written

## Related components

- **ChatBubble** (contained-by): Rendered as the content of a pending assistant ChatBubble
- **AiStatus** (alternative): AiStatus names the phase (thinking / generating) and can offer a Stop button
- **Spinner** (alternative): Spinner suits loading outside a conversation

## Accessibility rationale

role="status" with an accessible name ("Assistant is typing") is announced once when the indicator mounts; the dots are aria-hidden. They bounce only under prefers-reduced-motion: no-preference and otherwise rest as a static ellipsis; forced colours paint them CanvasText

## Props

| Name        | Type     | Required | Default             | Description                                                                                                           |
| ----------- | -------- | -------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | `string` | No       | Assistant is typing | Accessible name announced by the status region. Not rendered — screen readers only.                                   |
| `label`     | `string` | No       | —                   | Alias of `ariaLabel` — the same invisible accessible name. Neither is deprecated. Not rendered — screen readers only. |

## Tokens

- `--cascivo-typing-indicator-color`
- `--cascivo-color-text-muted`
- `--cascivo-radius-full`
- `--cascivo-space-1`
- `--cascivo-space-2`
- `--cascivo-duration-loop-fast`
- `--cascivo-ease-in-out`

## Examples

### Default

```jsx
<TypingIndicator />
```

### In a chat bubble

```jsx
<ChatBubble name="Assistant">
  <TypingIndicator />
</ChatBubble>
```

### A person typing

```jsx
<TypingIndicator ariaLabel="Ada is typing" />
```

## Boundaries

| Area            | Level    | Note                                                                      |
| --------------- | -------- | ------------------------------------------------------------------------- |
| colour          | flexible | Override --cascivo-typing-indicator-color (defaults to muted text)        |
| accessible name | strict   | Keep the status name — the dots alone carry no meaning for assistive tech |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo TypingIndicator component (feedback). Three bouncing dots that hold a chat message slot while an assistant (or a person) is composing a reply

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

TypingIndicator is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-typing-indicator-color, --cascivo-color-text-muted, --cascivo-radius-full, --cascivo-space-1, --cascivo-space-2, --cascivo-duration-loop-fast, --cascivo-ease-in-out

Accessibility: role "status", WCAG 2.2-AA. Keep it AA.

Do not change (strict): accessible name — Keep the status name — the dots alone carry no meaning for assistive tech
Flexible: colour.

Do not invent props, tokens, or global viewport media queries.
```
