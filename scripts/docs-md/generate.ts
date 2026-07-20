#!/usr/bin/env node
/**
 * Publishes a curated set of `docs/*.md` guides as plain, statically-fetchable
 * markdown under `apps/site/public/docs/<slug>.md`, plus a `components.md` index,
 * so an agent or `curl` reads the whole install/theming/SSR story without the
 * client-rendered docs SPA (2026-07-18 report F7: `cascivo.com/docs/components.md`
 * 404'd; guides lived only behind GitHub blob URLs).
 *
 * Single source: the `docs/` files. Each served copy gets a canonical-URL header
 * with a freshness stamp, and its intra-repo relative links are rewritten so the
 * served copy never dead-links:
 *   - a link to another published guide → `/docs/<slug>.md`
 *   - any other repo-relative path      → an absolute github.com blob/tree URL
 *
 * Kept in sync by the regen drift check. Supersedes the old getting-started-only
 * generator (this emits getting-started.md too).
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', '..')
const DOCS_DIR = join(ROOT, 'docs')
const OUT_DIR = join(ROOT, 'apps', 'site', 'public', 'docs')
const REPO_BLOB = 'https://github.com/cascivo/cascivo/blob/main'
const REPO_TREE = 'https://github.com/cascivo/cascivo/tree/main'

/** Curated adopter-facing guides. `src` is the docs/ filename, `slug` the served name. */
const GUIDES: { src: string; slug: string }[] = [
  { src: 'GETTING-STARTED.md', slug: 'getting-started' },
  { src: 'THEMING.md', slug: 'theming' },
  { src: 'HEADLESS.md', slug: 'headless' },
  { src: 'COMPATIBILITY.md', slug: 'compatibility' },
  { src: 'TOKENS.md', slug: 'tokens' },
  { src: 'RECIPE-DASHBOARD.md', slug: 'recipe-dashboard' },
  { src: 'MIGRATING-FROM-SHADCN.md', slug: 'migrating-from-shadcn' },
  { src: 'ENTERPRISE-READINESS.md', slug: 'enterprise-readiness' },
  { src: 'AI-RULES.md', slug: 'ai-rules' },
  { src: 'TROUBLESHOOTING.md', slug: 'troubleshooting' },
  { src: 'USING-WITH-NEXTJS.md', slug: 'using-with-nextjs' },
  { src: 'USING-WITH-VITE-SSR.md', slug: 'using-with-vite-ssr' },
  { src: 'USING-WITH-TAILWIND.md', slug: 'using-with-tailwind' },
  { src: 'USING-WITH-PREACT.md', slug: 'using-with-preact' },
  { src: 'USING-WITH-STRICT-ESLINT.md', slug: 'using-with-strict-eslint' },
]

/** src filename → served slug, for rewriting cross-guide links. */
const slugBySrc = new Map(GUIDES.map((g) => [g.src, g.slug]))

const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')) as {
  version: string
  generatedAt: string
  components: { name: string; description: string; install?: string; meta?: { name?: string } }[]
  blocks?: { name: string; description?: string; displayName?: string }[]
}

const stampLine = `registry v${registry.version} · generated ${registry.generatedAt}`

function header(slug: string): string {
  return [
    '<!--',
    `  Generated from docs/ — do not edit here; run \`pnpm regen\`.`,
    `  Canonical: https://cascivo.com/docs/${slug}.md`,
    `  ${stampLine}`,
    '-->',
    '',
  ].join('\n')
}

/**
 * Rewrite a single relative markdown-link target found inside `srcFile`.
 * External / absolute / anchor / mailto targets are returned unchanged.
 */
