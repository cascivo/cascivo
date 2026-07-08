// Blog posts are structured content, not MDX/markdown — there's no markdown
// pipeline anywhere in this repo, and every other page is hand-authored TSX.
// One generic renderer (BlogPostPage.tsx) renders these blocks in the SPA;
// one generic renderer (renderBlogPostBody in vite.config.ts) renders the
// SAME blocks to a static HTML string for the prerender — so the two can
// never drift apart. `code` is restricted to the langs CodeBlock.tsx actually
// ships a grammar for (kept lean on purpose — see that file).
export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'code'; lang: 'tsx' | 'bash'; code: string }
  | { type: 'callout'; text: string }
  | { type: 'links'; items: { text: string; href: string }[] }

export interface BlogPost {
  slug: string
  title: string
  /** Meta description, keep under ~160 chars. */
  description: string
  /** YYYY-MM-DD, stamped once at authoring time — never Date.now(). */
  datePublished: string
  dateModified?: string
  tags: string[]
  blocks: BlogBlock[]
}
