import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  generate,
  oklchToRgb,
  over,
  parseColor,
  parseDecls,
  resolveTheme,
  resolveVar,
  toRgb8,
  ROLES,
  type Decls,
} from './gen-theme.ts'

const rgb8 = (v: string) => toRgb8(parseColor(v)!)

test('oklch converter: white, black', () => {
  assert.deepEqual(rgb8('oklch(1 0 0)'), [255, 255, 255])
  assert.deepEqual(rgb8('oklch(0 0 0)'), [0, 0, 0])
})

test('oklch converter: terminal accent (reference computed independently in float64)', () => {
  // Björn Ottosson's OKLab matrices + sRGB transfer; in gamut, so no chroma reduction.
  assert.deepEqual(rgb8('oklch(0.82 0.2 145)'), [96, 229, 107])
})

test('oklch converter reduces chroma instead of clipping channels', () => {
  const [r, g, b] = oklchToRgb(0.7, 0.4, 145)
  for (const c of [r, g, b]) assert.ok(c >= 0 && c <= 1)
  // Clipping would pin a channel to exactly 0 or 1; chroma reduction keeps hue and lands inside.
  assert.ok(g > r && g > b)
})

test('parses hex, rgb and percent alpha', () => {
  assert.deepEqual(rgb8('#ff8000'), [255, 128, 0])
  assert.deepEqual(rgb8('#f00'), [255, 0, 0])
  assert.deepEqual(rgb8('rgb(0 128 255)'), [0, 128, 255])
  assert.equal(parseColor('oklch(1 0 0 / 60%)')!.a, 0.6)
  assert.equal(parseColor('contrast-color(red)'), null)
})

test('alpha pre-composites over the background', () => {
  const c = over(parseColor('oklch(1 0 0 / 50%)')!, parseColor('#000000')!)
  assert.deepEqual(toRgb8(c), [128, 128, 128])
})

const layers = (css: string): Decls => [parseDecls(css)]

test('alias chain resolves through var() and var() fallbacks', () => {
  const l = layers(`--a: var(--b); --b: var(--missing, #102030); --c: var(--a);`)
  assert.deepEqual(toRgb8(resolveVar('--c', l)!), [16, 32, 48])
  assert.equal(resolveVar('--nope', l), null)
})

test('a non-literal later declaration falls back to the earlier static one', () => {
  const l = layers(`--x: #ff0000; --x: oklch(from var(--y) 0.8 0.1 h); --y: #00ff00;`)
  assert.deepEqual(toRgb8(resolveVar('--x', l)!), [255, 0, 0])
})

const base = `
  --cascivo-color-background: #000000; --cascivo-color-surface: #101010;
  --cascivo-color-surface-raised: #202020; --cascivo-color-border: #ffffff;
  --cascivo-color-border-strong: #eeeeee; --cascivo-color-foreground: #f0f0f0;
  --cascivo-color-text-muted: #999999; --cascivo-color-accent: #ffffff;
  --cascivo-color-text-on-accent: contrast-color(var(--cascivo-color-accent));
  --cascivo-color-success: #00ff00; --cascivo-color-warning: #ffff00;
  --cascivo-color-destructive: #ff0000; --cascivo-color-info: #0000ff;`

test('fallbacks: surface2, focus<-accent, accent_fg by contrast', () => {
  const r = resolveTheme('t', layers(base))
  assert.equal(r.colors.length, ROLES.length)
  const at = (n: (typeof ROLES)[number]) => r.colors[ROLES.indexOf(n)]
  assert.deepEqual(at('surface2'), [32, 32, 32])
  assert.deepEqual(at('focus'), at('accent'))
  assert.deepEqual(at('accent_fg'), [0, 0, 0]) // black on a white accent
  // selection = accent 25% over surface: 255*.25 + 16*.75 = 75.75
  assert.deepEqual(at('selection'), [76, 76, 76])
})

test('unresolved role throws with theme and role', () => {
  const css = base.replace('--cascivo-color-info: #0000ff;', '')
  assert.throws(() => resolveTheme('mytheme', layers(css)), /theme mytheme: role info/)
})

test('drift: generated output equals committed theme_gen.rs', () => {
  const committed = readFileSync(
    fileURLToPath(new URL('../../crates/cascivo-tui/src/theme_gen.rs', import.meta.url)),
    'utf8',
  )
  assert.equal(generate().code, committed, 'run `pnpm tui-kit:generate`')
})
