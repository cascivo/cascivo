// Single source of truth for `/accessibility/<name>` page head generation.
// Consumed by the browser runtime (marketing/seo.ts) and the Vite build's
// prerenderPages() — kept import-free (no registry/document) so the Vite
// config can import it safely, mirroring route-head.ts and component-head.ts.

/** <60 chars for every registry component so it won't truncate in SERPs. */
export function accessibilityGuideTitle(meta: { name: string }): string {
  return `Accessible React ${meta.name} — cascivo`
}

/** Word-boundary truncation so a long a11yRationale doesn't get cut mid-word. */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max)}…`
}

/** Targets ~155 chars total (a11yRationale varies widely in length, up to 600+ chars). */
export function accessibilityGuideDescription(meta: {
  name: string
  a11yRationale: string
}): string {
  const prefix = `How to build an accessible ${meta.name} in React with cascivo: `
  return prefix + truncate(meta.a11yRationale, Math.max(155 - prefix.length, 40))
}

export function accessibilityGuidePath(name: string): string {
  return `/accessibility/${name}`
}
