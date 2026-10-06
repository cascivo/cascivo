# ShimmerText

**Category:** feedback  
**Description:** Text with a bright band sweeping through it — the "Thinking…" look for a label that marks work in progress

## When to use

- Styling a short label that names work in progress — "Thinking…", "Searching the docs…"
- The trigger or heading of an AI surface while a response is being produced

## When NOT to use

- Announcing status to assistive tech on its own — it is a visual treatment; wrap it in AiStatus or another role="status" region
- Body copy or anything longer than a line — the sweep is meant for a glanceable label
- Placeholder for content whose shape is known — use Skeleton

## Anti-patterns

### The shimmer means "in progress"; leaving it on a finished label tells the reader something is still happening

**Bad:** `<ShimmerText>Done</ShimmerText> left in place after the work finishes`  
**Good:** `Render plain text once the work completes`  
**Why:** The shimmer means "in progress"; leaving it on a finished label tells the reader something is still happening

## Related components

- **AiStatus** (contained-by): AiStatus renders its in-progress label in ShimmerText inside a role="status" region
- **Reasoning** (contained-by): Reasoning shimmers its "Thinking…" trigger while streaming
- **Skeleton** (alternative): Skeleton previews the shape of pending content; ShimmerText styles a label that names the work

## Accessibility rationale

Purely visual: the text stays real text, so it is read normally and never announced on its own. The sweep runs only under prefers-reduced-motion: no-preference (otherwise plain muted text), and forced colours render it as CanvasText. The highlight band is the AI hue, which clears AA on every shipped theme and is never weaker than the muted base it sweeps over, so the sweep never lowers contrast

## Props

| Name       | Type                     | Required | Default | Description                                                                                          |
| ---------- | ------------------------ | -------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `as`       | `'span' \| 'p' \| 'div'` | No       | span    | `span` for inline text, `p` for a paragraph, `div` for a block that imposes no semantics of its own. |
| `children` | `ReactNode`              | No       | —       | The label text the shimmer sweeps through.                                                           |

## Tokens

- `--cascivo-shimmer-text-color`
- `--cascivo-shimmer-text-highlight`
- `--cascivo-color-text-muted`
- `--cascivo-color-ai`
- `--cascivo-duration-loop-slow`

## Examples

### Thinking label

```jsx
<ShimmerText>Thinking…</ShimmerText>
```

### As a paragraph

```jsx
<ShimmerText as="p">Searching 12 documents…</ShimmerText>
```

## Boundaries

| Area    | Level    | Note                                                                                    |
| ------- | -------- | --------------------------------------------------------------------------------------- |
| colours | flexible | Override --cascivo-shimmer-text-color and --cascivo-shimmer-text-highlight per instance |
| motion  | strict   | The sweep must stay inside the reduced-motion opt-in; never animate it unconditionally  |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ShimmerText component (feedback). Text with a bright band sweeping through it — the "Thinking…" look for a label that marks work in progress

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ShimmerText is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-shimmer-text-color, --cascivo-shimmer-text-highlight, --cascivo-color-text-muted, --cascivo-color-ai, --cascivo-duration-loop-slow

Accessibility: role "none", WCAG 2.2-AA. Keep it AA.

Do not change (strict): motion — The sweep must stay inside the reduced-motion opt-in; never animate it unconditionally
Flexible: colours.

Do not invent props, tokens, or global viewport media queries.
```
