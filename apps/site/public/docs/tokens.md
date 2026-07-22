<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/tokens.md
  registry v0.9.0 · generated 2026-07-22
-->

# cascivo Design Tokens

> **Generated** from `packages/tokens/src/index.css` + `packages/themes/src/light.css`
> by `scripts/tokens/generate-manifest.mjs`. Do not edit by hand — run
> `pnpm tokens:generate` (or `pnpm regen`).

Every value cascivo exposes as a `--cascivo-*` CSS custom property. Values shown
are the **light** theme's; theme-scoped tokens (colors, shadows) differ per
`[data-theme]`. A machine-readable manifest is published at
`@cascivo/tokens/tokens.json`, and a `CascivoToken` union for editor autocomplete
at `@cascivo/tokens/tokens`.

## Canonical names vs aliases

Some roles have more than one token name for historical reasons (#7). The
**canonical** name is the one to prefer; aliases resolve to the same value and
are kept for backwards-compatibility (no token has been removed).

| Role                   | Canonical                                | Alias                                 |
| ---------------------- | ---------------------------------------- | ------------------------------------- |
| background             | `--cascivo-color-background`             | `--cascivo-color-bg`                  |
| foreground             | `--cascivo-color-foreground`             | `--cascivo-color-text`                |
| text-muted             | `--cascivo-color-text-muted`             | `--cascivo-color-foreground-muted`    |
| destructive            | `--cascivo-color-destructive`            | `--cascivo-color-error`               |
| accent-foreground      | `--cascivo-color-accent-foreground`      | `--cascivo-color-accent-content`      |
| success-foreground     | `--cascivo-color-success-foreground`     | `--cascivo-color-success-content`     |
| warning-foreground     | `--cascivo-color-warning-foreground`     | `--cascivo-color-warning-content`     |
| destructive-foreground | `--cascivo-color-destructive-foreground` | `--cascivo-color-destructive-content` |
| primary-fg             | `--cascivo-color-primary-fg`             | `--cascivo-color-primary-content`     |

## color

| Token                                        | Value                                                               | Notes                                             |
| -------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------- |
| **`--cascivo-blue-100`**                     | `oklch(0.932 0.055 250)`                                            |                                                   |
| **`--cascivo-blue-200`**                     | `oklch(0.882 0.095 250)`                                            |                                                   |
| **`--cascivo-blue-300`**                     | `oklch(0.808 0.14 250)`                                             |                                                   |
| **`--cascivo-blue-400`**                     | `oklch(0.707 0.18 250)`                                             |                                                   |
| **`--cascivo-blue-50`**                      | `oklch(0.97 0.025 250)`                                             |                                                   |
| **`--cascivo-blue-500`**                     | `oklch(0.623 0.214 250)`                                            |                                                   |
| **`--cascivo-blue-600`**                     | `oklch(0.546 0.224 250)`                                            |                                                   |
| **`--cascivo-blue-700`**                     | `oklch(0.452 0.196 250)`                                            |                                                   |
| **`--cascivo-blue-800`**                     | `oklch(0.373 0.155 250)`                                            |                                                   |
| **`--cascivo-blue-900`**                     | `oklch(0.29 0.105 250)`                                             |                                                   |
| **`--cascivo-blue-950`**                     | `oklch(0.205 0.065 250)`                                            |                                                   |
| **`--cascivo-border-default`**               | `oklch(0.872 0.008 264)`                                            |                                                   |
| **`--cascivo-border-strong`**                | `oklch(0.707 0.015 264)`                                            |                                                   |
| **`--cascivo-border-subtle`**                | `oklch(0.928 0.006 264)`                                            |                                                   |
| **`--cascivo-brand-accent`**                 | `oklch(0.72 0.13 195)`                                              |                                                   |
| **`--cascivo-brand-gradient-end`**           | `oklch(0.72 0.13 195)`                                              |                                                   |
| **`--cascivo-brand-gradient-start`**         | `oklch(0.55 0.15 240)`                                              |                                                   |
| **`--cascivo-brand-ink`**                    | `oklch( 0.22 0.03 250 )`                                            |                                                   |
| **`--cascivo-brand-paper`**                  | `oklch(0.99 0.005 250)`                                             |                                                   |
| **`--cascivo-brand-primary`**                | `oklch( 0.55 0.15 240 )`                                            |                                                   |
| **`--cascivo-chart-1`**                      | `oklch(0.62 0.13 70)`                                               |                                                   |
| **`--cascivo-chart-2`**                      | `oklch(0.62 0.11 240)`                                              |                                                   |
| **`--cascivo-chart-3`**                      | `oklch(0.6 0.13 135)`                                               |                                                   |
| **`--cascivo-chart-4`**                      | `oklch(0.6 0.18 55)`                                                |                                                   |
| **`--cascivo-chart-5`**                      | `oklch(0.5 0.13 270)`                                               |                                                   |
| **`--cascivo-chart-6`**                      | `oklch(0.58 0.16 30)`                                               |                                                   |
| **`--cascivo-chart-7`**                      | `oklch(0.62 0.12 350)`                                              |                                                   |
| **`--cascivo-chart-8`**                      | `oklch(0.5 0.12 200)`                                               |                                                   |
| **`--cascivo-chart-axis`**                   | `oklch(0.5 0.016 264)`                                              |                                                   |
| **`--cascivo-chart-fill-opacity`**           | `0.25`                                                              |                                                   |
| **`--cascivo-chart-grid`**                   | `var(--cascivo-gray-200)`                                           |                                                   |
| **`--cascivo-color-accent`**                 | `oklch(0.52 0.2 250)`                                               |                                                   |
| **`--cascivo-color-accent-active`**          | `var(--cascivo-blue-800)`                                           |                                                   |
| `--cascivo-color-accent-content`             | `var(--cascivo-color-text-on-accent)`                               | alias of `--cascivo-color-accent-foreground`      |
| **`--cascivo-color-accent-foreground`**      | `oklch(1 0 0)`                                                      |                                                   |
| **`--cascivo-color-accent-hover`**           | `oklch(0.45 0.2 250)`                                               |                                                   |
| **`--cascivo-color-accent-muted`**           | `var(--cascivo-blue-100)`                                           |                                                   |
| **`--cascivo-color-accent-subtle`**          | `var(--cascivo-blue-50)`                                            |                                                   |
| **`--cascivo-color-active-bg`**              | `oklch(0.145 0.005 264 / 6%)`                                       |                                                   |
| **`--cascivo-color-background`**             | `oklch(1 0 0)`                                                      |                                                   |
| `--cascivo-color-bg`                         | `var(--cascivo-color-background)`                                   | alias of `--cascivo-color-background`             |
| **`--cascivo-color-bg-subtle`**              | `var(--cascivo-color-surface)`                                      |                                                   |
| **`--cascivo-color-border`**                 | `var(--cascivo-gray-200)`                                           |                                                   |
| **`--cascivo-color-border-strong`**          | `var(--cascivo-gray-300)`                                           |                                                   |
| **`--cascivo-color-destructive`**            | `var(--cascivo-red-600)`                                            |                                                   |
| `--cascivo-color-destructive-content`        | `var(--cascivo-color-text-on-destructive)`                          | alias of `--cascivo-color-destructive-foreground` |
| **`--cascivo-color-destructive-foreground`** | `oklch(0.448 0.17 22)`                                              |                                                   |
| **`--cascivo-color-destructive-hover`**      | `var(--cascivo-red-700)`                                            |                                                   |
| **`--cascivo-color-destructive-subtle`**     | `var(--cascivo-red-50)`                                             |                                                   |
| `--cascivo-color-error`                      | `oklch(0.628 0.188 22)`                                             | alias of `--cascivo-color-destructive`            |
| **`--cascivo-color-error-content`**          | `oklch(1 0 0)`                                                      |                                                   |
| **`--cascivo-color-focus-ring`**             | `var(--cascivo-blue-500)`                                           |                                                   |
| **`--cascivo-color-foreground`**             | `oklch(0.145 0.005 264)`                                            |                                                   |
| `--cascivo-color-foreground-muted`           | `oklch(0.5 0.018 264)`                                              | alias of `--cascivo-color-text-muted`             |
| **`--cascivo-color-info`**                   | `var(--cascivo-blue-600)`                                           |                                                   |
| **`--cascivo-color-info-content`**           | `oklch(1 0 0)`                                                      |                                                   |
| **`--cascivo-color-info-foreground`**        | `oklch(0.45 0.19 250)`                                              |                                                   |
| **`--cascivo-color-info-subtle`**            | `var(--cascivo-blue-50)`                                            |                                                   |
| **`--cascivo-color-primary`**                | `oklch(0.205 0 0)`                                                  |                                                   |
| **`--cascivo-color-primary-active`**         | `oklch(0.32 0 0)`                                                   |                                                   |
| `--cascivo-color-primary-content`            | `var(--cascivo-color-primary-fg)`                                   | alias of `--cascivo-color-primary-fg`             |
| **`--cascivo-color-primary-fg`**             | `oklch(0.985 0 0)`                                                  |                                                   |
| **`--cascivo-color-primary-hover`**          | `oklch(0.27 0 0)`                                                   |                                                   |
| **`--cascivo-color-secondary`**              | `oklch(0.92 0.004 264)`                                             |                                                   |
| **`--cascivo-color-secondary-content`**      | `oklch(0.27 0.01 264)`                                              |                                                   |
| **`--cascivo-color-secondary-hover`**        | `oklch(0.86 0.006 264)`                                             |                                                   |
| **`--cascivo-color-secondary-subtle`**       | `oklch(0.967 0.002 264)`                                            |                                                   |
| **`--cascivo-color-success`**                | `oklch(0.648 0.15 145)`                                             |                                                   |
| `--cascivo-color-success-content`            | `oklch(1 0 0)`                                                      | alias of `--cascivo-color-success-foreground`     |
| **`--cascivo-color-success-foreground`**     | `oklch(0.45 0.14 145)`                                              |                                                   |
| **`--cascivo-color-success-subtle`**         | `var(--cascivo-green-50)`                                           |                                                   |
| **`--cascivo-color-surface`**                | `oklch(0.985 0.002 264)`                                            |                                                   |
| **`--cascivo-color-surface-2`**              | `oklch(0.967 0.003 264)`                                            |                                                   |
| **`--cascivo-color-surface-overlay`**        | `var(--cascivo-color-background)`                                   |                                                   |
| **`--cascivo-color-surface-raised`**         | `var(--cascivo-color-surface)`                                      |                                                   |
| `--cascivo-color-text`                       | `var(--cascivo-color-foreground)`                                   | alias of `--cascivo-color-foreground`             |
| **`--cascivo-color-text-muted`**             | `oklch(0.5 0.016 264)`                                              |                                                   |
| **`--cascivo-color-text-on-accent`**         | `oklch(1 0 0)`                                                      |                                                   |
| **`--cascivo-color-text-on-destructive`**    | `oklch(1 0 0)`                                                      |                                                   |
| **`--cascivo-color-text-subtle`**            | `var(--cascivo-gray-600)`                                           |                                                   |
| **`--cascivo-color-warning`**                | `oklch(0.768 0.145 75)`                                             |                                                   |
| `--cascivo-color-warning-content`            | `oklch(0.145 0 0)`                                                  | alias of `--cascivo-color-warning-foreground`     |
| **`--cascivo-color-warning-foreground`**     | `oklch(0.5 0.14 75)`                                                |                                                   |
| **`--cascivo-color-warning-subtle`**         | `var(--cascivo-orange-50)`                                          |                                                   |
| **`--cascivo-focus-ring`**                   | `0 0 0 var(--cascivo-ring-width) var(--cascivo-ring-color)`         |                                                   |
| **`--cascivo-gray-0`**                       | `oklch(1 0 0)`                                                      |                                                   |
| **`--cascivo-gray-100`**                     | `oklch(0.967 0.003 264)`                                            |                                                   |
| **`--cascivo-gray-200`**                     | `oklch(0.928 0.006 264)`                                            |                                                   |
| **`--cascivo-gray-300`**                     | `oklch(0.872 0.008 264)`                                            |                                                   |
| **`--cascivo-gray-400`**                     | `oklch(0.707 0.015 264)`                                            |                                                   |
| **`--cascivo-gray-50`**                      | `oklch(0.985 0.002 264)`                                            |                                                   |
| **`--cascivo-gray-500`**                     | `oklch(0.554 0.018 264)`                                            |                                                   |
| **`--cascivo-gray-600`**                     | `oklch(0.446 0.018 264)`                                            |                                                   |
| **`--cascivo-gray-700`**                     | `oklch(0.373 0.015 264)`                                            |                                                   |
| **`--cascivo-gray-800`**                     | `oklch(0.269 0.01 264)`                                             |                                                   |
| **`--cascivo-gray-900`**                     | `oklch(0.205 0.007 264)`                                            |                                                   |
| **`--cascivo-gray-950`**                     | `oklch(0.145 0.005 264)`                                            |                                                   |
| **`--cascivo-green-100`**                    | `oklch(0.962 0.044 145)`                                            |                                                   |
| **`--cascivo-green-200`**                    | `oklch(0.925 0.084 145)`                                            |                                                   |
| **`--cascivo-green-400`**                    | `oklch(0.75 0.15 145)`                                              |                                                   |
| **`--cascivo-green-50`**                     | `oklch(0.982 0.018 145)`                                            |                                                   |
| **`--cascivo-green-500`**                    | `oklch(0.648 0.15 145)`                                             |                                                   |
| **`--cascivo-green-600`**                    | `oklch(0.548 0.14 145)`                                             |                                                   |
| **`--cascivo-green-700`**                    | `oklch(0.448 0.12 145)`                                             |                                                   |
| **`--cascivo-green-900`**                    | `oklch(0.28 0.075 145)`                                             |                                                   |
| **`--cascivo-orange-100`**                   | `oklch(0.96 0.045 75)`                                              |                                                   |
| **`--cascivo-orange-400`**                   | `oklch(0.82 0.13 60)`                                               |                                                   |
| **`--cascivo-orange-50`**                    | `oklch(0.98 0.02 75)`                                               |                                                   |
| **`--cascivo-orange-500`**                   | `oklch(0.768 0.145 55)`                                             |                                                   |
| **`--cascivo-orange-600`**                   | `oklch(0.68 0.155 50)`                                              |                                                   |
| **`--cascivo-red-100`**                      | `oklch(0.936 0.032 22)`                                             |                                                   |
| **`--cascivo-red-200`**                      | `oklch(0.885 0.062 22)`                                             |                                                   |
| **`--cascivo-red-400`**                      | `oklch(0.72 0.16 22)`                                               |                                                   |
| **`--cascivo-red-50`**                       | `oklch(0.971 0.013 22)`                                             |                                                   |
| **`--cascivo-red-500`**                      | `oklch(0.628 0.188 22)`                                             |                                                   |
| **`--cascivo-red-600`**                      | `oklch(0.54 0.188 22)`                                              |                                                   |
| **`--cascivo-red-700`**                      | `oklch(0.448 0.17 22)`                                              |                                                   |
| **`--cascivo-red-900`**                      | `oklch(0.28 0.1 22)`                                                |                                                   |
| **`--cascivo-ring-color`**                   | `color-mix(in oklch, var(--cascivo-color-accent) 55%, transparent)` |                                                   |
| **`--cascivo-ring-offset`**                  | `0px`                                                               |                                                   |
| **`--cascivo-ring-width`**                   | `2px`                                                               |                                                   |
| **`--cascivo-warm-100`**                     | `oklch(0.962 0.016 80)`                                             |                                                   |
| **`--cascivo-warm-200`**                     | `oklch(0.92 0.025 78)`                                              |                                                   |
| **`--cascivo-warm-300`**                     | `oklch(0.87 0.035 75)`                                              |                                                   |
| **`--cascivo-warm-400`**                     | `oklch(0.76 0.045 70)`                                              |                                                   |
| **`--cascivo-warm-50`**                      | `oklch(0.982 0.008 80)`                                             |                                                   |
| **`--cascivo-warm-500`**                     | `oklch(0.64 0.045 65)`                                              |                                                   |
| **`--cascivo-warm-600`**                     | `oklch(0.52 0.04 60)`                                               |                                                   |
| **`--cascivo-warm-700`**                     | `oklch(0.42 0.03 55)`                                               |                                                   |
| **`--cascivo-warm-800`**                     | `oklch(0.31 0.022 50)`                                              |                                                   |
| **`--cascivo-warm-900`**                     | `oklch(0.21 0.015 50)`                                              |                                                   |
| **`--cascivo-yellow-100`**                   | `oklch(0.973 0.05 95)`                                              |                                                   |
| **`--cascivo-yellow-400`**                   | `oklch(0.868 0.145 80)`                                             |                                                   |
| **`--cascivo-yellow-50`**                    | `oklch(0.987 0.026 95)`                                             |                                                   |
| **`--cascivo-yellow-500`**                   | `oklch(0.768 0.145 75)`                                             |                                                   |

## typography

| Token                           | Value                                                                                 | Notes |
| ------------------------------- | ------------------------------------------------------------------------------------- | ----- |
| **`--cascivo-font-bold`**       | `700`                                                                                 |       |
| **`--cascivo-font-display`**    | `var(--cascivo-font-sans)`                                                            |       |
| **`--cascivo-font-medium`**     | `500`                                                                                 |       |
| **`--cascivo-font-mono`**       | `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace`                 |       |
| **`--cascivo-font-normal`**     | `400`                                                                                 |       |
| **`--cascivo-font-sans`**       | `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |       |
| **`--cascivo-font-semibold`**   | `600`                                                                                 |       |
| **`--cascivo-leading-none`**    | `1`                                                                                   |       |
| **`--cascivo-leading-normal`**  | `1.5`                                                                                 |       |
| **`--cascivo-leading-relaxed`** | `1.625`                                                                               |       |
| **`--cascivo-leading-snug`**    | `1.375`                                                                               |       |
| **`--cascivo-leading-tight`**   | `1.25`                                                                                |       |
| **`--cascivo-text-2xl`**        | `1.5rem`                                                                              |       |
| **`--cascivo-text-2xl-fluid`**  | `clamp(1.25rem, 1rem + 1.25vw, 1.5rem)`                                               |       |
| **`--cascivo-text-3xl`**        | `1.875rem`                                                                            |       |
| **`--cascivo-text-3xl-fluid`**  | `clamp(1.5rem, 1.125rem + 1.875vw, 1.875rem)`                                         |       |
| **`--cascivo-text-4xl`**        | `2.25rem`                                                                             |       |
| **`--cascivo-text-4xl-fluid`**  | `clamp(1.875rem, 1.5rem + 1.875vw, 2.25rem)`                                          |       |
| **`--cascivo-text-base`**       | `1rem`                                                                                |       |
| **`--cascivo-text-body`**       | `var(--cascivo-text-base)`                                                            |       |
| **`--cascivo-text-body-sm`**    | `var(--cascivo-text-sm)`                                                              |       |
| **`--cascivo-text-caption`**    | `var(--cascivo-text-xs)`                                                              |       |
| **`--cascivo-text-code`**       | `var( --cascivo-text-sm )`                                                            |       |
| **`--cascivo-text-display`**    | `var(--cascivo-text-4xl)`                                                             |       |
| **`--cascivo-text-heading-lg`** | `var(--cascivo-text-3xl)`                                                             |       |
| **`--cascivo-text-heading-md`** | `var(--cascivo-text-2xl)`                                                             |       |
| **`--cascivo-text-heading-sm`** | `var(--cascivo-text-xl)`                                                              |       |
| **`--cascivo-text-label`**      | `var(--cascivo-text-sm)`                                                              |       |
| **`--cascivo-text-lg`**         | `1.125rem`                                                                            |       |
| **`--cascivo-text-sm`**         | `0.875rem`                                                                            |       |
| **`--cascivo-text-ui`**         | `var( --cascivo-text-sm )`                                                            |       |
| **`--cascivo-text-xl`**         | `1.25rem`                                                                             |       |
| **`--cascivo-text-xs`**         | `0.75rem`                                                                             |       |
| **`--cascivo-tracking-normal`** | `0em`                                                                                 |       |
| **`--cascivo-tracking-tight`**  | `-0.025em`                                                                            |       |
| **`--cascivo-tracking-wide`**   | `0.025em`                                                                             |       |

## space

| Token                    | Value     | Notes |
| ------------------------ | --------- | ----- |
| **`--cascivo-space-0`**  | `0px`     |       |
| **`--cascivo-space-1`**  | `0.25rem` |       |
| **`--cascivo-space-10`** | `2.5rem`  |       |
| **`--cascivo-space-12`** | `3rem`    |       |
| **`--cascivo-space-16`** | `4rem`    |       |
| **`--cascivo-space-2`**  | `0.5rem`  |       |
| **`--cascivo-space-20`** | `5rem`    |       |
| **`--cascivo-space-24`** | `6rem`    |       |
| **`--cascivo-space-3`**  | `0.75rem` |       |
| **`--cascivo-space-4`**  | `1rem`    |       |
| **`--cascivo-space-5`**  | `1.25rem` |       |
| **`--cascivo-space-6`**  | `1.5rem`  |       |
| **`--cascivo-space-8`**  | `2rem`    |       |

## radius

| Token                            | Value                                     | Notes |
| -------------------------------- | ----------------------------------------- | ----- |
| **`--cascivo-radius-2xl`**       | `1rem`                                    |       |
| **`--cascivo-radius-badge`**     | `var(--cascivo-radius-full)`              |       |
| **`--cascivo-radius-base`**      | `0.375rem`                                |       |
| **`--cascivo-radius-button`**    | `var(--cascivo-radius-base)`              |       |
| **`--cascivo-radius-card`**      | `calc(var(--cascivo-radius-base) * 1.66)` |       |
| **`--cascivo-radius-component`** | `var(--cascivo-radius-base)`              |       |
| **`--cascivo-radius-control`**   | `var(--cascivo-radius-base)`              |       |
| **`--cascivo-radius-field`**     | `var(--cascivo-radius-base)`              |       |
| **`--cascivo-radius-full`**      | `9999px`                                  |       |
| **`--cascivo-radius-indicator`** | `calc(var(--cascivo-radius-base) / 2)`    |       |
| **`--cascivo-radius-input`**     | `var(--cascivo-radius-base)`              |       |
| **`--cascivo-radius-item`**      | `calc(var(--cascivo-radius-base) * 0.66)` |       |
| **`--cascivo-radius-lg`**        | `0.5rem`                                  |       |
| **`--cascivo-radius-md`**        | `0.375rem`                                |       |
| **`--cascivo-radius-modal`**     | `calc(var(--cascivo-radius-base) * 2)`    |       |
| **`--cascivo-radius-none`**      | `0px`                                     |       |
| **`--cascivo-radius-overlay`**   | `calc(var(--cascivo-radius-base) * 2)`    |       |
| **`--cascivo-radius-sm`**        | `0.25rem`                                 |       |
| **`--cascivo-radius-surface`**   | `calc(var(--cascivo-radius-base) * 1.66)` |       |
| **`--cascivo-radius-xl`**        | `0.75rem`                                 |       |

## shadow

| Token                          | Value                                                           | Notes |
| ------------------------------ | --------------------------------------------------------------- | ----- |
| **`--cascivo-shadow-lg`**      | `var(--cascivo-shadow-overlay)`                                 |       |
| **`--cascivo-shadow-md`**      | `0 2px 8px oklch(0 0 0 / 0.07), 0 1px 2px oklch(0 0 0 / 0.04)`  |       |
| **`--cascivo-shadow-overlay`** | `0 4px 32px oklch(0 0 0 / 0.16), 0 0 0 1px oklch(0 0 0 / 0.04)` |       |
| **`--cascivo-shadow-sm`**      | `0 1px 3px oklch(0 0 0 / 0.07), 0 1px 2px oklch(0 0 0 / 0.04)`  |       |
| **`--cascivo-shadow-xl`**      | `var(--cascivo-shadow-overlay)`                                 |       |
| **`--cascivo-shadow-xs`**      | `0 1px 2px oklch(0 0 0 / 0.05)`                                 |       |

## motion

| Token                           | Value                                                    | Notes |
| ------------------------------- | -------------------------------------------------------- | ----- |
| **`--cascivo-duration-100`**    | `100ms`                                                  |       |
| **`--cascivo-duration-150`**    | `150ms`                                                  |       |
| **`--cascivo-duration-200`**    | `200ms`                                                  |       |
| **`--cascivo-duration-300`**    | `300ms`                                                  |       |
| **`--cascivo-duration-500`**    | `500ms`                                                  |       |
| **`--cascivo-duration-75`**     | `75ms`                                                   |       |
| **`--cascivo-ease-in`**         | `cubic-bezier(0.4, 0, 1, 1)`                             |       |
| **`--cascivo-ease-in-out`**     | `cubic-bezier(0.4, 0, 0.2, 1)`                           |       |
| **`--cascivo-ease-out`**        | `cubic-bezier(0, 0, 0.2, 1)`                             |       |
| **`--cascivo-motion-emphasis`** | `var(--cascivo-duration-300) var(--cascivo-ease-in-out)` |       |
| **`--cascivo-motion-enter`**    | `var(--cascivo-duration-200) var(--cascivo-ease-out)`    |       |
| **`--cascivo-motion-exit`**     | `var(--cascivo-duration-150) var(--cascivo-ease-in)`     |       |

## sizing

| Token                             | Value     | Notes |
| --------------------------------- | --------- | ----- |
| **`--cascivo-control-height-lg`** | `3rem`    |       |
| **`--cascivo-control-height-md`** | `2.5rem`  |       |
| **`--cascivo-control-height-sm`** | `2rem`    |       |
| **`--cascivo-target-min-coarse`** | `2.75rem` |       |

## layout

| Token                                   | Value   | Notes |
| --------------------------------------- | ------- | ----- |
| **`--cascivo-shell-aside-inline-size`** | `18rem` |       |
| **`--cascivo-shell-header-block-size`** | `3rem`  |       |
| **`--cascivo-shell-panel-inline-size`** | `20rem` |       |

## z-index

| Token                      | Value | Notes |
| -------------------------- | ----- | ----- |
| **`--cascivo-z-base`**     | `0`   |       |
| **`--cascivo-z-dropdown`** | `100` |       |
| **`--cascivo-z-modal`**    | `300` |       |
| **`--cascivo-z-overlay`**  | `200` |       |
| **`--cascivo-z-raised`**   | `10`  |       |
| **`--cascivo-z-toast`**    | `400` |       |
| **`--cascivo-z-tooltip`**  | `500` |       |

## breakpoint

| Token                     | Value   | Notes |
| ------------------------- | ------- | ----- |
| **`--cascivo-screen-lg`** | `64rem` |       |
| **`--cascivo-screen-md`** | `40rem` |       |
| **`--cascivo-screen-sm`** | `30rem` |       |
| **`--cascivo-screen-xl`** | `80rem` |       |

## other

| Token                                     | Value                                                          | Notes |
| ----------------------------------------- | -------------------------------------------------------------- | ----- |
| **`--cascivo-disabled-opacity`**          | `0.5`                                                          |       |
| **`--cascivo-editor-bg`**                 | `var(--cascivo-color-surface, oklch(0.985 0.002 264))`         |       |
| **`--cascivo-editor-border`**             | `var(--cascivo-color-border, oklch(0.928 0.006 264))`          |       |
| **`--cascivo-editor-current-line`**       | `var(--cascivo-color-active-bg, oklch(0.55 0.02 264 / 8%))`    |       |
| **`--cascivo-editor-fg`**                 | `var(--cascivo-color-foreground, oklch(0.205 0.005 264))`      |       |
| **`--cascivo-editor-gutter-bg`**          | `var(--cascivo-color-surface-2, oklch(0.967 0.003 264))`       |       |
| **`--cascivo-editor-gutter-fg`**          | `var(--cascivo-color-text-muted, oklch(0.55 0.018 264))`       |       |
| **`--cascivo-editor-selection`**          | `var(--cascivo-color-accent-muted, oklch(0.882 0.095 250))`    |       |
| **`--cascivo-editor-syntax-attr`**        | `oklch(0.54 0.15 40)`                                          |       |
| **`--cascivo-editor-syntax-boolean`**     | `oklch(0.54 0.15 40)`                                          |       |
| **`--cascivo-editor-syntax-comment`**     | `var(--cascivo-color-foreground-muted, oklch(0.55 0.018 264))` |       |
| **`--cascivo-editor-syntax-function`**    | `var(--cascivo-chart-5, oklch(0.5 0.16 265))`                  |       |
| **`--cascivo-editor-syntax-keyword`**     | `var(--cascivo-color-accent, oklch(0.52 0.2 250))`             |       |
| **`--cascivo-editor-syntax-number`**      | `oklch(0.54 0.15 40)`                                          |       |
| **`--cascivo-editor-syntax-operator`**    | `var(--cascivo-color-foreground-muted, oklch(0.5 0.04 264))`   |       |
| **`--cascivo-editor-syntax-property`**    | `oklch(0.53 0.12 240)`                                         |       |
| **`--cascivo-editor-syntax-punctuation`** | `var(--cascivo-color-text-subtle, oklch(0.446 0.018 264))`     |       |
| **`--cascivo-editor-syntax-regexp`**      | `oklch(0.53 0.13 135)`                                         |       |
| **`--cascivo-editor-syntax-string`**      | `oklch(0.53 0.13 135)`                                         |       |
| **`--cascivo-editor-syntax-tag`**         | `var(--cascivo-color-accent, oklch(0.52 0.2 250))`             |       |
| **`--cascivo-editor-syntax-type`**        | `oklch(0.54 0.12 350)`                                         |       |
| **`--cascivo-editor-syntax-variable`**    | `var(--cascivo-editor-fg)`                                     |       |
| **`--cascivo-hover-opacity`**             | `0.8`                                                          |       |
