# AiStatus

**Category:** feedback  
**Description:** Announces what an AI is doing — thinking, generating, done, failed or stopped — with a shimmering label and an optional Stop button

## When to use

- Telling the reader an AI request is in flight, and which phase it is in (thinking before output, generating while it streams)
- Offering a keyboard-reachable Stop while a response is being produced
- Reporting the terminal outcome of a generation — done, failed or stopped

## When NOT to use

- Non-AI async work such as saving a form — use InlineLoading
- Holding the place of a chat reply with no text — use TypingIndicator
- Determinate progress with a known percentage — use ProgressBar

## Anti-patterns

### A live region on streaming text re-announces on every token; AiStatus announces each phase change once

**Bad:** `aria-live on the streaming response text`  
**Good:** `<AiStatus status={phase} /> beside the response, which renders silently`  
**Why:** A live region on streaming text re-announces on every token; AiStatus announces each phase change once

### A loader that blinks on and off reads as a glitch and makes a screen reader announce noise

**Bad:** `Showing AiStatus for a response that arrives in under a second`  
**Good:** `Delay mounting it ~1s so fast responses never flash a loader`  
**Why:** A loader that blinks on and off reads as a glitch and makes a screen reader announce noise

## Related components

- **ShimmerText** (contains): The in-progress label is rendered in ShimmerText
- **InlineLoading** (alternative): InlineLoading is the neutral, non-AI save/submit status
- **TypingIndicator** (alternative): TypingIndicator is the wordless placeholder inside a chat bubble
- **Reasoning** (pairs-with): Reasoning shows the model’s thinking while AiStatus reports the phase

## Accessibility rationale

The label lives in a role="status" node holding one stable string per phase, so each phase change is announced once and token-level streaming never is. The glyph is aria-hidden and only it pulses (under prefers-reduced-motion: no-preference), so the label never drops below contrast. Stop is a real button outside the status node, so pressing it does not re-announce; forced colours render everything CanvasText

## Props

| Name     | Type                                                                                                             | Required | Default | Description                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status` | `'thinking' \| 'generating' \| 'complete' \| 'error' \| 'stopped'`                                               | Yes      | —       | The phase: `thinking` (working, nothing produced yet), `generating` (output is streaming), `complete`, `error`, or `stopped` (the reader pressed Stop). |
| `label`  | `ReactNode`                                                                                                      | No       | —       | Replaces the default text for the current status, e.g. "Searching 12 documents…". Rendered on screen.                                                   |
| `labels` | `{ thinking?: string; generating?: string; complete?: string; error?: string; stopped?: string; stop?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n).                                                                                              |
| `onStop` | `() => void`                                                                                                     | No       | —       | Called when the reader presses Stop. When set, a Stop button renders while the status is `thinking` or `generating`.                                    |

## Tokens

- `--cascivo-color-ai`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-success`
- `--cascivo-color-destructive`
- `--cascivo-duration-loop-slow`

## Examples

### Thinking

```jsx
<AiStatus status="thinking" />
```

### Generating, with Stop

```jsx
<AiStatus status="generating" onStop={() => {}} />
```

### Custom label

```jsx
<AiStatus status="thinking" label="Searching 12 documents…" />
```

### Complete

```jsx
<AiStatus status="complete" />
```

### Error

```jsx
<AiStatus status="error" />
```

## Boundaries

| Area             | Level    | Note                                                                                                            |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| label            | flexible | Defaults per status come from the i18n catalog; override with label or the labels map                           |
| status semantics | strict   | thinking/generating are in progress (sparkle + shimmer); complete/error/stopped are terminal — do not repurpose |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo AiStatus component (feedback). Announces what an AI is doing — thinking, generating, done, failed or stopped — with a shimmering label and an optional Stop button

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

AiStatus is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-ai, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-success, --cascivo-color-destructive, --cascivo-duration-loop-slow

Accessibility: role "status", WCAG 2.2-AA, keyboard: Tab/Enter/Space. Keep it AA.

Do not change (strict): status semantics — thinking/generating are in progress (sparkle + shimmer); complete/error/stopped are terminal — do not repurpose
Flexible: label.

Do not invent props, tokens, or global viewport media queries.
```
