/**
 * The DTCG export (`scripts/tokens/generate-dtcg.ts`) is only useful if a design tool can load
 * it: every alias must point at a real token, every token must carry a type the 2025.10 format
 * defines, and the resolver must name exactly the theme files that exist. Conversions are
 * checked against the spec's own examples so a colour-maths slip cannot ship silently.
 *
 * Run: node --experimental-strip-types --test scripts/checks/dtcg-export.test.ts
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { convertValue, oklchToHex, parseShadow, tokenKey } from '../tokens/dtcg.ts'

const ROOT = join(import.meta.dirname, '..', '..')
const DIR = join(ROOT, 'packages/tokens/dtcg')
const TYPES = new Set([
  'color',
  'dimension',
  'duration',
  'fontFamily',
  'fontWeight',
  'number',
  'cubicBezier',
  'shadow',
])

type Node = Record<string, unknown>

function tokens(tree: Node, path: string[] = []): { path: string; token: Node }[] {
  const out: { path: string; token: Node }[] = []
  for (const [key, value] of Object.entries(tree)) {
    if (key.startsWith('$') || typeof value !== 'object' || value === null) continue
    const node = value as Node
    if ('$value' in node) out.push({ path: [...path, key].join('.'), token: node })
    else out.push(...tokens(node, [...path, key]))
  }
  return out
}

describe('dtcg conversions', () => {
  it('matches the spec’s own oklch → hex example', () => {
    // DTCG color module example: oklch(0.7016 0.3225 328.363) is #ff00ff.
    assert.equal(oklchToHex(0.7016, 0.3225, 328.363), '#ff00ff')
    assert.equal(oklchToHex(1, 0, 0), '#ffffff')
    assert.equal(oklchToHex(0, 0, 0), '#000000')
  })

  it('types each CSS value family', () => {
    assert.deepEqual(convertValue('1.5rem', 'space'), {
      $type: 'dimension',
      $value: { value: 1.5, unit: 'rem' },
    })
    assert.equal(convertValue('200ms', 'duration')?.$type, 'duration')
    assert.equal(convertValue('cubic-bezier(0.2, 0, 0, 1)', 'ease')?.$type, 'cubicBezier')
    assert.equal(convertValue('600', 'font')?.$type, 'fontWeight')
    assert.equal(convertValue('1.25', 'leading')?.$type, 'number')
    assert.deepEqual(convertValue("ui-sans-serif, 'Segoe UI', sans-serif", 'font'), {
      $type: 'fontFamily',
      $value: ['ui-sans-serif', 'Segoe UI', 'sans-serif'],
    })
    assert.deepEqual(convertValue('oklch(1 0 0 / 10%)', 'color')?.$value, {
      colorSpace: 'oklch',
      components: [1, 0, 0],
      alpha: 0.1,
      hex: '#ffffff',
    })
  })

  it('refuses what DTCG cannot express instead of guessing', () => {
    assert.equal(convertValue('calc(var(--cascivo-radius-base) * 2)', 'radius'), undefined)
    assert.equal(convertValue('-0.025em', 'tracking'), undefined)
    assert.equal(convertValue('color-mix(in oklch, red 50%, blue)', 'color'), undefined)
    assert.equal(parseShadow('0 4em 8px oklch(0 0 0 / 0.1)'), undefined)
  })

  it('parses multi-layer shadows', () => {
    const s = parseShadow('0 1px 3px oklch(0 0 0 / 0.07), 0 1px 2px oklch(0 0 0 / 0.04)')
    assert.equal(s?.length, 2)
    assert.deepEqual(s?.[0]?.blur, { value: 3, unit: 'px' })
    assert.deepEqual(s?.[0]?.spread, { value: 0, unit: 'px' })
  })

  it('makes keys legal DTCG names', () => {
    assert.equal(tokenKey('--cascivo-space-0.5'), 'space-0_5')
  })
})

describe('dtcg export files', () => {
  const skip = !existsSync(join(DIR, 'cascivo.tokens.json'))
  it('exists (run `pnpm tokens:dtcg:generate`)', { skip }, () => {
    const base = JSON.parse(readFileSync(join(DIR, 'cascivo.tokens.json'), 'utf8')) as Node
    const all = tokens(base)
    assert.ok(all.length > 200, `only ${all.length} tokens exported`)
    const paths = new Set(all.map((t) => t.path))

    for (const { path, token } of all) {
      assert.ok(
        TYPES.has(String(token['$type'])),
        `${path}: unknown $type ${String(token['$type'])}`,
      )
      const v = token['$value']
      if (typeof v === 'string' && v.startsWith('{')) {
        assert.ok(paths.has(v.slice(1, -1)), `${path}: alias ${v} points at no token`)
      }
    }
  })

  it('resolver names exactly the theme files that exist', { skip }, () => {
    const resolver = JSON.parse(readFileSync(join(DIR, 'cascivo.resolver.json'), 'utf8')) as {
      version: string
      modifiers: { theme: { contexts: Record<string, { $ref: string }[]>; default: string } }
    }
    assert.equal(resolver.version, '2025.10')
    const contexts = resolver.modifiers.theme.contexts
    const files = readdirSync(join(DIR, 'themes')).map((f) => f.replace('.tokens.json', ''))
    assert.deepEqual(Object.keys(contexts).sort(), files.sort())
    assert.equal(files.length, 12, 'expected the twelve first-party themes')
    assert.ok(resolver.modifiers.theme.default in contexts)
  })
})
