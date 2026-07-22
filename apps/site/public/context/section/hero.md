# Hero

**Category:** layout  
**Description:** Page hero section — centered or split layout with eyebrow, title, description, actions and media slots. Replace demo content before shipping.

## When to use

- The primary page intro with eyebrow, title, description, actions, and media
- Landing-page tops in centered or split layout

## When NOT to use

- An application page top — use PageHeader
- A mid-page conversion prompt — use Cta

## Related components

- **PageHeader** (alternative): Use for app pages rather than marketing landings
- **Cta** (pairs-with): Reinforce the hero with a CTA band later on the page

## Accessibility rationale

Renders a section with the page-level heading as its primary landmark.

## Props

| Name           | Type                    | Required | Default    | Description                                                     |
| -------------- | ----------------------- | -------- | ---------- | --------------------------------------------------------------- |
| `variant`      | `"centered" \| "split"` | No       | "centered" | Layout variant: centered (single column) or split (two columns) |
| `title`        | `ReactNode`             | Yes      | —          | Primary heading content                                         |
| `eyebrow`      | `ReactNode`             | No       | —          | Small monospace label above the title                           |
| `description`  | `ReactNode`             | No       | —          | Supporting paragraph below the title                            |
| `actions`      | `ReactNode`             | No       | —          | Buttons or links rendered in a row below the description        |
| `media`        | `ReactNode`             | No       | —          | Right-hand slot in the split variant (image, demo, code block)  |
| `headingLevel` | `1 \| 2 \| 3`           | No       | 1          | HTML heading level for document outline control                 |

## Tokens

- `--cascivo-text-4xl`
- `--cascivo-text-lg`
- `--cascivo-text-sm`
- `--cascivo-font-mono`
- `--cascivo-font-bold`
- `--cascivo-text-secondary`
- `--cascivo-space-*`

## Examples

### Centered hero

Single-column hero with eyebrow, headline, description, and CTA buttons

```jsx
<Hero
  eyebrow="v8 — Assembly Included"
  title="Ship the dashboard your ops team deserves"
  description="Cascade gives you charts, layouts and sections — fully composed, copy-paste ready."
  actions={
    <>
      <Button>Get started</Button>
      <Button variant="ghost">View docs</Button>
    </>
  }
/>
```

### Split hero

Two-column layout with copy on the left and media on the right

```jsx
<Hero
  variant="split"
  title="Signal-driven, CSS-native"
  description="Fine-grained reactivity with zero re-renders. Beautiful by default."
  actions={<Button>Start building</Button>}
  media={<img src="/preview.png" alt="Dashboard preview" />}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Hero component (layout). Page hero section — centered or split layout with eyebrow, title, description, actions and media slots. Replace demo content before shipping.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Hero is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-text-4xl, --cascivo-text-lg, --cascivo-text-sm, --cascivo-font-mono, --cascivo-font-bold, --cascivo-text-secondary, --cascivo-space-*

Accessibility: role "region", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
