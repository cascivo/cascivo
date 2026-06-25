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

| Prop         | Type              | Required | Default   | Description |
| ------------ | ----------------- | -------- | --------- | ----------- | -------- | --- | --------- | --- |
| `value`      | `number`          | yes      | —         | —           |
| `size`       | `'sm'             | 'md'     | 'lg'`     | no          | `md`     | —   |
| `variant`    | `'primary'        | 'info'   | 'success' | 'warning'   | 'error'` | no  | `primary` | —   |
| `children`   | `React.ReactNode` | no       | —         | —           |
| `aria-label` | `string`          | no       | —         | —           |
| `className`  | `string`          | no       | —         | —           |

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
