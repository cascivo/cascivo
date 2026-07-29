#!/usr/bin/env node
/**
 * Does cascivo's per-component CSS survive an Astro island build?
 *
 * This is the executable form of the 2026-07-28 C2 report. That report said Astro drops
 * per-component CSS for SSR'd islands (`client:load`, `client:visible`) while emitting it
 * for `client:only` — so a page renders with hashed class names and no matching rules, with
 * nothing warning. `docs/COMPATIBILITY.md` had listed Astro as ✅ supported, unqualified.
 *
 * The check is deliberately about *evidence*, not about passing. It reads the built HTML,
 * collects every `_<name>_<hash>_<line>` CSS-module class Astro emitted, and asks whether
 * the emitted CSS actually defines them. Then it reports:
 *
 *   - all classes matched  -> Astro emits component CSS; C2 no longer reproduces here, and
 *                             `COMPATIBILITY.md` should be re-graded (the script says so).
 *   - classes unmatched    -> C2 reproduces; the script prints which, and exits 0 because
 *                             this is a KNOWN, DOCUMENTED limitation
 *                             (`docs/USING-WITH-ASTRO.md`), not a regression in cascivo.
 *
 * Exiting 0 on the known-bad case is deliberate: this app exists to keep the claim honest
 * and observable in CI, not to block every build on an upstream Astro behaviour cascivo
 * cannot fix. What it must never do is silently pass while the underlying fact changes —
 * hence the loud, specific output either way.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')

if (!existsSync(DIST)) {
  console.error('astro-islands: no dist/ — run `astro build` first')
  process.exit(1)
}

/** Every file under `dir`, recursively. */
function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

const files = walk(DIST)
/**
 * PER PAGE, one directive each.
 *
 * A single page carrying all three directives answers nothing: `client:only` emits the
 * component CSS, and the SSR'd islands on the same page then appear covered by it. The first
 * version of this fixture did exactly that and reported "C2 does not reproduce" — which was
 * true of the page and told you nothing about `client:load`. Hence `src/pages/{load,visible,
 * only}.astro`, and hence this loop.
 */
const results = []
for (const file of files.filter((f) => f.endsWith('.html'))) {
  const page = file.slice(DIST.length + 1)
  const html = readFileSync(file, 'utf8')
  const used = [
    ...new Set([...html.matchAll(/\b(_[a-zA-Z][\w-]*_[a-z0-9]{5,}_\d+)\b/g)].map((m) => m[1])),
  ]
  // Only the stylesheets THIS page links, not every sheet in dist.
  const linked = [...html.matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1])
  const css = linked
    .map((href) => {
      const path = join(DIST, href.replace(/^\//, ''))
      return existsSync(path) ? readFileSync(path, 'utf8') : ''
    })
    .join('\n')
  // Astro can also inline CSS in a <style> tag.
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
  const available = css + inline
  results.push({ page, used, unmatched: used.filter((c) => !available.includes(`.${c}`)) })
}

for (const r of results) {
  const verdict =
    r.used.length === 0 ? 'NO CLASSES' : r.unmatched.length === 0 ? 'styled' : 'UNSTYLED'
  console.log(
    `astro-islands: ${r.page.padEnd(14)} ${String(r.used.length).padStart(3)} classes  ->  ${verdict}` +
      (r.unmatched.length ? `  (${r.unmatched.length} with no rule, e.g. .${r.unmatched[0]})` : ''),
  )
}

if (results.length === 0 || results.every((r) => r.used.length === 0)) {
  console.error(
    '\nastro-islands: no cascivo module classes in any built page.\n' +
      'That is not the C2 finding — this fixture stopped rendering cascivo components, so it\n' +
      'is testing nothing. Fix the app.',
  )
  process.exit(1)
}

const broken = results.filter((r) => r.used.length > 0 && r.unmatched.length > 0)
if (broken.length === 0) {
  console.log(
    '\nastro-islands: every directive emits the CSS its markup references.\n' +
      '\n' +
      `C2 DOES NOT REPRODUCE on astro@${process.env.npm_package_dependencies_astro ?? '7.x'}.\n` +
      'The 2026-07-28 report was filed against Astro 6.4.8. If this keeps holding, re-grade\n' +
      'Astro in docs/COMPATIBILITY.md (currently ⚠️ Partial) and update\n' +
      'docs/USING-WITH-ASTRO.md, which still tells adopters their SSR islands render unstyled.',
  )
  process.exit(0)
}

console.log(
  `\nC2 REPRODUCES on ${broken.map((b) => b.page).join(', ')}: Astro emitted markup\n` +
    'referencing cascivo component classes without emitting the rules, so those islands\n' +
    'render unstyled. This is the documented limitation in docs/USING-WITH-ASTRO.md and the\n' +
    'reason docs/COMPATIBILITY.md grades Astro ⚠️ Partial, so this exits 0 rather than\n' +
    'failing a build over upstream behaviour cascivo cannot fix.\n' +
    'Workarounds: import `@cascivo/react/styles.css` in a shared layout, or use `client:only`.',
)
process.exit(0)
