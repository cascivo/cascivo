Accessible, signal-driven chart library for cascivo — AreaChart, BarChart, LineChart, Sparkline, Heatmap, and more. All charts are keyboard-navigable with `aria-live` tooltips. CVD-safe palettes (Okabe-Ito, oklch) verified in CI across all 14 themes.

## Install

```sh
pnpm add @cascivo/charts @preact/signals-react
```

`react`, `react-dom`, and `@preact/signals-react` are peer dependencies — install them in your app.

## Usage

```tsx
import { AreaChart, BarChart, LineChart, Sparkline } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — maps to the dist `charts.css`
import '@cascivo/themes/dark.css' // any cascivo theme drives the chart colors

export function Traffic() {
  return (
    <LineChart
      data={[
        { x: 0, y: 12 },
        { x: 1, y: 28 },
        { x: 2, y: 19 },
      ]}
    />
  )
}
```

Charts are CSS-token-themed: drop them inside any element carrying a `data-theme` (or import a
theme stylesheet) and they pick up the same palette, radii, and typography as the rest of cascivo.

### React apps must subscribe to signals

The charts are signal-driven. In a plain React app (no Babel signals transform), call `useSignals()`
from `@cascivo/core` as the first statement of any component that reads a signal during render. The
docs app (Preact) does not need this.
