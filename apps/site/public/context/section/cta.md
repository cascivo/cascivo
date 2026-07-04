# Cta

**Category:** layout  
**Description:** Call-to-action band — quiet hairline-bordered section with title, description, and centered actions. Replace demo content before shipping.

## When to use

- A call-to-action band with title, description, and centered actions
- Prompting conversion between or after marketing sections

## When NOT to use

- The primary page intro — use Hero
- General content grouping — use Section

## Related components

- **Hero** (pairs-with): Hero opens the page; CTA reinforces conversion later
- **Section** (alternative): Use the plain section for non-CTA content

## Accessibility rationale

Renders a section with a heading and clearly labeled action controls.

## Props

| Name           | Type          | Required | Default | Description                                     |
| -------------- | ------------- | -------- | ------- | ----------------------------------------------- |
| `title`        | `ReactNode`   | Yes      | —       | Primary heading of the CTA band                 |
| `description`  | `ReactNode`   | No       | —       | Supporting text below the title                 |
| `actions`      | `ReactNode`   | No       | —       | Buttons or links centered below the description |
| `headingLevel` | `1 \| 2 \| 3` | No       | 2       | HTML heading level for document outline control |

## Tokens

- `--cascivo-color-border`
- `--cascivo-surface-subtle`
- `--cascivo-text-2xl`
- `--cascivo-text-base`
- `--cascivo-font-bold`
- `--cascivo-text-secondary`
- `--cascivo-space-*`

## Examples

### CTA band

Quiet bordered band with centered heading, description, and action buttons

```jsx
<Cta
  title="Ready to ship?"
  description="Add Cascade to your project in minutes."
  actions={
    <>
      <Button>Get started</Button>
      <Button variant="ghost">View on GitHub</Button>
    </>
  }
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Cta component (layout). Call-to-action band — quiet hairline-bordered section with title, description, and centered actions. Replace demo content before shipping.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Cta is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border, --cascivo-surface-subtle, --cascivo-text-2xl, --cascivo-text-base, --cascivo-font-bold, --cascivo-text-secondary, --cascivo-space-*

Accessibility: role "region", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
