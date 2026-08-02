import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  checkProjectDependencies,
  checkSignalsCompat,
  checkDuplicateCore,
  checkSsrConfig,
  detectInstallPath,
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

describe('detectInstallPath', () => {
  let dir: string
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  function project(pkg: Record<string, unknown> | null, opts: { copied?: boolean } = {}): string {
    dir = mkdtempSync(join(tmpdir(), 'cascade-doctor-path-'))
    if (pkg !== null) writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg))
    if (opts.copied === true) {
      mkdirSync(join(dir, 'src/components/ui'), { recursive: true })
      writeFileSync(join(dir, 'src/components/ui/button.tsx'), 'export const Button = () => null\n')
    }
    return dir
  }

  it('detects the prebuilt path from an @cascivo/react dependency', () => {
    expect(detectInstallPath(project({ dependencies: { '@cascivo/react': '0.14.0' } }))).toBe(
      'prebuilt',
    )
  })

  it('detects the copied path from vendored source', () => {
    expect(detectInstallPath(project({ dependencies: {} }, { copied: true }))).toBe('copied')
  })

  it('detects hybrid when the app both depends on the package and copied source', () => {
    const root = project({ dependencies: { '@cascivo/react': '0.14.0' } }, { copied: true })
    expect(detectInstallPath(root)).toBe('hybrid')
  })

  it('a cascivo.config alone is NOT evidence of a copy-paste app', () => {
    // The regression: `cascivo create` wrote a config into every scaffold, so every
    // prebuilt-path app was judged copy-paste and told to install the forbidden packages.
    const root = project({ dependencies: {} })
    writeFileSync(
      join(root, 'cascivo.config.ts'),
      "export default { outputDir: 'src/components/ui' }\n",
    )
    expect(detectInstallPath(root)).toBe('unknown')
  })

  it('honours a custom outputDir from the config', () => {
    const root = project({ dependencies: {} })
    writeFileSync(join(root, 'cascivo.config.ts'), "export default { outputDir: 'app/ui' }\n")
    mkdirSync(join(root, 'app/ui'), { recursive: true })
    writeFileSync(join(root, 'app/ui/card.tsx'), 'export const Card = () => null\n')
    expect(detectInstallPath(root)).toBe('copied')
  })

  it('is unknown with no package.json', () => {
    expect(detectInstallPath(project(null))).toBe('unknown')
  })
})

describe('checkProjectDependencies', () => {
  let dir: string
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  function project(pkg: Record<string, unknown>, opts: { copied?: boolean } = {}): string {
    dir = mkdtempSync(join(tmpdir(), 'cascade-doctor-deps-'))
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg))
    if (opts.copied === true) {
      mkdirSync(join(dir, 'src/components/ui'), { recursive: true })
      writeFileSync(join(dir, 'src/components/ui/button.tsx'), 'export const Button = () => null\n')
    }
    return dir
  }

  it('flags every missing runtime dependency on the copied path (incl. the signals peer)', () => {
    const root = project({ dependencies: {} }, { copied: true })
    const required = checkProjectDependencies(root)
      .filter((f) => f.required)
      .map((f) => f.package)
    expect(required).toContain('@cascivo/core')
    expect(required).toContain('@preact/signals-react')
    expect(required).toContain('@cascivo/themes')
  })

  it('does NOT demand @cascivo/core or @cascivo/tokens on the prebuilt path', () => {
    // The reported bug: `doctor --ci` failed a correctly-installed Path B app and told the
    // adopter to install two packages the docs explicitly forbid there.
    const root = project({
      dependencies: {
        '@cascivo/react': '0.14.0',
        '@cascivo/themes': '0.4.9',
        '@preact/signals-react': '>=3.0.0',
      },
    })
    const required = checkProjectDependencies(root)
      .filter((f) => f.required)
      .map((f) => f.package)
    expect(required).toEqual([])
  })

  it('flags @cascivo/core and @cascivo/tokens as forbidden on the prebuilt path', () => {
    const root = project({
      dependencies: {
        '@cascivo/react': '0.14.0',
        '@cascivo/themes': '0.4.9',
        '@preact/signals-react': '>=3.0.0',
        '@cascivo/core': '0.7.1',
        '@cascivo/tokens': '0.5.6',
      },
    })
    const forbidden = checkProjectDependencies(root).filter((f) => f.kind === 'forbidden')
    expect(forbidden.map((f) => f.package).sort()).toEqual(['@cascivo/core', '@cascivo/tokens'])
    expect(forbidden.every((f) => f.required)).toBe(true)
  })

  it('does not call @cascivo/core forbidden on a hybrid app that copied source', () => {
    // A hybrid legitimately needs it for the vendored files; flagging it there would be the
    // same bug in mirror image.
    const root = project(
      { dependencies: { '@cascivo/react': '0.14.0', '@cascivo/core': '0.7.1' } },
      { copied: true },
    )
    expect(checkProjectDependencies(root).some((f) => f.kind === 'forbidden')).toBe(false)
  })

  it('advises on nothing when the install path is unknown', () => {
    expect(checkProjectDependencies(project({ dependencies: {} }))).toEqual([])
  })

  it('marks @cascivo/i18n and @cascivo/charts as advisory, not required', () => {
    const root = project(
      {
        dependencies: {
          '@cascivo/core': '^0.4.0',
          '@cascivo/tokens': '^0.5.0',
          '@cascivo/themes': '^0.4.0',
          '@preact/signals-react': '^3.0.0',
        },
      },
      { copied: true },
    )
    const findings = checkProjectDependencies(root)
    expect(findings.every((f) => !f.required)).toBe(true)
    expect(findings.map((f) => f.package).sort()).toEqual(['@cascivo/charts', '@cascivo/i18n'])
  })

  it('returns nothing when the full copied-path set is present', () => {
    const root = project(
      {
        dependencies: {
          '@cascivo/core': '^0.4.0',
          '@cascivo/tokens': '^0.5.0',
          '@cascivo/themes': '^0.4.0',
          '@cascivo/i18n': '^0.2.0',
          '@cascivo/charts': '^0.3.0',
          '@preact/signals-react': '^3.0.0',
        },
      },
      { copied: true },
    )
    expect(checkProjectDependencies(root)).toEqual([])
  })
})

