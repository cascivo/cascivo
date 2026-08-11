/**
 * `cascivo create` output contract.
 *
 * **This closes the guard suite's largest blind spot.** `pnpm ready` runs ~25 checks and
 * not one of them ever executed the scaffolder and looked at what it wrote. The nearest
 * thing, `cold-adopter.test.ts`, scopes itself to the offline-docs leg and explicitly defers
 * the app leg. So the very first artifact an adopter touches was the least-guarded thing in
 * the project — which is why it shipped five violations of cascivo's own documented rules at
 * once:
 *
 * 1. `"latest"` for every cascivo dependency, against GETTING-STARTED.md's "pin **exact**
 *    versions (no `^`)".
 * 2. `@cascivo/core` as a direct dependency, which AI-RULES.md forbids on the prebuilt path
 *    — and then imported from it.
 * 3. `@cascivo/tokens` likewise, plus a bare `import '@cascivo/tokens'` no guide mentions.
 * 4. `@preact/signals-react` absent from `dependencies` although the generated `App.tsx`
 *    calls `useSignals()`. It resolved only by hoisting — a phantom dependency.
 * 5. `AGENTS.md` naming an app layer slot (`cascivo.example`) that the `index.html` written
 *    in the same run did not declare, so an agent following its instructions emitted CSS
 *    into an undeclared layer.
 *
 * Assertions run against the **built CLI**, driven into a temp directory outside the repo
 * tree — the same standard `cold-adopter.test.ts` sets: a fix is not done because the repo
 * is green, it is done when the thing an adopter actually runs produces the right thing.
 *
 * Requires a prior `vp run cascivo#build`.
 *
 * Run: `pnpm scaffold:check` (and in `pnpm ready`).
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import { after, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CLI = join(REPO_ROOT, 'packages/cli/dist/index.mjs')

const workdir = mkdtempSync(join(tmpdir(), 'cascivo-scaffold-'))
const APP = join(workdir, 'acme-console')

after(() => rmSync(workdir, { recursive: true, force: true }))

if (!existsSync(CLI)) {
  throw new Error(`Built CLI not found at ${CLI}. Run \`vp run cascivo#build\` first.`)
}

execFileSync(
  process.execPath,
  [CLI, 'create', 'acme-console', '--yes', '--theme', 'dark', '--sections', 'Overview,Deployments'],
  { cwd: workdir, stdio: 'pipe' },
)

/** Every generated file, keyed by its path relative to the app root. */
function collect(dir: string, base = dir): Map<string, string> {
  const out = new Map<string, string>()
  for (const item of readdirSync(dir)) {
    const full = join(dir, item)
    if (statSync(full).isDirectory()) {
      for (const [k, v] of collect(full, base)) out.set(k, v)
    } else {
      out.set(relative(base, full), readFileSync(full, 'utf8'))
    }
  }
  return out
}

const files = collect(APP)

function file(path: string): string {
  const contents = files.get(path)
  assert.ok(contents !== undefined, `scaffold did not write ${path}`)
  return contents
}

function pkg(): {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
} {
  return JSON.parse(file('package.json')) as ReturnType<typeof pkg>
}

