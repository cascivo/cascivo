# PageFooter

**Category:** layout  
**Description:** Site footer — AutoGrid of link groups with a brand/meta bottom row. Renders a <footer> element with a <nav aria-label="Footer"> wrapping the link columns.

## When to use

- A site footer with grouped link columns and a brand/meta bottom row
- Closing marketing or app pages with secondary navigation

## When NOT to use

- Primary top navigation — use AppShell or a header
- A conversion prompt — use Cta

## Related components

- **AutoGrid** (contains): Uses an auto-fit grid to lay out link groups

## Accessibility rationale

Renders a footer element wrapping a labeled Footer navigation region.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `groups` | `FooterGroup[]` | Yes | — | Array of link groups, each with a title and array of {label, href} links |
| `brand` | `ReactNode` | No | — | Brand name or logo shown in the bottom row |
| `meta` | `ReactNode` | No | — | Meta line in the bottom row (license, copyright, etc.) |

## Tokens

- `--cascivo-text-sm`
- `--cascivo-font-mono`
- `--cascivo-font-semibold`
- `--cascivo-text-primary`
- `--cascivo-text-secondary`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-space-*`

## Examples

### Site footer

Three-column footer with brand and license meta

```jsx
<PageFooter
  brand="Cascade"
  meta="MIT licensed. Built with care."
  groups={[
    { title: 'Product', links: [{ label: 'Components', href: '/components' }, { label: 'Charts', href: '/charts' }, { label: 'Layouts', href: '/layouts' }] },
    { title: 'Developers', links: [{ label: 'Docs', href: '/docs' }, { label: 'GitHub', href: 'https://github.com/cascivo/cascivo' }, { label: 'Changelog', href: '/changelog' }] },
    { title: 'Resources', links: [{ label: 'Figma kit', href: '/figma' }, { label: 'Storybook', href: '/storybook' }] },
  ]}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo PageFooter component (layout). Site footer — AutoGrid of link groups with a brand/meta bottom row. Renders a <footer> element with a <nav aria-label="Footer"> wrapping the link columns.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

PageFooter is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-text-sm, --cascivo-font-mono, --cascivo-font-semibold, --cascivo-text-primary, --cascivo-text-secondary, --cascivo-color-border, --cascivo-color-accent, --cascivo-space-*

Accessibility: role "contentinfo", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
