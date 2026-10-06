# Sources

**Category:** display  
**Description:** Collapsible, numbered list of the sources an AI answer drew on — "Used 3 sources" — whose numbers match InlineCitation

## When to use

- Listing what an AI answer was based on, below the answer
- Giving numbered targets for the InlineCitation markers inside the answer

## When NOT to use

- Ordinary navigation links — use List or Link
- An agent’s process (searched, read, wrote) — use ChainOfThought

## Anti-patterns

### A model can emit javascript: or data: URLs; linking them is script injection

**Bad:** `Rendering model-supplied URLs straight into href`  
**Good:** `Pass them to Sources / InlineCitation, which only link absolute http(s) URLs`  
**Why:** A model can emit javascript: or data: URLs; linking them is script injection

## Related components

- **InlineCitation** (pairs-with): InlineCitation numbers in the text point at the same rows
- **AiBadge** (pairs-with): AiBadge marks the answer as AI-generated; Sources says what it rests on

## Accessibility rationale

A native <details>/<summary> disclosure (Enter/Space) whose summary states the count ("Used 3 sources"), so it works before hydration and find-in-page can open it. The list is an <ol>, so each source is announced with its number, matching the InlineCitation markers. Refused URLs render as plain text, never as a link that does nothing

## Props

| Name     | Type                   | Required | Default | Description                                                                                                                                                                         |
| -------- | ---------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`  | `AiSource[]`           | Yes      | —       | The sources, in citation order. Each has `title`, `url` and an optional `description`. Only absolute http(s) URLs become links; anything else (e.g. `javascript:`) renders as text. |
| `labels` | `{ summary?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n). `summary` may contain `{count}`.                                                                                         |

## Object types

### `AiSource`

One source an answer cites.

| Field         | Type        | Required | Description                                                                  |
| ------------- | ----------- | -------- | ---------------------------------------------------------------------------- |
| `title`       | `string`    | Yes      | The source’s title.                                                          |
| `url`         | `string`    | Yes      | Where it lives. Treated as untrusted: only absolute http(s) URLs are linked. |
| `description` | `ReactNode` | No       | An excerpt or note shown under the title.                                    |

## Tokens

- `--cascivo-link-color`
- `--cascivo-color-accent-text`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-focus-ring`

## Examples

### Answer sources

```jsx
<Sources
  items={[
    { title: 'Refund policy', url: 'https://example.com/refunds' },
    {
      title: 'Terms of service',
      url: 'https://example.com/terms',
      description: '§4 covers cancellations.',
    },
  ]}
/>
```

## Boundaries

| Area         | Level    | Note                                                   |
| ------------ | -------- | ------------------------------------------------------ |
| summary text | flexible | Localise or reword via labels.summary (with {count})   |
| URL handling | strict   | Do not bypass sourceHref() — model output is untrusted |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Sources component (display). Collapsible, numbered list of the sources an AI answer drew on — "Used 3 sources" — whose numbers match InlineCitation

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Sources is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-link-color, --cascivo-color-accent-text, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-focus-ring

Accessibility: role "button", WCAG 2.2-AA, keyboard: Enter/Space. Keep it AA.

Do not change (strict): URL handling — Do not bypass sourceHref() — model output is untrusted
Flexible: summary text.

Do not invent props, tokens, or global viewport media queries.
```
