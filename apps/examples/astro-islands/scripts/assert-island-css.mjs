#!/usr/bin/env node
/**
 * Does cascivo's per-component CSS survive an Astro island build?
 *
 * This is the executable form of the 2026-07-28 C2 report. That report said Astro drops
 * per-component CSS for SSR'd islands (`client:load`, `client:visible`) while emitting it
 * for `client:only` — so a page renders with hashed class names and no matching rules, with
 * nothing warning. `docs/COMPATIBILITY.md` had listed Astro as ✅ supported, unqualified.
 *
 * **C2 is FIXED, and this is now a regression test.** The cause was never Astro: export
 * conditions match in key order, and `@cascivo/react` listed its CSS-free `node` twin ahead
 * of `import`. Astro's SSR build resolves with `node` active, so its SERVER module graph got
 * the CSS-free build -- and Astro collects a page's CSS by walking that graph, so it emitted
 * none. `client:only` worked because it never server-renders. Adding a `module` condition
 * ahead of `node` (a bundler-only convention Node's ESM resolver ignores, so the bare-Node
 * guarantee the twin exists for is untouched) fixes every directive with a vanilla
 * `astro.config.mjs`. See docs/plans/framework-templates-astro-ghost-research.md.
 *
 * So this script now EXITS NON-ZERO when an SSR'd island references a class with no rule.
 * It used to exit 0 on that case, when the drop was believed to be upstream behaviour
 * cascivo could not fix; keeping that leniency would let the regression this fixture exists
 * to catch sail straight through CI.
 *
 * It reads the built HTML, collects every `_<name>_<hash>_<line>` CSS-module class Astro
 * emitted, and asserts the emitted CSS actually defines them -- per page, one client
 * directive each.
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
  console.log('\nastro-islands: every directive emits the CSS its markup references.')
  process.exit(0)
}

console.error(
  `\nastro-islands: REGRESSION on ${broken.map((b) => b.page).join(', ')}.\n` +
    'Astro emitted markup referencing cascivo component classes without emitting the rules,\n' +
    'so those islands render unstyled.\n' +
    '\n' +
    'First thing to check: the `module` export condition must still be listed BEFORE `node`\n' +
    'in packages/react/package.json. Astro resolves with `node` active, so if `node` wins,\n' +
    "Astro's server module graph gets the CSS-free twin and collects no CSS. That ordering\n" +
    'is guarded by scripts/checks/css-contract.test.ts (`pnpm css-contract:check`).',
)
process.exit(1)