describe('checkSignalsCompat', () => {
  let dir: string
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  function project(versions: Record<string, string>): string {
    dir = mkdtempSync(join(tmpdir(), 'cascade-doctor-signals-'))
    for (const [pkg, version] of Object.entries(versions)) {
      const pkgDir = join(dir, 'node_modules', pkg)
      mkdirSync(pkgDir, { recursive: true })
      writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ name: pkg, version }))
    }
    return dir
  }

  it('errors on signals 2.x with React 19', async () => {
    const root = project({ '@preact/signals-react': '2.3.0', react: '19.2.0' })
    const finding = await checkSignalsCompat(root)
    expect(finding?.severity).toBe('error')
    expect(finding?.hint).toContain('@preact/signals-react@^3')
  })

  it('warns on signals 2.x with React 18', async () => {
    const root = project({ '@preact/signals-react': '2.3.0', react: '18.3.0' })
    const finding = await checkSignalsCompat(root)
    expect(finding?.severity).toBe('warning')
  })

  it('is clean on signals 3.x', async () => {
    const root = project({ '@preact/signals-react': '3.10.1', react: '19.2.0' })
    expect(await checkSignalsCompat(root)).toBeNull()
  })

  it('is silent when signals is absent', async () => {
    const root = project({ react: '19.2.0' })
    expect(await checkSignalsCompat(root)).toBeNull()
  })
})

describe('checkSsrConfig', () => {
  let dir: string
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  function project(pkg: Record<string, unknown>, viteConfig?: string): string {
    dir = mkdtempSync(join(tmpdir(), 'cascade-doctor-ssr-'))
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg))
    if (viteConfig !== undefined) writeFileSync(join(dir, 'vite.config.ts'), viteConfig)
    return dir
  }

  it('warns on a Vite SSR framework with no noExternal config', () => {
    const root = project({ dependencies: { '@tanstack/react-start': '1.170.0' } })
    const hint = checkSsrConfig(root)
    expect(hint).toContain('ssr.noExternal')
    expect(hint).toContain('@tanstack/react-start')
  })

  it('is silent when noExternal already covers cascivo', () => {
    const root = project(
      { dependencies: { '@tanstack/react-start': '1.170.0' } },
      `export default { ssr: { noExternal: [/^@cascivo\\//] } }`,
    )
    expect(checkSsrConfig(root)).toBeNull()
  })

  it('is silent when the cascivoSsr plugin is used', () => {
    const root = project(
      { dependencies: { 'vite-ssr': '1.0.0' } },
      `import { cascivoSsr } from '@cascivo/vite-plugin'\nexport default { plugins: [cascivoSsr()] }`,
    )
    expect(checkSsrConfig(root)).toBeNull()
  })

  it('is silent when no Vite SSR framework is present', () => {
    const root = project({ dependencies: { next: '15.0.0' } })
    expect(checkSsrConfig(root)).toBeNull()
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

describe('checkDuplicateCore', () => {
  let dir: string
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  function install(root: string | null, nested: Record<string, string>): string {
    dir = mkdtempSync(join(tmpdir(), 'cascade-doctor-dup-'))
    if (root !== null) {
      mkdirSync(join(dir, 'node_modules/@cascivo/core'), { recursive: true })
      writeFileSync(
        join(dir, 'node_modules/@cascivo/core/package.json'),
        JSON.stringify({ name: '@cascivo/core', version: root }),
      )
    }
    for (const [owner, version] of Object.entries(nested)) {
      const base = join(dir, 'node_modules', owner)
      mkdirSync(join(base, 'node_modules/@cascivo/core'), { recursive: true })
      writeFileSync(join(base, 'package.json'), JSON.stringify({ name: owner, version: '0.0.0' }))
      writeFileSync(
        join(base, 'node_modules/@cascivo/core/package.json'),
        JSON.stringify({ name: '@cascivo/core', version }),
      )
    }
    return dir
  }

  it('is null when one @cascivo/core is hoisted', async () => {
    expect(await checkDuplicateCore(install('0.7.1', {}))).toBeNull()
  })

  it('is null when a nested copy matches the hoisted one', async () => {
    const root = install('0.7.1', { '@cascivo/charts': '0.7.1' })
    expect(await checkDuplicateCore(root)).toBeNull()
  })

  it('reports a nested copy that differs', async () => {
    // Two copies of @cascivo/core means two signal registries: a write through one is
    // invisible to components subscribed through the other, with no error at all.
    const root = install('0.7.1', { '@cascivo/charts': '0.6.0' })
    const finding = await checkDuplicateCore(root)
    expect(finding?.root).toBe('0.7.1')
    expect(finding?.nested).toEqual(['@cascivo/charts → 0.6.0'])
  })
})
