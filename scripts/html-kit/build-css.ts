/**
 * Compiles cascivo CSS modules into plain CSS with fixed class names (`cv-<unit>-<local>`)
 * for the cascivo-html Rust crate. Deterministic: sorted inputs, no timestamps.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { transform } from 'lightningcss'
import { CV_SPEC, packagesRoot, unitDirs } from './cv-spec.ts'

export const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
const pkg = (p: string) => fileURLToPath(new URL(p, packagesRoot))

/** Absolute paths of the CSS modules of a unit, sorted by filename. */
export function moduleFiles(unit: string): string[] {
  for (const d of unitDirs(unit)) {
    const dir = pkg(d)
    if (!existsSync(dir)) continue
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.module.css'))
      .sort()
    if (files.length) return files.map((f) => join(dir, f))
  }
  return []
}

export function buildCss(unit: string): string {
  const parts: string[] = []
  for (const file of moduleFiles(unit)) {
    const { code } = transform({
      filename: file,
      code: readFileSync(file),
      minify: true,
      // Keep keyframe / grid / custom-ident names global: motion.css owns the keyframes.
      cssModules: {
        pattern: `cv-${unit}-[local]`,
        animation: false,
        grid: false,
        customIdents: false,
      },
    })
    parts.push(code.toString())
  }
  return parts.join('\n')
}

const read = (p: string) => readFileSync(p, 'utf8')

/** Layers + reset + tokens + motion + properties + base, minified, in cascade order. */
export function buildBase(): string {
  const t = pkg('tokens/src/')
  const files = [
    t + 'layers.css',
    t + 'reset.css',
    t + 'index.css',
    t + 'motion.css',
    t + 'properties.css',
    pkg('themes/src/base.css'),
  ]
  // `@import` lines are dropped: every imported file is concatenated explicitly above.
  const css = files.map((f) => read(f).replace(/@import\s+[^;]+;/g, '')).join('\n')
  return transform({ filename: 'base.css', code: Buffer.from(css), minify: true }).code.toString()
}

export const THEME_NAMES = [
  'arcade',
  'brutalist',
  'corporate',
  'cyberpunk',
  'dark',
  'flat',
  'light',
  'midnight',
  'minimal',
  'pastel',
  'terminal',
  'warm',
] as const

export function buildTheme(name: string): string {
  const css = read(pkg(`themes/src/${name}.css`)).replace(/@import\s+[^;]+;/g, '')
  return transform({
    filename: `${name}.css`,
    code: Buffer.from(css),
    minify: true,
  }).code.toString()
}

/** Every generated file as `relative path -> content`. */
export function buildAll(): Map<string, string> {
  const out = new Map<string, string>()
  const units = [...new Set(CV_SPEC.flatMap((e) => e.css))].sort()
  for (const u of units) out.set(`assets/css/${u}.css`, buildCss(u))
  out.set('assets/css/base.css', buildBase())
  for (const t of THEME_NAMES) out.set(`assets/themes/${t}.css`, buildTheme(t))
  return out
}

export function writeAll(dir: string): void {
  for (const [rel, content] of buildAll()) {
    const f = join(dir, rel)
    mkdirSync(join(f, '..'), { recursive: true })
    writeFileSync(f, content)
  }
}

if (import.meta.main) writeAll(join(repoRoot, 'crates/cascivo-html'))
