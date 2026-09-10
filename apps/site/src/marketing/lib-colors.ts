/**
 * One colour per benchmarked library, shared by every comparison chart on the
 * marketing site so a colour means the same library everywhere it appears.
 *
 * The page is ink, cream and acid. The Okabe-Ito blue and vermillion these bars
 * used to take are a fine general-purpose chart palette, but they are the only
 * two hues on the poster grid and read as imported from another design system —
 * the same defect `PosterGallery`'s `INK_BAR` already fixed for the traffic
 * chart. So the libraries take an even ink ramp instead: the difference between
 * bars is a lightness step, not a hue step.
 *
 * cascade keeps the page's own ink (cream in the dark half) — the poster
 * palette's subject colour — and the competitors step back from it. The acid
 * accent still cannot be used for a bar: at oklch(0.88 …) on a white chart
 * surface it lands near 1.2:1, well under the 3:1 WCAG 1.4.11 floor for
 * graphical objects.
 *
 * Both tints are mixed from theme tokens, so the charts repaint with the rest of
 * the page when the header switches theme, and the ramp stays even in every one:
 * `color-mix` interpolates lightness linearly, so 100 / 71 / 42 % of the ink over
 * the page background is three equal steps whatever the two endpoints are. The
 * floor is 42 %, the lightest tint that still clears 3:1 against the background
 * in both poster halves (3.6:1 light, 3.3:1 dark). A pure lightness ramp is also
 * the CVD-safe limit: it survives protan, deutan, tritan and full achromatopsia,
 * which no hue pair does. Red stays reserved for destructive actions.
 */
export type BenchLib = 'cascade' | 'shadcn' | 'carbon'

const inkTint = (pct: number): string =>
  `color-mix(in oklch, var(--cascivo-color-foreground) ${pct}%, var(--cascivo-color-bg))`

export const LIB_COLOR: Record<BenchLib, string> = {
  cascade: 'var(--cascivo-color-foreground)',
  shadcn: inkTint(71),
  carbon: inkTint(42),
}
