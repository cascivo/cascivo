# MessageActions

**Category:** inputs  
**Description:** The action row under an AI reply — copy, good / bad feedback as toggle buttons, and regenerate

## When to use

- Under each assistant message: copy the reply, rate it, or ask for another attempt

## When NOT to use

- Stopping a response that is still generating — use AiStatus with onStop
- Actions on a non-AI item — use ButtonGroup or a Menu

## Anti-patterns

### A name that changes on press reads as a different control; aria-pressed is how toggle buttons report state

**Bad:** `Swapping the rating button’s label to "Good response recorded"`  
**Good:** `Keep a stable name and expose the choice with aria-pressed; the component announces the confirmation once`  
**Why:** A name that changes on press reads as a different control; aria-pressed is how toggle buttons report state

## Related components

- **CopyButton** (contains): Copy is a CopyButton
- **AiStatus** (pairs-with): AiStatus covers the in-progress phase; MessageActions appears once the reply is complete

## Accessibility rationale

A named group of real buttons. Good and Bad are toggle buttons (aria-pressed), so the chosen rating is exposed as state rather than by a changing label, and choosing one announces "Thanks for your feedback" once through the shared announce() region. Icon buttons carry accessible names and meet the coarse-pointer target size

## Props

| Name               | Type                                                                                      | Required | Default | Description                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `copyValue`        | `string`                                                                                  | No       | —       | The text the Copy button copies. Omit to hide Copy.                                                                                                                |
| `feedback`         | `'good' \| 'bad' \| null`                                                                 | No       | —       | Controlled rating: `good`, `bad` or `null`. Pressing the active rating again clears it.                                                                            |
| `defaultFeedback`  | `'good' \| 'bad' \| null`                                                                 | No       | null    | Initial rating when uncontrolled.                                                                                                                                  |
| `onFeedbackChange` | `(feedback: 'good' \| 'bad' \| null) => void`                                             | No       | —       | Called with the new rating (or `null` when cleared). The rating buttons render when this or `feedback` is set; a rating also announces "Thanks for your feedback". |
| `onRegenerate`     | `() => void`                                                                              | No       | —       | Called by the Regenerate button. Omit to hide it.                                                                                                                  |
| `labels`           | `{ group?: string; good?: string; bad?: string; regenerate?: string; recorded?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n).                                                                                                         |

## Tokens

- `--cascivo-color-text-muted`
- `--cascivo-color-ai`
- `--cascivo-color-ai-subtle`

## Examples

### Copy, rate and regenerate

```jsx
<MessageActions
  copyValue="Refunds are available for 30 days."
  onFeedbackChange={() => {}}
  onRegenerate={() => {}}
/>
```

### Copy only

```jsx
<MessageActions copyValue="Hello" />
```

## Boundaries

| Area             | Level    | Note                                                                  |
| ---------------- | -------- | --------------------------------------------------------------------- |
| which actions    | flexible | Each action renders only when its prop is set                         |
| rating semantics | strict   | Two-state good / bad toggles; do not repurpose them for other choices |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo MessageActions component (inputs). The action row under an AI reply — copy, good / bad feedback as toggle buttons, and regenerate

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

MessageActions is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-text-muted, --cascivo-color-ai, --cascivo-color-ai-subtle

Accessibility: role "group", WCAG 2.2-AA, keyboard: Tab/Enter/Space. Keep it AA.

Do not change (strict): rating semantics — Two-state good / bad toggles; do not repurpose them for other choices
Flexible: which actions.

Do not invent props, tokens, or global viewport media queries.
```
