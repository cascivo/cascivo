# Reasoning

**Category:** display  
**Description:** Collapsible panel for a model’s reasoning — opens and shimmers "Thinking…" while it streams, then settles to "Thought for N seconds"

## When to use

- Showing a model’s reasoning or thinking trace above its answer, collapsed once the answer arrives
- Giving readers an opt-in look at how an AI reached a result without cluttering the reply

## When NOT to use

- General show/hide content — use Collapsible or Accordion
- A sequence of discrete agent steps with their own status — use Steps or Timeline
- Reporting the phase of a request — use AiStatus

## Anti-patterns

### Announcing every token of a reasoning trace drowns out everything else

**Bad:** `Wrapping the reasoning text in aria-live so it is read as it streams`  
**Good:** `<Reasoning streaming> — the content is aria-busy and silent; pair it with AiStatus for the phase`  
**Why:** Announcing every token of a reasoning trace drowns out everything else

## Related components

- **ShimmerText** (contains): The streaming trigger label is ShimmerText
- **AiStatus** (pairs-with): AiStatus announces the phase while Reasoning holds the trace
- **Collapsible** (alternative): Collapsible is the general-purpose disclosure

## Accessibility rationale

Built on native <details>/<summary>, so the trigger is a keyboard-operable disclosure (Enter/Space) with its expanded state exposed by the browser, it works before hydration, and find-in-page can open it. The content carries aria-busy while streaming and is never a live region; the sparkle is decorative and pulses only under prefers-reduced-motion: no-preference

## Props

| Name        | Type                                                         | Required | Default | Description                                                                                                                                              |
| ----------- | ------------------------------------------------------------ | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `ReactNode`                                                  | Yes      | —       | The reasoning text or steps.                                                                                                                             |
| `streaming` | `boolean`                                                    | No       | false   | True while reasoning is still arriving: the panel opens, the trigger shimmers "Thinking…" and the content is aria-busy. Turning it off closes the panel. |
| `duration`  | `number`                                                     | No       | —       | Seconds spent reasoning. Once streaming ends the trigger reads "Thought for {duration} seconds"; without it, "Reasoning". The caller owns the clock.     |
| `label`     | `ReactNode`                                                  | No       | —       | Replaces the trigger text in every state. Rendered on screen.                                                                                            |
| `labels`    | `{ thinking?: string; thoughtFor?: string; label?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n). `thoughtFor` may contain `{count}`.                                                           |

## Tokens

- `--cascivo-color-ai`
- `--cascivo-color-ai-border`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-focus-ring`
- `--cascivo-duration-200`
- `--cascivo-duration-loop-slow`

## Examples

### Streaming

```jsx
<Reasoning streaming>The user wants a summary, so I will start with the totals…</Reasoning>
```

### Settled

```jsx
<Reasoning duration={12}>
  The user wants a summary, so I started with the totals and then compared regions.
</Reasoning>
```

## Boundaries

| Area           | Level    | Note                                                                                               |
| -------------- | -------- | -------------------------------------------------------------------------------------------------- |
| trigger text   | flexible | Override with label, or localise each state through labels                                         |
| open behaviour | strict   | Opens when streaming starts and closes when it ends; do not force it open after the answer arrives |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Reasoning component (display). Collapsible panel for a model’s reasoning — opens and shimmers "Thinking…" while it streams, then settles to "Thought for N seconds"

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Reasoning is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-ai, --cascivo-color-ai-border, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-focus-ring, --cascivo-duration-200, --cascivo-duration-loop-slow

Accessibility: role "button", WCAG 2.2-AA, keyboard: Enter/Space. Keep it AA.

Do not change (strict): open behaviour — Opens when streaming starts and closes when it ends; do not force it open after the answer arrives
Flexible: trigger text.

Do not invent props, tokens, or global viewport media queries.
```
