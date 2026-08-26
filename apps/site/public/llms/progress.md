# Progress

Horizontal bar showing the completion progress of a tracked operation

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add progress
```

Or use it from the prebuilt package without copying:

```tsx
import { Progress } from '@cascivo/react'
```

## Category

`feedback`

## Variants

- `primary`
- `info`
- `success`
- `warning`
- `error`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `determinate`
- `indeterminate`

## Props

| Prop               | Type                                                       | Required | Default   | Description                                                                                                                                                            |
| ------------------ | ---------------------------------------------------------- | -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`            | `string`                                                   | no       | —         | Alias of `ariaLabel` — the same invisible accessible name under the other spelling. Neither is deprecated. Not rendered — screen readers only.                         |
| `ariaLabel`        | `string`                                                   | no       | —         | Invisible accessible name. The catalog convention; the DOM spelling `aria-label` is accepted as an alias so either guess compiles. Not rendered — screen readers only. |
| `aria-label`       | `string`                                                   | no       | —         | Accessible label when no visible label is present.                                                                                                                     |
| `aria-describedby` | `string`                                                   | no       | —         | Id of an element describing the progress bar.                                                                                                                          |
| `value`            | `number`                                                   | no       | —         | 0–100. Omit for indeterminate state.                                                                                                                                   |
| `variant`          | `'primary' \| 'info' \| 'success' \| 'warning' \| 'error'` | no       | `primary` | Colour of the fill: `primary` (the accent) or a severity tone — `info`, `success`, `warning`, `error`.                                                                 |
| `size`             | `'sm' \| 'md' \| 'lg'`                                     | no       | `md`      | Visual size of the component (e.g. 'sm', 'md', 'lg').                                                                                                                  |

## Examples

### Determinate

```tsx
<Progress value={65} />
```

### Indeterminate

```tsx
<Progress aria-label="Loading…" />
```

### Success variant

```tsx
<Progress value={100} variant="success" />
```

### Small

```tsx
<Progress value={40} size="sm" />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-surface-2`
- `--cascivo-color-primary`
- `--cascivo-color-info`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-error`
- `--cascivo-color-accent`
- `--cascivo-radius-full`
- `--cascivo-ease-out`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `progressbar`

## Tags

progress, loading, upload, bar

---

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
