# MediaMasonry

**Category:** layout  
**Description:** Masonry gallery section — native CSS masonry where supported, multi-column fallback elsewhere (fallback orders tiles top-to-bottom per column). Tiles style themselves; section provides only the layout shell.

## When to use

- A full-width media gallery section with masonry packing
- Showcasing images or media tiles of varying heights

## When NOT to use

- A bare masonry primitive without section framing — use Masonry
- Uniform-height cards in rows — use AutoGrid

## Related components

- **Masonry** (contains): Uses the masonry primitive for tile packing

## Accessibility rationale

Renders a section shell; tiles supply their own accessible content.

## Props

| Name           | Type                          | Required | Default | Description                                                               |
| -------------- | ----------------------------- | -------- | ------- | ------------------------------------------------------------------------- |
| `children`     | `ReactNode`                   | Yes      | —       | Tile elements (images, cards, quotes) — consumer-provided and self-styled |
| `title`        | `ReactNode`                   | No       | —       | Section heading above the gallery                                         |
| `description`  | `ReactNode`                   | No       | —       | Subheading below the section title                                        |
| `headingLevel` | `1 \| 2 \| 3`                 | No       | 2       | HTML heading level for the section title                                  |
| `cols`         | `number`                      | No       | 3       | Number of masonry columns                                                 |
| `gap`          | `1\|2\|3\|4\|5\|6\|8\|10\|12` | No       | 4       | Gap between tiles (spacing token step)                                    |

## Tokens

- `--cascivo-text-2xl`
- `--cascivo-text-base`
- `--cascivo-font-bold`
- `--cascivo-text-secondary`
- `--cascivo-space-*`

## Examples

### Media gallery

Masonry gallery with three image tiles; falls back to CSS columns in unsupported browsers

```jsx
<MediaMasonry title="Customer stories" cols={3} gap={4}>
  <img src="/photo-1.jpg" alt="Team at desk" />
  <img src="/photo-2.jpg" alt="Product screenshot" />
  <img src="/photo-3.jpg" alt="Dashboard view" />
</MediaMasonry>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo MediaMasonry component (layout). Masonry gallery section — native CSS masonry where supported, multi-column fallback elsewhere (fallback orders tiles top-to-bottom per column). Tiles style themselves; section provides only the layout shell.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

MediaMasonry is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-text-2xl, --cascivo-text-base, --cascivo-font-bold, --cascivo-text-secondary, --cascivo-space-*

Accessibility: role "region", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
