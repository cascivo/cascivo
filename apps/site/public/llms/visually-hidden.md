# VisuallyHidden

Hides content visually while keeping it available to screen readers

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add visually-hidden
```

Or use it from the prebuilt package without copying:

```tsx
import { VisuallyHidden } from '@cascivo/react'
```

## Category

`display`

## Props

| Prop       | Type        | Required | Default | Description                                               |
| ---------- | ----------- | -------- | ------- | --------------------------------------------------------- |
| `children` | `ReactNode` | yes      | —       | Content announced by assistive technology but not painted |

## Examples

### Icon button label

Gives an icon-only control an accessible name

```tsx
<button type="button">
  <CloseIcon />
  <VisuallyHidden>Close dialog</VisuallyHidden>
</button>
```

### Table context

```tsx
<th>
  Price <VisuallyHidden>(in euros)</VisuallyHidden>
</th>
```

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

accessibility, screen-reader, sr-only, hidden

---

_Generated from registry v0.7.1 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