describe('scaffold-contract — cascivo create obeys cascivo’s own docs', () => {
  it('pins exact versions for every cascivo dependency', () => {
    const all = { ...pkg().dependencies, ...pkg().devDependencies }
    const loose = Object.entries(all)
      .filter(([name]) => name.startsWith('@cascivo/'))
      .filter(([, spec]) => !/^\d+\.\d+\.\d+$/.test(spec))
      .map(([name, spec]) => `${name}: "${spec}"`)
    assert.deepEqual(
      loose,
      [],
      'GETTING-STARTED.md tells adopters to pin exact versions because the cascivo packages\n' +
        'version independently on 0.x. The scaffold must lead by example:\n' +
        `${loose.join('\n')}`,
    )
  })

  it('declares no dependency the prebuilt path forbids', () => {
    const deps = { ...pkg().dependencies, ...pkg().devDependencies }
    for (const forbidden of ['@cascivo/core', '@cascivo/tokens']) {
      assert.equal(
        deps[forbidden],
        undefined,
        `${forbidden} must not be a direct dependency of a prebuilt-path app — it is\n` +
          'transitive there, and the docs explicitly forbid declaring it.',
      )
    }
  })

  it('declares @preact/signals-react, which the generated App.tsx needs', () => {
    // The scaffold calls `useSignals()`. Omitting the peer worked only by hoisting and
    // breaks under pnpm's strict layout.
    assert.ok(
      pkg().dependencies?.['@preact/signals-react'] !== undefined,
      '@preact/signals-react is a required peer used by the generated App.tsx',
    )
  })

  it('every @cascivo import in generated source is a declared dependency', () => {
    // The general form of violations 2-4: a phantom dependency is an import with no
    // matching entry in package.json, whatever the package happens to be.
    const declared = new Set([
      ...Object.keys(pkg().dependencies ?? {}),
      ...Object.keys(pkg().devDependencies ?? {}),
    ])
    const phantoms: string[] = []
    for (const [path, contents] of files) {
      if (!/\.(tsx?|jsx?)$/.test(path)) continue
      for (const m of contents.matchAll(/from '(@cascivo\/[^'/]+)(?:\/[^']*)?'/g)) {
        if (!declared.has(m[1]!)) phantoms.push(`${path} imports ${m[1]}`)
      }
      for (const m of contents.matchAll(/^import '(@cascivo\/[^'/]+)(?:\/[^']*)?'/gm)) {
        if (!declared.has(m[1]!)) phantoms.push(`${path} side-effect imports ${m[1]}`)
      }
    }
    assert.deepEqual(phantoms, [], `Phantom dependencies:\n${phantoms.join('\n')}`)
  })

  it('writes no cascivo.config on the prebuilt path', () => {
    // Its presence is what made `doctor` classify a Path B app as copy-paste, so
    // `doctor --ci` failed a correctly-installed app and advised the forbidden installs.
    for (const path of [...files.keys()]) {
      assert.ok(
        !path.startsWith('cascivo.config.'),
        `scaffold wrote ${path}; \`cascivo add\` writes the config when it is first needed`,
      )
    }
  })

  it('declares every layer its own AGENTS.md tells the agent to use', () => {
    const declared = new Set(
      (/@layer ([^;]+);/.exec(file('index.html'))?.[1] ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    // Layer names AGENTS.md tells the agent to WRITE INTO: a backticked bare name, or one
    // introduced by `@layer`. Deliberately not every `cascivo.*` string in the file —
    // `cascivo.com` is a domain, and `cascivo.card.status` appears in a worked example of
    // what NOT to do. Both would make this assertion fail for the wrong reason.
    const agents = file('AGENTS.md')
    const used = [
      ...[...agents.matchAll(/`(cascivo\.[a-z]+)`/g)].map((m) => m[1]!),
      ...[...agents.matchAll(/@layer\s+([^;{]+)/g)].flatMap((m) =>
        m[1]!
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.startsWith('cascivo.')),
      ),
    ]
    assert.ok(used.includes('cascivo.example'), 'AGENTS.md must name the app layer slot')
    const undeclared = [...new Set(used)].filter((l) => !declared.has(l))
    assert.deepEqual(
      undeclared,
      [],
      'AGENTS.md tells the agent to write into layers that index.html never declares:\n' +
        `${undeclared.join(', ')}\n` +
        'An undeclared layer sorts last and beats every cascivo layer — the exact opposite\n' +
        'of what the ordering is for.',
    )
  })

  it('pre-wires the react-hooks/immutability escape so `lint` passes on a fresh app', () => {
    // The scaffold ships `signal.value = …` in App.tsx. Under eslint-plugin-react-hooks@7
    // recommended-latest that is an error, so an unwired scaffold fails its own lint script.
    const config = file('eslint.config.js')
    assert.match(config, /@cascivo\/eslint-config/)
    assert.ok(
      pkg().devDependencies?.['@cascivo/eslint-config'] !== undefined,
      'eslint.config.js imports @cascivo/eslint-config; it must be a devDependency',
    )
    // Spread last or the plugin's recommended-latest re-enables the rule.
    const cascivoAt = config.indexOf('...cascivo')
    const pluginAt = config.indexOf('recommended-latest')
    assert.ok(cascivoAt > pluginAt, '...cascivo must be spread AFTER recommended-latest')
  })

  it('ships lint/typecheck/format scripts so the app drops into a CI pipeline', () => {
    for (const script of ['lint', 'typecheck', 'build', 'format']) {
      assert.ok(pkg().scripts?.[script] !== undefined, `missing "${script}" script`)
    }
    // `build` must typecheck. `vite build` alone goes green with type errors, which is how a
    // reporter shipped 37 of them without noticing (2026-08-08 report A).
    assert.match(pkg().scripts!['build']!, /tsc/, '`build` must run tsc, not just vite build')
  })

  it('writes no inline styles — the rule its own AGENTS.md gives the agent', () => {
    // The generated AGENTS.md says "CSS custom properties only — no inline styles", and the
    // generated section components then used `style={{ padding: … }}` to work around
    // AppShell having no content inset. AppShell now owns that inset, so the workaround —
    // and the contradiction it taught by example — is gone (2026-08-08 report B).
    const offenders: string[] = []
    for (const [path, contents] of files) {
      if (!/\.tsx?$/.test(path)) continue
      if (/style=\{\{/.test(contents)) offenders.push(path)
    }
    assert.deepEqual(
      offenders,
      [],
      'Generated source uses inline styles, which the generated AGENTS.md forbids. Use ' +
        'cascivo layout primitives (Flex/Grid) and AppShell `padding` instead.',
    )
  })

  it('every generated import resolves to a declared dependency or a relative path', () => {
    const declared = new Set([
      ...Object.keys(pkg().dependencies ?? {}),
      ...Object.keys(pkg().devDependencies ?? {}),
    ])
    const unresolved: string[] = []
    for (const [path, contents] of files) {
      if (!/\.(tsx?|jsx?)$/.test(path)) continue
      for (const m of contents.matchAll(/from '([^']+)'/g)) {
        const spec = m[1]!
        if (spec.startsWith('.') || spec.startsWith('node:')) continue
        const pkgName = spec.startsWith('@')
          ? spec.split('/').slice(0, 2).join('/')
          : spec.split('/')[0]!
        if (!declared.has(pkgName)) unresolved.push(`${path} imports ${pkgName}`)
      }
    }
    assert.deepEqual(unresolved, [], `Undeclared imports:\n${unresolved.join('\n')}`)
  })

  it('keeps the seeded brand short enough to render in a header', () => {
    // `cascivo create vercel-dashboard-2026-07-30-take2` seeded a 45-character brand into
    // the top-left of every page.
    const long = join(workdir, 'vercel-dashboard-clone-2026-07-30-take2')
    execFileSync(
      process.execPath,
      [CLI, 'create', 'vercel-dashboard-clone-2026-07-30-take2', '--yes', '--theme', 'dark'],
      { cwd: workdir, stdio: 'pipe' },
    )
    const app = readFileSync(join(long, 'src/App.tsx'), 'utf8')
    const brand = /brand=\{\{ name: '([^']*)' \}\}/.exec(app)?.[1]
    assert.ok(brand !== undefined, 'could not find the seeded brand in App.tsx')
    assert.ok(brand.length <= 24, `brand "${brand}" is ${brand.length} chars`)
    assert.match(file('src/App.tsx'), /brand=\{\{ name: 'Acme Console' \}\}/)
  })

  it('the pinned versions match the workspace', () => {
    // The generated module is only correct if `pnpm regen` ran; a stale pin would ship an
    // app referencing a version that does not exist yet.
    const generated = readFileSync(
      join(REPO_ROOT, 'packages/cli/src/generated/versions.ts'),
      'utf8',
    )
    for (const [name, spec] of Object.entries(pkg().dependencies ?? {})) {
      if (!name.startsWith('@cascivo/')) continue
      const real = JSON.parse(
        readFileSync(join(REPO_ROOT, 'packages', name.split('/')[1]!, 'package.json'), 'utf8'),
      ) as { version: string }
      assert.equal(spec, real.version, `${name} pin is stale — run \`pnpm regen\``)
    }
    assert.match(generated, /GENERATED by scripts\/registry\/cli-versions\.ts/)
  })
})
