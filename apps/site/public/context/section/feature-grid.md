# FeatureGrid

**Category:** layout  
**Description:** Feature section — AutoGrid of items with optional title, description, and icon slots. Icons are optional; the grid works text-only. Replace demo content before shipping.

## When to use

- A feature section laying out items in an auto-fitting grid
- Showcasing product capabilities with optional icons and descriptions

## When NOT to use

- A single hero message — use Hero
- A bare responsive grid without section framing — use AutoGrid

## Related components

- **AutoGrid** (contains): Uses an auto-fit grid to lay out feature items
- **Hero** (pairs-with): Often follows the hero on a landing page

## Accessibility rationale

Renders a section with an optional heading grouping the feature items.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `FeatureItem[]` | Yes | — | Array of feature items with title, optional description, icon, and href |
| `title` | `ReactNode` | No | — | Section heading above the grid |
| `description` | `ReactNode` | No | — | Subheading below the section title |
| `headingLevel` | `1 \| 2 \| 3` | No | 2 | Heading level for the section title (items use headingLevel + 1) |
| `min` | `string` | No | "16rem" | Minimum track width forwarded to AutoGrid |

## Tokens

- `--cascivo-text-2xl`
- `--cascivo-text-base`
- `--cascivo-text-sm`
- `--cascivo-font-bold`
- `--cascivo-font-semibold`
- `--cascivo-text-secondary`
- `--cascivo-color-border`
- `--cascivo-surface-subtle`
- `--cascivo-space-*`

## Examples

### Feature grid (text-only)

Four-item text-only feature grid with section heading

```jsx
<FeatureGrid
  title="Built for production"
  description="Everything you need to ship a polished product."
  items={[
    { title: 'Zero config', description: 'Copy a component and it works — no providers, no wrappers.' },
    { title: 'Token-first', description: 'Every color, size and radius is a CSS custom property you own.' },
    { title: 'Signal-driven', description: 'Fine-grained reactivity with @preact/signals-react — zero re-renders.' },
    { title: 'Accessible by default', description: 'WCAG 2.1 AA, keyboard navigable, logical CSS properties for RTL.' },
  ]}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo FeatureGrid component (layout). Feature section — AutoGrid of items with optional title, description, and icon slots. Icons are optional; the grid works text-only. Replace demo content before shipping.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

FeatureGrid is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-text-2xl, --cascivo-text-base, --cascivo-text-sm, --cascivo-font-bold, --cascivo-font-semibold, --cascivo-text-secondary, --cascivo-color-border, --cascivo-surface-subtle, --cascivo-space-*

Accessibility: role "region", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
