/**
 * Generate DESIGN.md — the portable design-context format (Google Stitch's open spec): YAML
 * front matter with the tokens, then prose in the spec's section order.
 *
 * It is for tools that read one file and nothing else — prompt-to-UI builders, quick
 * prototypes. Production agents should use the MCP server and per-component docs, which carry
 * props and validation this format has no room for; the Overview says so.
 *
 * Values come from tokens.catalog.json (light theme, resolved). A token named here that the
 * catalog no longer has fails the run, so the file cannot quietly drift from the tokens.
 * Writes ./DESIGN.md and apps/site/public/DESIGN.md.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const COLORS: Record<string, string> = {
  primary: 'color-primary',
  'on-primary': 'color-primary-fg',
  accent: 'color-accent',
  'on-accent': 'color-text-on-accent',
  background: 'color-bg',
  surface: 'color-surface',
  'surface-2': 'color-surface-2',
  text: 'color-text',
  'text-muted': 'color-text-muted',
  border: 'color-border',
  'border-strong': 'color-border-strong',
  destructive: 'color-destructive',
  success: 'color-success',
  warning: 'color-warning',
  info: 'color-info',
}

// Headings mirror packages/components/src/heading/heading.module.css: semibold, tight leading.
const TYPE_SCALE: Record<string, { size: string; weight: string; leading: string }> = {
  display: { size: 'text-display', weight: 'font-semibold', leading: 'leading-tight' },
  'heading-lg': { size: 'text-heading-lg', weight: 'font-semibold', leading: 'leading-tight' },
  'heading-md': { size: 'text-heading-md', weight: 'font-semibold', leading: 'leading-tight' },
  'heading-sm': { size: 'text-heading-sm', weight: 'font-semibold', leading: 'leading-tight' },
  body: { size: 'text-body', weight: 'font-normal', leading: 'leading-normal' },
  'body-sm': { size: 'text-body-sm', weight: 'font-normal', leading: 'leading-normal' },
  label: { size: 'text-label', weight: 'font-medium', leading: 'leading-normal' },
  caption: { size: 'text-caption', weight: 'font-normal', leading: 'leading-normal' },
}

const ROUNDED = ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full']
const SPACING = ['1', '2', '3', '4', '6', '8', '12', '16']

async function main(): Promise<void> {
  const raw = JSON.parse(
    await readFile(join(ROOT, 'apps/site/public/tokens.catalog.json'), 'utf8'),
  ) as unknown
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !Array.isArray((raw as { tokens?: unknown }).tokens)
  ) {
    throw new Error('tokens.catalog.json: expected { tokens: [...] } — run `pnpm catalog:generate`')
  }
  const values = new Map<string, string>()
  for (const t of (raw as { tokens: unknown[] }).tokens) {
    if (typeof t !== 'object' || t === null) continue
    const { name, resolvedDefault } = t as { name?: unknown; resolvedDefault?: unknown }
    if (typeof name === 'string' && typeof resolvedDefault === 'string') {
      values.set(name.replace('--cascivo-', ''), resolvedDefault)
    }
  }
  const get = (key: string): string => {
    const v = values.get(key)
    if (v === undefined) throw new Error(`DESIGN.md: token --cascivo-${key} is not in the catalog`)
    return v
  }
  const q = (v: string): string => JSON.stringify(v)
  const font = get('font-sans').split(',')[0]?.trim() ?? 'system-ui'

  const lines: string[] = ['---', 'name: cascivo', 'version: alpha']
  lines.push(
    `description: ${q('The CSS-native, signal-driven, AI-first React design system. Light theme shown; eleven more ship, switched with a data-theme attribute.')}`,
  )
  lines.push('colors:')
  for (const [k, token] of Object.entries(COLORS)) lines.push(`  ${k}: ${q(get(token))}`)
  lines.push('typography:')
  for (const [k, t] of Object.entries(TYPE_SCALE)) {
    lines.push(`  ${k}:`)
    lines.push(`    fontFamily: ${q(font)}`)
    lines.push(`    fontSize: ${q(get(t.size))}`)
    lines.push(`    fontWeight: ${get(t.weight)}`)
    lines.push(`    lineHeight: ${get(t.leading)}`)
  }
  lines.push('rounded:')
  for (const k of ROUNDED) lines.push(`  ${k}: ${q(get(`radius-${k}`))}`)
  lines.push('spacing:')
  for (const k of SPACING) lines.push(`  "${k}": ${q(get(`space-${k}`))}`)
  lines.push('components:')
  lines.push('  button-primary:')
  lines.push('    backgroundColor: "{colors.primary}"')
  lines.push('    textColor: "{colors.on-primary}"')
  lines.push('    typography: "{typography.label}"')
  lines.push('    rounded: "{rounded.md}"')
  lines.push(`    padding: ${q(`${get('space-2')} ${get('space-4')}`)}`)
  lines.push('  card:')
  lines.push('    backgroundColor: "{colors.surface}"')
  lines.push('    textColor: "{colors.text}"')
  lines.push('    rounded: "{rounded.lg}"')
  lines.push(`    padding: ${q(get('space-6'))}`)
  lines.push('  input:')
  lines.push('    backgroundColor: "{colors.background}"')
  lines.push('    textColor: "{colors.text}"')
  lines.push('    typography: "{typography.body}"')
  lines.push('    rounded: "{rounded.md}"')
  lines.push('---', '')

  lines.push(
    '<!-- Generated by scripts/design-md/generate.ts from tokens.catalog.json — edit the generator, not this file. -->',
    '',
    '## Overview',
    '',
    'cascivo is a React design system styled with plain, layered CSS and design tokens — no Tailwind, no CSS-in-JS. This file is a portable summary for tools that read a single design file. For production work, point your agent at the MCP server (`npx cascivo mcp init`) and the per-component docs at https://cascivo.com/llms.txt: they carry every component, its real props and a validator for generated code, which this format cannot.',
    '',
    'Install with `npx cascivo init` (copy components into your repo) or `npm install @cascivo/react @cascivo/themes` (prebuilt). Import one theme stylesheet and set `data-theme` on any element.',
    '',
    '## Colors',
    '',
    'Colours are OKLCH. The values above are the light theme. Twelve first-party themes remap the same semantic names (light, dark, warm, midnight, pastel, brutalist, corporate, terminal, cyberpunk, arcade, flat, minimal) — design against the names, not the values. Use `accent` for the one interactive highlight, `destructive` only for irreversible actions, and pair every fill with its `on-*` colour.',
    '',
    '## Typography',
    '',
    `One family (${font}, the system UI stack) across a fixed scale: display and three heading sizes, body, small body, label and caption. Weights are 400/500/600/700. Do not introduce sizes between steps.`,
    '',
    '## Layout',
    '',
    'Spacing is a 0.25rem step scale (`spacing` above). Layout primitives take numeric steps (`gap={4}` is 1rem). Mobile-first: base styles target 320px; the only breakpoints are 30rem, 40rem, 64rem and 80rem. Prefer container queries so components adapt to their slot. Touch targets reach 44px on coarse pointers.',
    '',
    '## Elevation & Depth',
    '',
    'Five shadow steps (xs–xl), used sparingly: cards rest flat on `surface`, overlays (dialogs, popovers, menus) take the larger steps. Separate regions with `border` before reaching for a shadow.',
    '',
    '## Shapes',
    '',
    'A single radius scale (`rounded` above); controls use `md`, surfaces `lg`, pills `full`. Some themes (brutalist, terminal) set radii to 0 — never hard-code a radius.',
    '',
    '## Components',
    '',
    'More than a hundred components, twenty-five chart types, layouts and page blocks, all on these tokens. Button variants are `primary`, `secondary`, `ghost` and `destructive` (there is no `outline`). Form controls take `label`, `hint` and `error` directly. Overlays use native `<dialog>` and the Popover API. Full list: https://cascivo.com/registry.json.',
    '',
    "## Do's and Don'ts",
    '',
    '- Do use tokens (`var(--cascivo-color-accent)`), never raw colours or pixel sizes.',
    '- Do put custom CSS inside `@layer cascivo.override { … }`; unlayered CSS overrides everything.',
    '- Do give every interactive control an accessible name; the components enforce the rest (WCAG 2.2 AA).',
    '- Don’t use Tailwind utility classes on cascivo components — style through tokens and props.',
    '- Don’t hide content on small screens; move it into a disclosure, drawer or sheet.',
    '- Don’t invent props: check `https://cascivo.com/llms/<component>.md`, or run `npx cascivo audit --ai` on generated code.',
    '',
  )

  const out = lines.join('\n')
  await writeFile(join(ROOT, 'DESIGN.md'), out)
  await writeFile(join(ROOT, 'apps/site/public/DESIGN.md'), out)
  console.log('DESIGN.md written')
}

await main()
