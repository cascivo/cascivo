#!/usr/bin/env node
/**
 * Generate the **styling contract** surface — the machine-readable answer to "which
 * `--cascivo-*` names and which `data-cascivo-*` hooks actually exist".
 *
 * ## Why this exists
 *
 * cascivo already generated a `CascivoToken` union and a token catalog, and both were
 * documentary: nothing in the toolchain used either to reject a name that does not exist.
 * That gap has a specific, expensive failure mode, and it is the one CSS is worst at
 * reporting — **an unknown custom property is silently dropped**. `--cascivo-color-acent:
 * red` does not warn, does not fail a build, and does not appear in DevTools; it simply has
 * no effect, and the adopter (or the agent) goes looking for the bug in the component.
 * `docs/TOKENS.md`'s own naming-map section says exactly this about the
 * `--cascivo-text-*` / `--cascivo-font-*` split: "an unknown custom property is silently
 * dropped by CSS, with no error anywhere, which is what makes this class expensive to
 * debug." The same is true of a `data-cascivo-*` selector: a hook that does not exist is a
 * CSS rule that matches nothing, forever, quietly.
 *
 * The 2026-09-08 StyleX analysis (`docs/internal/STYLEX-ANALYSIS.md`) named this as the one
 * axis on which StyleX is genuinely ahead: it makes a wrong token a **compiler error**,
 * where cascivo made it a warning at best. StyleX pays for that with a Babel plugin and
 * hashed variable names an agent can never type from memory. cascivo does not need the
 * compiler — it needs the name set to be checkable. That is all this file emits.
 *
 * ## What it emits, and who consumes it
 *
 *   packages/tokens/src/style-contract.d.ts   `CascivoComponentToken`, `CascivoAnyToken`,
 *                                             `CascivoTokenStyle`, `CascivoStyleHook`
 *                                             — the `satisfies` surface for adopters.
 *   packages/tokens/style-contract.json       the same data, for tooling.
 *   packages/eslint-plugin/src/token-catalog.json
 *                                             what `cascivo/token-values` runs on.
 *
 * The CLI audit reads the hook list from `audit-contract.json` (generated separately, from
 * the same registry) rather than from here, so the published CLI stays self-contained.
 *
 * ## Why it reads the catalog rather than re-parsing CSS
 *
 * `scripts/catalog/generate.ts` already resolves the full name set — primitive and semantic
 * tokens from the token sources, plus every per-component author hook parsed out of the
 * shipped component stylesheets. Re-parsing here would create a second answer to the same
 * question, and the two would drift. `scripts/registry/audit-contract.ts` reads the catalog
 * for the same reason; this follows it. `pnpm regen` runs `catalog:generate` first.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')

interface CatalogToken {
  name: string
  layer: string
}
interface RegistryComponent {
  name: string
  meta?: { name?: string; styleHooks?: string[] }
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8')) as T
}

const catalog = readJson<{ tokens: CatalogToken[] }>('apps/site/public/tokens.catalog.json')
const registry = readJson<{ components: RegistryComponent[] }>('registry.json')

/**
 * Component-layer tokens — the per-component knobs (`--cascivo-button-radius`) an adopter
 * re-points to restyle one component. `CascivoToken` in `tokens.d.ts` deliberately covers
 * only the primitive + semantic layers, so on its own it rejects the exact names rung 1 of
 * the override ladder tells people to set.
 *
 * `consumedTokens` (below) joins this list: a knob read with a fallback and never declared
 * is still a per-component knob, and it is the one the docs happen to use as an example.
 */
const declaredComponentTokens = catalog.tokens
  .filter((t) => t.layer === 'component')
  .map((t) => t.name)

/** Shipped stylesheets — the same roots the catalog parses, plus the token sources. */
const CSS_ROOTS = [
  'packages/tokens/src',
  'packages/themes/src',
  'packages/components/src',
  'packages/layouts/src',
  'packages/charts/src',
  'packages/flow/src',
  'packages/editor/src',
]

function cssFiles(dir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...cssFiles(full))
    else if (entry.endsWith('.css')) out.push(full)
  }
  return out
}

const declared = new Set(catalog.tokens.map((t) => t.name))

/**
 * Knobs a stylesheet **reads** but never declares — `var(--cascivo-flash-tint,
 * var(--cascivo-color-accent-subtle))`. The catalog is built from declarations, so these are
 * invisible to it, and they are nonetheless real: a call site reading one with a fallback is
 * exactly an adopter-settable knob, documented as such in `docs/MOTION.md`.
 *
 * Without this pass the first thing the new token rule did was flag `--cascivo-flash-tint`,
 * a name the docs correctly tell people to set. A checker that rejects correct code is worse
 * than no checker — it is the fastest route to being switched off.
 */
