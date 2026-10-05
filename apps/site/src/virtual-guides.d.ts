// Virtual modules served by the guides plugin (apps/site/guides.ts).

declare module 'virtual:cascivo-guides' {
  import type { ContentGraph, Heading } from '@docspack/sheaf'

  /** Every guide in curated order; bodies and headings left out (they load per page). */
  export const graph: ContentGraph
  /** Guides served at an existing docs URL instead of /docs/guides/<slug>, by slug. */
  export const routes: Readonly<Record<string, string>>
  /** One guide's rendered HTML and headings, or undefined for an unknown slug. */
  export function loadGuide(
    slug: string,
  ): Promise<{ html: string; headings: readonly Heading[] } | undefined>
}
