import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { normalize } from './html-conformance/normalize.ts'

// Each `html-conformance/<name>.case.tsx` default-exports the React element equivalent to
// `crates/cascivo-html/tests/conformance/<name>.cv`; the Rust side writes `<name>.html`.
const cases = import.meta.glob<{ default: ReactElement }>('./html-conformance/*.case.tsx', {
  eager: true,
})
const dir = fileURLToPath(
  new URL('../../../crates/cascivo-html/tests/conformance/', import.meta.url),
)
const snapshots = new Set(readdirSync(dir).filter((f) => f.endsWith('.html')))

describe('cascivo-html conformance (Rust output vs React SSR)', () => {
  for (const [path, mod] of Object.entries(cases)) {
    const name = path.replace(/^.*\//, '').replace(/\.case\.tsx$/, '')
    it(name, () => {
      expect(snapshots.has(`${name}.html`), `missing ${name}.html snapshot`).toBe(true)
      const rust = readFileSync(`${dir}${name}.html`, 'utf8')
      expect(normalize(rust, { rust: true })).toBe(
        normalize(renderToStaticMarkup(mod.default), { rust: false }),
      )
    })
  }

  it('every Rust snapshot has a React case', () => {
    const have = new Set(
      Object.keys(cases).map((p) => p.replace(/^.*\//, '').replace(/\.case\.tsx$/, '.html')),
    )
    expect([...snapshots].filter((s) => !have.has(s))).toEqual([])
  })
})
