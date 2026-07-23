# Section

Page-section shell with block padding, centered inner width, and stack gap.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/section
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`layout`

## Props

| Prop    | Type                            | Required | Default     | Description                                           |
| ------- | ------------------------------- | -------- | ----------- | ----------------------------------------------------- |
| `width` | `"content" \| "wide" \| "full"` | no       | `"content"` | Max inline size: content=72rem, wide=90rem, full=none |
| `gap`   | `1\|2\|3\|4\|5\|6\|8\|10\|12`   | no       | `8`         | Stack gap between children (spacing token step)       |

## Examples

### Content section

Centered 72rem content column with 2rem block padding

```tsx
<Section width="content" gap={8}>
  <h2>Heading</h2>
  <p>Body copy.</p>
</Section>
```

## Design tokens

- `--cascivo-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `region`

## Dependencies

- `@cascivo/core`

## Tags

layout, section, page

---

_Generated from registry v0.11.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