const consumedTokens = [
  ...new Set(
    CSS_ROOTS.flatMap((root) => cssFiles(join(ROOT, root)))
      .flatMap((file) => [
        ...readFileSync(file, 'utf8').matchAll(/var\(\s*(--cascivo-[a-z0-9-]+)/g),
      ])
      .map((match) => match[1]!)
      .filter((name) => !declared.has(name)),
  ),
].sort()

const componentTokens = [...new Set([...declaredComponentTokens, ...consumedTokens])].sort()

/** Every token name, whatever its layer — the set a `--cascivo-*` reference must be in. */
const allTokens = [...new Set([...declared, ...consumedTokens])].sort()

const styleHooks = [
  ...new Set(
    registry.components.flatMap((c) => c.meta?.styleHooks ?? []).filter((h) => h.length > 0),
  ),
].sort()

/** hook → the component that stamps it, for a lint/audit message that names the owner. */
const hookOwners: Record<string, string> = {}
for (const component of registry.components) {
  for (const hook of component.meta?.styleHooks ?? []) {
    hookOwners[hook] ??= component.meta?.name ?? component.name
  }
}

const union = (names: string[]) =>
  names.length > 0 ? names.map((n) => `  | '${n}'`).join('\n') : '  | never'

const dts = `// AUTO-GENERATED by scripts/style-contract/generate.ts — do not edit by hand.
// Run \`pnpm style-contract:generate\` (or \`pnpm regen\`) to refresh.

import type { CascivoToken } from './tokens.js'

/**
 * Every per-component token — the knobs the override ladder's first rung tells you to set
 * (\`--cascivo-button-radius\`, \`--cascivo-dialog-body-gap\`). Separate from
 * {@link CascivoToken}, which covers only the primitive and semantic layers.
 */
export type CascivoComponentToken =
${union(componentTokens)}

/** Any \`--cascivo-*\` custom property cascivo ships, at any layer. */
export type CascivoAnyToken = CascivoToken | CascivoComponentToken

/**
 * An inline style object whose custom properties are checked against the shipped token set.
 *
 * React's \`CSSProperties\` has no index signature for \`--*\` keys, so a custom property in a
 * \`style\` prop is unchecked by construction — every adopter writes the cast, and a typo in
 * the cast resolves to nothing at runtime with no diagnostic anywhere. Use \`satisfies\` to
 * get the name checked before the cast erases it:
 *
 * \`\`\`tsx
 * import type { CSSProperties } from 'react'
 * import type { CascivoTokenStyle } from '@cascivo/tokens/style-contract'
 *
 * const brand = {
 *   '--cascivo-button-bg': 'var(--cascivo-color-accent)',
 * } satisfies CascivoTokenStyle
 *
 * <Button style={brand as CSSProperties}>Save</Button>
 * \`\`\`
 *
 * A misspelled token is a compile error on the \`satisfies\` line, which is the whole point —
 * the cast is still yours, but it can no longer launder a name that does not exist.
 */
export type CascivoTokenStyle = {
  [K in CascivoAnyToken]?: string | number
}

/**
 * Every \`data-cascivo-*\` styling hook — the stable, semver'd selectors for reaching a
 * component's internals. See \`docs/STYLING-INTERNALS.md\`.
 *
 * CSS Modules hash internal class names, so a hook that does not exist is a rule that
 * matches nothing and says nothing. Typing the set turns that into an error at the one
 * place a type can reach it — tooling, tests, and any \`querySelector\` you write.
 */
export type CascivoStyleHook =
${union(styleHooks)}
`

writeFileSync(join(ROOT, 'packages/tokens/src/style-contract.d.ts'), dts)

const json = {
  _comment:
    'GENERATED by scripts/style-contract/generate.ts — run `pnpm regen`. Do not edit by hand.',
  tokens: allTokens,
  componentTokens,
  consumedTokens,
  styleHooks: styleHooks.map((hook) => ({ hook, component: hookOwners[hook] ?? null })),
}
writeFileSync(
  join(ROOT, 'packages/tokens/style-contract.json'),
  `${JSON.stringify(json, null, 2)}\n`,
)

/**
 * The lint rule's copy — deliberately just the names.
 *
 * `@cascivo/eslint-plugin` ships unminified source under an 8 KB budget, and this file is a
 * large share of it, so it carries only what the rule reads. Two things are left out on
 * purpose, and neither is a loss:
 *
 *   - **The `--cascivo-` prefix**, restored by the rule. Every one of 342 names carries it.
 *   - **The value→token map.** Answering "`#3b82f6` is `--cascivo-blue-500`" is
 *     `cascivo audit --ai`'s `hardcoded-value` rule, which scopes by CSS property and reads
 *     CSS files — a lint rule looking at a custom-property key has neither. Duplicating it
 *     here bought overlap and a false-positive surface, not coverage.
 *
 * Style hooks are left out for the same reason: they appear in CSS selectors, which ESLint
 * never sees. `unknown-style-hook` covers them.
 */
writeFileSync(
  join(ROOT, 'packages/eslint-plugin/src/token-catalog.json'),
  `${JSON.stringify(
    {
      _comment:
        'GENERATED by scripts/style-contract/generate.ts — run `pnpm regen`. Do not edit by hand. ' +
        'Names omit the shared `--cascivo-` prefix; the rule restores it.',
      tokens: allTokens.map((t) => t.replace('--cascivo-', '')),
    },
    null,
    2,
  )}\n`,
)

console.log(
  `style-contract: ${allTokens.length} tokens (${componentTokens.length} component-layer, ` +
    `${consumedTokens.length} read-only), ` +
    `${styleHooks.length} style hooks → tokens/style-contract.d.ts + style-contract.json + ` +
    `eslint-plugin/token-catalog.json`,
)
