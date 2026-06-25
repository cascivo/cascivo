// Landing link-check (v49 T5). Asserts every internal href used in the marketing
// surface maps to a known route, so a broken internal link fails CI instead of
// shipping a 404 (which the Footer comment used to concede was a "manual
// follow-up"). The internal-route assertion is the hard gate; external links are
// collected and reported but not pinged here (network checks are flaky in CI —
// run them out-of-band if desired).
//
// Known routes are parsed from the marketing router (`ROUTES` in App.tsx) plus
// the deploy-served paths that live outside the SPA (the docs app, storybook,
// and the root-served machine files) and the dynamic route prefixes.
import { readdirSync, readFileSync } from 'node:fs'
import { join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))
const marketingDir = join(root, 'apps/site/src/marketing')
const appTsx = join(marketingDir, 'App.tsx')

// Deploy-served paths that are NOT in the SPA router (separate apps / root assets).
const DEPLOY_SERVED = ['/docs', '/storybook', '/llms.txt', '/registry.json']
// Dynamic route prefixes — any path under these is valid (detail/preview pages,
// the docs app's own sub-pages like /docs/why and /docs/benchmarks).
const KNOWN_PREFIXES = ['/examples/', '/blocks/', '/docs/']

/** Parse the literal route keys from the `ROUTES` object in App.tsx. */
function parseRoutes(): Set<string> {
  const src = readFileSync(appTsx, 'utf8')
  const start = src.indexOf('const ROUTES')
  if (start === -1) throw new Error('landing-links: could not find ROUTES in App.tsx')
  // Scan to the end of the object literal (first `\n}` after the declaration).
  const end = src.indexOf('\n}', start)
  const block = src.slice(start, end === -1 ? undefined : end)
  const routes = new Set<string>()
  for (const m of block.matchAll(/'(\/[A-Za-z0-9\-/]*)':/g)) routes.add(m[1])
  for (const p of DEPLOY_SERVED) routes.add(p)
  return routes
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (['.tsx', '.ts'].includes(extname(entry.name)) && !entry.name.endsWith('.d.ts'))
      out.push(full)
  }
  return out
}

/** Extract literal href values (quoted or backtick-without-interpolation). */
function extractHrefs(src: string): string[] {
  const hrefs: string[] = []
  for (const m of src.matchAll(/href=(["'])([^"'`\n]*?)\1/g)) hrefs.push(m[2])
  for (const m of src.matchAll(/href=\{`([^`$\n]*?)`\}/g)) hrefs.push(m[1])
  return hrefs
}

const routes = parseRoutes()
const files = walk(marketingDir)
const broken: { file: string; href: string }[] = []
const external = new Set<string>()

function isKnownInternal(href: string): boolean {
  const path = href.split('#')[0].split('?')[0]
  if (path === '') return true // pure hash link (#anchor) on the current page
  if (routes.has(path)) return true
  return KNOWN_PREFIXES.some((p) => path.startsWith(p))
}

for (const file of files) {
  const src = readFileSync(file, 'utf8')
  for (const href of extractHrefs(src)) {
    if (/^https?:\/\//.test(href)) {
      external.add(href)
    } else if (href.startsWith('mailto:') || href.startsWith('#')) {
      // skip mail + in-page anchors
    } else if (href.startsWith('/')) {
      if (!isKnownInternal(href)) broken.push({ file: relative(root, file), href })
    }
    // relative / interpolated (${...}) hrefs are skipped — not statically resolvable
  }
}

console.log(`landing-links: ${routes.size} known routes, ${external.size} external targets`)

if (broken.length > 0) {
  for (const b of broken) console.error(`FAIL broken internal link: ${b.href}  (${b.file})`)
  process.exit(1)
}
console.log('landing links OK')