function rewriteTarget(srcFile: string, target: string): string {
  if (/^(https?:|mailto:|#|\/)/.test(target)) return target
  const [pathPart, frag] = splitFragment(target)
  if (!pathPart) return target // pure `#anchor` already handled above; be safe
  const resolved = resolve(dirname(srcFile), pathPart)
  const repoRel = relative(ROOT, resolved).replace(/\\/g, '/')

  // Another published guide → its served /docs/<slug>.md
  const base = repoRel.startsWith('docs/') ? repoRel.slice('docs/'.length) : null
  if (base && slugBySrc.has(base)) return `/docs/${slugBySrc.get(base)}.md${frag}`

  // Anything else in the repo → absolute GitHub URL (blob for files, tree for dirs).
  if (existsSync(resolved)) {
    const kind = statSync(resolved).isDirectory() ? REPO_TREE : REPO_BLOB
    return `${kind}/${repoRel}${frag}`
  }
  // Unresolved (shouldn't happen — docs-links check guards this) → GitHub blob guess.
  return `${REPO_BLOB}/${repoRel}${frag}`
}

function splitFragment(target: string): [string, string] {
  const i = target.indexOf('#')
  return i === -1 ? [target, ''] : [target.slice(0, i), target.slice(i)]
}

/** Rewrite every `[text](target)` relative link in a doc body. */
function rewriteLinks(srcFile: string, body: string): string {
  return body.replace(/(\]\()([^)]+)(\))/g, (_m, open: string, target: string, close: string) => {
    return open + rewriteTarget(srcFile, target.trim()) + close
  })
}

function componentsIndex(): string {
  const lines: string[] = []
  lines.push('<!--')
  lines.push('  Generated component index — do not edit here; run `pnpm regen`.')
  lines.push('  Canonical: https://cascivo.com/docs/components.md')
  lines.push(`  ${stampLine}`)
  lines.push('-->')
  lines.push('')
  lines.push('# cascivo component index')
  lines.push('')
  lines.push(
    'Every component, chart, block, and layout in the registry, with its distribution ' +
      'channel and per-component doc. Names are exact registry names (namespaced entries ' +
      'keep their prefix). Full manifests: `/llms/<name>.md`.',
  )
  lines.push('')

  const rows = [
    ...registry.components.map((c) => ({
      name: c.name,
      display: c.meta?.name ?? c.name,
      description: c.description,
      channel: channelLabel(c),
    })),
    ...(registry.blocks ?? []).map((b) => {
      const name = b.name.startsWith('block/') ? b.name : `block/${b.name}`
      return {
        name,
        display: b.displayName ?? name,
        description: b.description ?? '',
        channel: 'copy-paste',
      }
    }),
  ].sort((a, b) => a.name.localeCompare(b.name))

  lines.push('| Component | Channel | Doc |')
  lines.push('|-----------|---------|-----|')
  for (const r of rows) {
    const desc = r.description.replace(/\|/g, '\\|')
    lines.push(`| **${r.display}** — ${desc} | ${r.channel} | \`/llms/${r.name}.md\` |`)
  }
  lines.push('')
  lines.push(`_${stampLine}_`)
  lines.push('')
  return lines.join('\n')
}

/**
 * Distribution channel for a component entry. Mirrors channelLabel() in
 * scripts/llms/generate.ts (that module runs main() on import, so it can't be
 * imported here — kept trivially in sync).
 */
function channelLabel(c: { name: string; install?: string }): string {
  if (c.install) return `npm ${c.install}`
  if (c.name.startsWith('block/') || c.name.startsWith('layout/')) return 'copy-paste'
  return 'npm @cascivo/react · or copy-paste'
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  let count = 0
  for (const { src, slug } of GUIDES) {
    const srcFile = join(DOCS_DIR, src)
    if (!existsSync(srcFile)) {
      console.warn(`docs-md: source ${src} missing — skipping`)
      continue
    }
    const body = rewriteLinks(srcFile, readFileSync(srcFile, 'utf8'))
    writeFileSync(join(OUT_DIR, `${slug}.md`), header(slug) + body, 'utf8')
    count++
  }
  writeFileSync(join(OUT_DIR, 'components.md'), componentsIndex(), 'utf8')
  console.log(`docs-md: wrote ${count} guides + components.md to ${relative(ROOT, OUT_DIR)}`)
}

main()
