# ChainOfThought

**Category:** display  
**Description:** The steps an AI agent takes — searching, reading, calling tools — each with its status, and optional collapsible detail

## When to use

- Showing the discrete steps an AI agent is taking or took — searches, file reads, tool calls
- Letting a reader expand a step to see what it found, without cluttering the answer

## When NOT to use

- A free-form reasoning trace — use Reasoning
- A user-facing multi-step form or checkout — use Steps
- A dated activity feed — use Timeline
- One tool invocation with its input and output — use ToolCall

## Anti-patterns

### The active step is announced as the current step (aria-current="step"); more than one makes the position meaningless

**Bad:** `Marking several steps active at once to look busy`  
**Good:** `One active step at a time; finished steps become complete or error`  
**Why:** The active step is announced as the current step (aria-current="step"); more than one makes the position meaningless

## Related components

- **Reasoning** (alternative): Reasoning holds unstructured thinking text; ChainOfThought holds discrete steps
- **Timeline** (alternative): Same status vocabulary, for dated events rather than agent steps
- **ToolCall** (pairs-with): A step’s detail can contain the ToolCall for that step
- **AiStatus** (pairs-with): AiStatus announces the overall phase; the chain itself is never a live region

## Accessibility rationale

An ordered list whose active step carries aria-current="step" and whose list is aria-busy while any step is active. Each step speaks its state as visually hidden text after the title, because the marker glyph is decorative. Steps with detail are native <details>/<summary> disclosures (Enter/Space), so they work before hydration. Only the active marker pulses, under prefers-reduced-motion: no-preference; the chain is never a live region — pair it with AiStatus to announce progress

## Props

| Name     | Type                                                                       | Required | Default | Description                                                                                                                                                                                                                                                        |
| -------- | -------------------------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `items`  | `ChainOfThoughtItem[]`                                                     | Yes      | —       | The steps, in order. Each has `id`, `title`, optional `description`, `status` (`pending \| active \| complete \| error`, plus the `current` / `upcoming` aliases), optional `detail` (collapsible content that turns the title into a toggle) and optional `icon`. |
| `labels` | `{ pending?: string; active?: string; complete?: string; error?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n) — the status text a screen reader hears after each step title.                                                                                                                                           |

## Object types

### `ChainOfThoughtItem`

One step in the chain.

| Field         | Type            | Required | Description                                                                                    |
| ------------- | --------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `id`          | `string`        | Yes      | Stable key for the step.                                                                       |
| `title`       | `ReactNode`     | Yes      | What the step does.                                                                            |
| `description` | `ReactNode`     | No       | A secondary line under the title.                                                              |
| `status`      | `ProgressInput` | No       | `pending \| active \| complete \| error` (plus `current` / `upcoming`). Defaults to `pending`. |
| `detail`      | `ReactNode`     | No       | Collapsible content; makes the title a disclosure toggle.                                      |
| `icon`        | `ReactNode`     | No       | Replaces the status glyph in the marker.                                                       |

## Tokens

- `--cascivo-color-ai`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-border`
- `--cascivo-color-success`
- `--cascivo-color-destructive`
- `--cascivo-focus-ring`
- `--cascivo-duration-loop-slow`

## Examples

### Agent steps

```jsx
<ChainOfThought
  items={[
    { id: 'search', title: 'Searched the docs for "refund policy"', status: 'complete' },
    { id: 'read', title: 'Reading 3 pages', status: 'active' },
    { id: 'answer', title: 'Write the answer', status: 'pending' },
  ]}
/>
```

### With collapsible detail

```jsx
<ChainOfThought
  items={[
    {
      id: 'search',
      title: 'Searched the web',
      status: 'complete',
      detail: 'cascivo.com/docs · github.com/cascivo/cascivo · npmjs.com/package/@cascivo/react',
    },
    {
      id: 'fail',
      title: 'Fetch pricing page',
      description: 'The page returned 404.',
      status: 'error',
    },
  ]}
/>
```

## Boundaries

| Area              | Level    | Note                                                             |
| ----------------- | -------- | ---------------------------------------------------------------- |
| step content      | flexible | Titles, descriptions, detail and icons are any ReactNode         |
| status vocabulary | strict   | Use the shared Progress values; do not invent per-chain statuses |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ChainOfThought component (display). The steps an AI agent takes — searching, reading, calling tools — each with its status, and optional collapsible detail

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ChainOfThought is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-ai, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-border, --cascivo-color-success, --cascivo-color-destructive, --cascivo-focus-ring, --cascivo-duration-loop-slow

Accessibility: role "list", WCAG 2.2-AA, keyboard: Tab/Enter/Space. Keep it AA.

Do not change (strict): status vocabulary — Use the shared Progress values; do not invent per-chain statuses
Flexible: step content.

Do not invent props, tokens, or global viewport media queries.
```
