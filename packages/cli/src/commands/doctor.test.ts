import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  checkProjectDependencies,
  isAdopterProject,
  runDoctor,
  stripCommentsAndStrings,
} from './doctor.js'

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

describe('checkProjectDependencies', () => {
  let dir: string
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  function project(pkg: Record<string, unknown>): string {
    dir = mkdtempSync(join(tmpdir(), 'cascade-doctor-deps-'))
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg))
    return dir
  }

  it('flags every missing runtime dependency (incl. the signals peer)', () => {
    const root = project({ dependencies: {} })
    const findings = checkProjectDependencies(root)
    const required = findings.filter((f) => f.required).map((f) => f.package)
    expect(required).toContain('@cascivo/core')
    expect(required).toContain('@preact/signals-react')
    expect(required).toContain('@cascivo/themes')
  })

  it('marks @cascivo/i18n and @cascivo/charts as advisory, not required', () => {
    const root = project({
      dependencies: {
        '@cascivo/core': '^0.4.0',
        '@cascivo/tokens': '^0.5.0',
        '@cascivo/themes': '^0.4.0',
        '@preact/signals-react': '^3.0.0',
      },
    })
    const findings = checkProjectDependencies(root)
    expect(findings.every((f) => !f.required)).toBe(true)
    expect(findings.map((f) => f.package).sort()).toEqual(['@cascivo/charts', '@cascivo/i18n'])
  })

  it('returns nothing when the full set is present', () => {
    const root = project({
      dependencies: {
        '@cascivo/core': '^0.4.0',
        '@cascivo/tokens': '^0.5.0',
        '@cascivo/themes': '^0.4.0',
        '@cascivo/i18n': '^0.2.0',
        '@cascivo/charts': '^0.3.0',
        '@preact/signals-react': '^3.0.0',
      },
    })
    expect(checkProjectDependencies(root)).toEqual([])
  })
})

describe('isAdopterProject', () => {
  let dir: string
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('is true only when a cascivo.config exists', () => {
    dir = mkdtempSync(join(tmpdir(), 'cascade-doctor-adopter-'))
    expect(isAdopterProject(dir)).toBe(false)
    writeFileSync(join(dir, 'cascivo.config.ts'), 'export default {}\n')
    expect(isAdopterProject(dir)).toBe(true)
  })
})
