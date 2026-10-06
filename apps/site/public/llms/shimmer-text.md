# ShimmerText

Text with a bright band sweeping through it — the "Thinking…" look for a label that marks work in progress

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add shimmer-text
```

Or use it from the prebuilt package without copying:

```tsx
import { ShimmerText } from '@cascivo/react'
```

## Category

`feedback`

## Props

| Prop       | Type                     | Required | Default | Description                                                                                          |
| ---------- | ------------------------ | -------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `as`       | `'span' \| 'p' \| 'div'` | no       | `span`  | `span` for inline text, `p` for a paragraph, `div` for a block that imposes no semantics of its own. |
| `children` | `ReactNode`              | no       | —       | The label text the shimmer sweeps through.                                                           |

## Examples

### Thinking label

```tsx
<ShimmerText>Thinking…</ShimmerText>
```

### As a paragraph

```tsx
<ShimmerText as="p">Searching 12 documents…</ShimmerText>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-shimmer-text-color`
- `--cascivo-shimmer-text-highlight`
- `--cascivo-color-text-muted`
- `--cascivo-color-ai`
- `--cascivo-duration-loop-slow`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

ai, loading, shimmer, thinking, text, progress

---

_Generated from registry v1.7.0 on 2026-10-06. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
