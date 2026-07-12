# Funnel

Vertical conversion funnel — each stage is a trapezoid narrowing toward the next, with optional conversion labels.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Funnel } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop             | Type            | Required | Default | Description                                                |
| ---------------- | --------------- | -------- | ------- | ---------------------------------------------------------- |
| `data`           | `FunnelStage[]` | yes      | —       | Ordered stages (descending): { id, label, value, color? }. |
| `title`          | `string`        | yes      | —       | Chart title (also used as aria-label).                     |
| `description`    | `string`        | no       | —       | Subtitle below the title.                                  |
| `width`          | `number`        | no       | —       | Width of the component.                                    |
| `height`         | `number`        | no       | `320`   | Height of the component.                                   |
| `showConversion` | `boolean`       | no       | `false` | Append each stage’s % of the first stage to its label.     |
| `tooltip`        | `boolean`       | no       | —       | Enable hover tooltip.                                      |
| `className`      | `string`        | no       | —       | Additional CSS class names merged onto the root element.   |
| `plain`          | `boolean`       | no       | `false` | Marks only — no labels. For micro/inline charts.           |

## Examples

### Signup conversion funnel

```tsx
import { Funnel } from '@cascivo/charts'
;<Funnel
  title="Signup funnel"
  showConversion
  data={[
    { id: 'visit', label: 'Visited', value: 8200 },
    { id: 'signup', label: 'Signed up', value: 3100 },
    { id: 'active', label: 'Activated', value: 1400 },
    { id: 'paid', label: 'Paid', value: 520 },
  ]}
/>
```

## Design tokens

- `--cascivo-chart-1`
- `--cascivo-chart-2`
- `--cascivo-chart-3`
- `--cascivo-chart-4`
- `--cascivo-chart-5`
- `--cascivo-chart-6`
- `--cascivo-chart-7`
- `--cascivo-chart-8`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate stages), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, funnel, conversion, flow, data-viz
