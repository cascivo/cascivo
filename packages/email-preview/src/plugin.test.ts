/**
 * The plugin's generated modules are the contract between the bin and the UI.
 *
 * Driving a browser to test them would be slow and would prove less: what matters is the
 * shape of the code `load()` emits for a given directory, which is pure and cheap to assert.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cascivoEmailPreview } from './plugin.mjs'

/**
 * Vite types `resolveId`/`load` as object-or-function hooks with a `PluginContext` `this`.
 * This plugin defines both as plain functions of one argument, which is what the test calls.
 * Narrowing our own known shape, not asserting one onto a payload from elsewhere.
 */
interface LoadablePlugin {
  resolveId: (id: string) => string | null
  load: (id: string) => string | null
}

let dir: string

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'cascivo-preview-'))
  writeFileSync(join(dir, 'issue.tsx'), 'export default function Issue() { return null }\n')
  writeFileSync(join(dir, 'skip.test.tsx'), 'export default function X() { return null }\n')
  writeFileSync(join(dir, '_partial.tsx'), 'export default function P() { return null }\n')
  writeFileSync(join(dir, 'notes.md'), '# not a template\n')
  mkdirSync(join(dir, 'nested'))
  writeFileSync(join(dir, 'nested', 'welcome.jsx'), 'export default function W() { return null }\n')
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

const load = (id: string, options: Record<string, unknown> = {}) => {
  const plugin = cascivoEmailPreview({ dir, ...options }) as unknown as LoadablePlugin
  return plugin.load(plugin.resolveId(id)!) ?? ''
}

describe('the templates module', () => {
  it('finds templates recursively and skips what is not one', () => {
    const code = load('virtual:cascivo-email-templates')
    expect(code).toContain('"issue"')
    expect(code).toContain('"nested/welcome"')
    expect(code).not.toContain('skip.test')
    expect(code).not.toContain('_partial')
    expect(code).not.toContain('notes.md')
  })

  it('reads the optional named exports, defaulting each', () => {
    // subject/previewProps are React Email's convention; theme and allow follow its shape
    // rather than inventing a second one.
    const code = load('virtual:cascivo-email-templates')
    expect(code).toContain('subject: m0.subject ?? &#x27;&#x27;'.replaceAll('&#x27;', "'"))
    expect(code).toContain('props: m0.previewProps ?? {}')
    expect(code).toContain('theme: m0.theme ?? null')
    expect(code).toContain('allow: m0.allow ?? null')
  })

  it('serves the built-in templates when no directory was given', () => {
    const plugin = cascivoEmailPreview({}) as unknown as LoadablePlugin
    const code = plugin.load(plugin.resolveId('virtual:cascivo-email-templates')!) ?? ''
    expect(code).toContain('export const source = null')
    expect(code).toContain('PasswordReset')
  })
})

describe('the themes module', () => {
  it('is empty without --theme', () => {
    expect(load('virtual:cascivo-email-themes')).toContain('export const custom = {}')
  })

  it('imports the file and tells one palette from a record of them', () => {
    // A Palette is `--token` -> string, so its values are strings; a record of palettes has
    // objects for values. Shape, rather than a wrapper the common case would not want.
    const code = load('virtual:cascivo-email-themes', { themes: join(dir, 'brand.ts') })
    expect(code).toContain('brand.ts')
    expect(code).toContain('isPalette')
    expect(code).toContain('"brand"')
  })
})

describe('the allow module', () => {
  it('is an empty object without --allow', () => {
    expect(load('virtual:cascivo-email-allow')).toBe('export default {}')
  })

  it('inlines the file so the panel and CI can agree', () => {
    const file = join(dir, 'allow.json')
    writeFileSync(file, '{"css-at-media":"waived on purpose"}')
    expect(load('virtual:cascivo-email-allow', { allow: file })).toContain('waived on purpose')
  })
})
