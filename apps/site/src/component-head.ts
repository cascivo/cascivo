// Single source of truth for `/docs/components/<name>` page head generation.
// Consumed by both the browser runtime (seo.ts) and the Vite build's
// prerenderPages() — kept import-free (no registry/document) so vite.config.ts
// can import it safely, mirroring marketing/route-head.ts.

/**
 * Keyword-loaded, SERP-safe title (<60 chars for every registry component) —
 * beats a flat "<Name> — cascivo docs" for long-tail queries like "accessible
 * react combobox".
 */
export function componentTitle(meta: { name: string }): string {
  return `${meta.name} — accessible React component — cascivo`
}

export function componentOgImage(name: string): string {
  return `/og/components/${name}.png`
}
