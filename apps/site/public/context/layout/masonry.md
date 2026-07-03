# Masonry

**Category:** layout  
**Description:** Masonry layout — native CSS masonry where supported, multi-column fallback elsewhere (fallback orders items top-to-bottom per column).

## When to use

- Galleries of variable-height items packed into balanced columns
- Pinterest-style image or card walls

## When NOT to use

- Items that must align in rows — use Grid
- Uniform-height cards — use AutoGrid

## Related components

- **AutoGrid** (alternative): Use when items are uniform height and should align in rows
- **MediaMasonry** (alternative): Use the section-level masonry for full-width media galleries

## Accessibility rationale

Pure layout primitive with no semantic role; does not affect the accessibility tree.

## Props

| Name   | Type     | Required | Default | Description       |
| ------ | -------- | -------- | ------- | ----------------- | --- | --- | --- | --- | --- | --- | --- | ------------------ |
| `cols` | `number` | No       | 3       | Number of columns |
| `gap`  | `1       | 2        | 3       | 4                 | 5   | 6   | 8   | 10  | 12` | No  | 4   | Spacing token step |

## Tokens

- `--cascivo-space-*`

## Examples

### Masonry gallery

Variable-height cards laid out in a masonry pattern; falls back to CSS columns

```jsx
<Masonry cols={3} gap={4}>
  {items.map((item) => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</Masonry>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Masonry component (layout). Masonry layout — native CSS masonry where supported, multi-column fallback elsewhere (fallback orders items top-to-bottom per column).

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Masonry is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-*

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
