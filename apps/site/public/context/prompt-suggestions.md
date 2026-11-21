# PromptSuggestions

**Category:** inputs  
**Description:** Starter prompts as a wrap of pill buttons — the "Try asking…" row of an empty AI chat

## When to use

- An empty conversation: offer a few concrete things to ask
- Follow-up suggestions under an assistant reply

## When NOT to use

- Filtering or selecting values — use ToggleGroup, Tag or SegmentedControl
- Autocomplete while typing — use Combobox

## Anti-patterns

### Specific starters show what the assistant can actually do; a long generic list is skipped

**Bad:** `Ten generic prompts ("Ask me anything")`  
**Good:** `Three or four specific, tappable prompts`  
**Why:** Specific starters show what the assistant can actually do; a long generic list is skipped

## Related components

- **MessageActions** (pairs-with): Both sit around an assistant message
- **Tag** (alternative): Tag is for labels and filters, not for sending a prompt

## Accessibility rationale

A named group of real buttons whose names are the prompt text, operable with Tab and Enter/Space. Pills meet the coarse-pointer target size and keep a visible focus ring

## Props

| Name       | Type                      | Required | Default | Description                                                                                             |
| ---------- | ------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `items`    | `string[]`                | Yes      | —       | The prompts, as the exact text each one sends.                                                          |
| `onSelect` | `(value: string) => void` | Yes      | —       | Called with the chosen prompt — send it, or put it in the composer.                                     |
| `labels`   | `{ group?: string }`      | No       | —       | Overrides for the component’s user-visible strings (i18n) — `group` names the group for screen readers. |

## Tokens

- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-color-ai-border`
- `--cascivo-color-ai-subtle`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Examples

### Starter prompts

```jsx
<PromptSuggestions
  items={['Summarise this week’s tickets', 'Draft a release note', 'What changed in v2?']}
  onSelect={() => {}}
/>
```

## Boundaries

| Area                | Level    | Note                                                                   |
| ------------------- | -------- | ---------------------------------------------------------------------- |
| what selecting does | flexible | Send immediately, or fill the composer                                 |
| item text           | strict   | The visible text is the prompt; do not show one thing and send another |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo PromptSuggestions component (inputs). Starter prompts as a wrap of pill buttons — the "Try asking…" row of an empty AI chat

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

PromptSuggestions is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border, --cascivo-color-surface, --cascivo-color-ai-border, --cascivo-color-ai-subtle, --cascivo-radius-full, --cascivo-focus-ring

Accessibility: role "group", WCAG 2.2-AA, keyboard: Tab/Enter/Space. Keep it AA.

Do not change (strict): item text — The visible text is the prompt; do not show one thing and send another
Flexible: what selecting does.

Do not invent props, tokens, or global viewport media queries.
```
