/**
 * One colour per benchmarked library, shared by every comparison chart on the
 * marketing site so a colour means the same library everywhere it appears.
 *
 * cascade takes the page's own ink (cream in the dark half) — the poster
 * palette's subject colour. The acid accent cannot be used for a bar: at
 * oklch(0.88 …) on a white chart surface it lands near 1.2:1, well under the
 * 3:1 WCAG 1.4.11 floor for graphical objects. The two competitors take the
 * Okabe-Ito blue and vermillion already in the token palette; all three pairs
 * clear the CVD distinguishability threshold under protan, deutan and tritan
 * in both theme halves.
 */
export type BenchLib = 'cascade' | 'shadcn' | 'carbon'

export const LIB_COLOR: Record<BenchLib, string> = {
  cascade: 'var(--cascivo-color-foreground)',
  shadcn: 'var(--cascivo-chart-5)',
  carbon: 'var(--cascivo-chart-6)',
}
