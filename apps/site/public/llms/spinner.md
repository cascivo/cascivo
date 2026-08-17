# Spinner

Indeterminate loading indicator

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add spinner
```

Or use it from the prebuilt package without copying:

```tsx
import { Spinner } from '@cascivo/react'
```

## Category

`feedback`

## Sizes

- `sm`
- `md`
- `lg`

## Props

| Prop    | Type                   | Required | Default   | Description                                           |
| ------- | ---------------------- | -------- | --------- | ----------------------------------------------------- |
| `size`  | `'sm' \| 'md' \| 'lg'` | no       | `md`      | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `label` | `string`               | no       | `Loading` | Accessible label announced by screen readers          |

## Examples

### Default

```tsx
<Spinner />
```

### Large

```tsx
<Spinner size="lg" />
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `status`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

loading, progress, feedback

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
