#!/usr/bin/env node
/**
 * Generates apps/site/public/blog/feed.xml (RSS 2.0) from the blog post data
 * in apps/site/src/blog — a second, independent discovery surface for feed
 * readers and some AI crawlers, alongside sitemap.xml. Deterministic (dates
 * come from each post's own authored `datePublished`/`dateModified`, never
 * wall-clock) so the drift check stays green; run as part of `pnpm regen`.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { POSTS } from '../../apps/site/src/blog/index.ts'
import { SITE_URL } from '../../apps/site/src/marketing/route-head.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const OUT_PATH = join(ROOT, 'apps', 'site', 'public', 'blog', 'feed.xml')

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** RFC 822 date at midnight UTC, from a YYYY-MM-DD string — no wall-clock. */
function rfc822(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  const weekday = WEEKDAYS[d.getUTCDay()]
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = MONTHS[d.getUTCMonth()]
  return `${weekday}, ${day} ${month} ${d.getUTCFullYear()} 00:00:00 GMT`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const items = POSTS.map((post) => {
  const url = `${SITE_URL}/blog/${post.slug}`
  return (
    `  <item>\n` +
    `    <title>${escapeXml(post.title)}</title>\n` +
    `    <link>${url}</link>\n` +
    `    <guid>${url}</guid>\n` +
    `    <pubDate>${rfc822(post.dateModified ?? post.datePublished)}</pubDate>\n` +
    `    <description>${escapeXml(post.description)}</description>\n` +
    `  </item>`
  )
}).join('\n')

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>cascivo blog</title>
  <link>${SITE_URL}/blog</link>
  <description>Notes on building cascivo: the AI layer, signal-driven reactivity, modern CSS, and what shipping an owned-code design system actually looks like.</description>
${items}
</channel>
</rss>
`

mkdirSync(dirname(OUT_PATH), { recursive: true })
writeFileSync(OUT_PATH, feed)
console.log(`blog-feed: wrote ${POSTS.length} items to ${OUT_PATH}`)
