import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDoctor, stripCommentsAndStrings } from './doctor.js'

describe('stripCommentsAndStrings', () => {
  it('blanks line comments', () => {
    expect(stripCommentsAndStrings('const a = 1 // useState here')).not.toContain('useState')
  })

  it('blanks block comments', () => {
    expect(stripCommentsAndStrings('/* no useEffect needed */ const a = 1')).not.toContain(
      'useEffect',
    )
  })

  it('blanks string contents but keeps code', () => {
    const out = stripCommentsAndStrings(`const label = 'useState'; useComputed()`)
    expect(out).not.toContain('useState')
    expect(out).toContain('useComputed()')
  })

  it('does not treat // inside a string as a comment', () => {
    const out = stripCommentsAndStrings(`const url = 'https://x.dev'; useSignal()`)
    expect(out).toContain('useSignal()')
  })

  it('keeps real hook calls', () => {
    expect(stripCommentsAndStrings('const [a, b] = useState(0)')).toContain('useState')
  })
})

describe('runDoctor', () => {
  let dir: string

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  function componentRepo(name: string, tsx: string): string {
    dir = mkdtempSync(join(tmpdir(), 'cascivo-doctor-'))
    const compDir = join(dir, 'packages', 'components', 'src', name)
    mkdirSync(compDir, { recursive: true })
    writeFileSync(join(compDir, `${name}.tsx`), tsx)
    const reactDir = join(dir, 'packages', 'react', 'src')
    mkdirSync(reactDir, { recursive: true })
    writeFileSync(join(reactDir, 'index.ts'), `export * from '../../components/src/${name}/x'\n`)
    return dir
  }

  it('does not flag banned hooks mentioned only in comments', async () => {
    const root = componentRepo(
      'widget',
      `// No useState/useEffect here — signals only.\nexport function Widget() { return null }\n`,
    )
    const result = await runDoctor(root)
    expect(result.violations.filter((v) => v.rule === 'no-react-hooks')).toEqual([])
  })

  it('still flags real banned hook usage', async () => {
    const root = componentRepo(
      'widget',
      `import { useState } from 'react'\nexport function Widget() { const [a] = useState(0); return a }\n`,
    )
    const result = await runDoctor(root)
    expect(result.violations.some((v) => v.rule === 'no-react-hooks')).toBe(true)
  })

  it('still flags hardcoded aria-labels (JSX attribute strings)', async () => {
    const root = componentRepo(
      'widget',
      `export function Widget() { return <nav aria-label="Main navigation" /> }\n`,
    )
    const result = await runDoctor(root)
    expect(result.violations.some((v) => v.rule === 'no-hardcoded-strings')).toBe(true)
  })
})
