# RadialProgress

Circular progress indicator using conic-gradient, with percentage label and variant colors

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add radial-progress
```

Or use it from the prebuilt package without copying:

```tsx
import { RadialProgress } from '@cascivo/react'
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

## Props

| Prop         | Type                                                       | Required | Default   | Description                                                                                                                                       |
| ------------ | ---------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`      | `string`                                                   | no       | —         | Alias of `ariaLabel` — the same invisible accessible name under the other spelling. Neither is deprecated. Not rendered — screen readers only.    |
| `ariaLabel`  | `string`                                                   | no       | —         | Invisible accessible name. The catalog convention; `aria-label` is accepted as an alias for the DOM spelling. Not rendered — screen readers only. |
| `value`      | `number`                                                   | yes      | —         | The controlled value.                                                                                                                             |
| `size`       | `'sm' \| 'md' \| 'lg'`                                     | no       | `md`      | Visual size of the component (e.g. 'sm', 'md', 'lg').                                                                                             |
| `variant`    | `'primary' \| 'info' \| 'success' \| 'warning' \| 'error'` | no       | `primary` | Colour of the ring: `primary` (the accent) or a severity tone — `info`, `success`, `warning`, `error`.                                            |
| `children`   | `React.ReactNode`                                          | no       | —         | Content rendered inside the component.                                                                                                            |
| `aria-label` | `string`                                                   | no       | —         | Accessible label used when no visible label is present.                                                                                           |
| `className`  | `string`                                                   | no       | —         | Additional CSS class names merged onto the root element.                                                                                          |

## Examples

### Default

Primary color, md size, auto percentage label

```tsx
<RadialProgress value={72} />
```

### Success large

Completed state with success color at large size

```tsx
<RadialProgress value={100} size="lg" variant="success" />
```

### Custom label

Override the default percentage label with custom content

```tsx
<RadialProgress value={45} variant="warning">
  45 GB
</RadialProgress>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-primary`
- `--cascivo-color-info`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-error`
- `--cascivo-color-surface`
- `--cascivo-color-surface-2`
- `--cascivo-color-text`
- `--cascivo-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `progressbar`

## Tags

progress, circular, gauge, meter, kpi, dashboard

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
