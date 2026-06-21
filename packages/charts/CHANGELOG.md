# @cascivo/charts

## 0.2.0

### Minor Changes

- 30b0f20: Publish `@cascivo/charts` to npm. The package was previously private and
  source-only; it now builds to `dist/` (ESM + flat `.d.ts` + `charts.css`) with a
  proper export map (`@cascivo/charts` and `@cascivo/charts/styles.css`), so
  `pnpm add @cascivo/charts` works. Ships token-themed `LineChart`, `AreaChart`,
  `BarChart`, `Sparkline`, and the rest of the chart set the registry already
  pointed at.

### Patch Changes

- 72d0086: New location
- Updated dependencies [72d0086]
  - @cascivo/core@0.1.2
  - @cascivo/i18n@0.1.2
