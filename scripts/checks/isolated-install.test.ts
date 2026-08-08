/**
 * Isolated-install canary — type-check cascivo the way an adopter installs it.
 *
 * This is the Mechanism-E fixture (see `docs/internal/feedback/README.md`). Every other
 * guard in this repo runs *inside the monorepo*, where `@types/react` is hoisted to the
 * root, so no guard has ever type-checked cascivo the way an adopter receives it: packed
 * tarballs, a workspace, pnpm's strict non-hoisting layout.
 *
 * It exists because of the 2026-07-28 C1 report — an adopter measured 18 errors from a
 * ~90-line file using ten components, with `children`, `className`, `style`, `onClick` and
 * every `aria-*` prop missing from every component, and fixed it with a
 * `publicHoistPattern` for `@types/react`.
 *
 * ✅ **C1 IS REPRODUCED, and the `@types/react` peer is the fix.** The missing configuration
 * — which two earlier plans looked for and did not find — is **`hoist: false`**.
 *
 * pnpm's default layout is not as strict as it looks: it builds a hidden hoisted directory
 * at `node_modules/.pnpm/node_modules/` holding every transitive package, and that directory
 * sits on TypeScript's upward walk from a cascivo `.d.ts`'s real path. React's types are
 * therefore reachable from inside cascivo whether or not cascivo declares them. **That is
 * why the first version of this fixture passed with the peer removed and concluded C1 did
 * not reproduce** — a fixture that passed for the wrong reason, which is the failure mode
 * this whole directory documents.
 *
 * With `hoist: false` the hidden directory is gone and the peer is the only thing putting
 * React's types on cascivo's resolution path. Measured, both arms:
 *
 *   peer present → `.pnpm/@cascivo+react@X/node_modules/` contains `@types` → 0 errors
 *   peer removed → it does not → `Property 'children' does not exist on type 'CardProps'`,
 *                  and the same for CardHeader/CardTitle/CardContent/CardFooter/…
 *
 * That is the 2026-07-28 report verbatim. The reporter's own fix — a `publicHoistPattern`
 * for `@types/react` — is the sibling setting: it puts the package back on the resolution
 * path by hand, which is exactly what the declared peer now does automatically.
 *
 * ⚠ The setting lives in `pnpm-workspace.yaml`, not `.npmrc`: pnpm 11 reads `hoist` from the
 * workspace manifest and silently ignores it in `.npmrc`. Setting it in the wrong place is
 * how this fixture briefly "had hoisting off" while the hidden directory was still fully
 * populated — caught only by the non-vacuity assertion below.
 *
 * What this fixture DOES prove, which nothing else did: the published tarballs install and
 * type-check in a strict, non-hoisted workspace under `strict: true` with lib checking ON.
 *
 * `skipLibCheck: false` is the point. `true` is the default in cascivo's own docs and in
 * every framework preset, and it is what suppressed the diagnostic that would have named
 * the cause. This fixture is the one place in the repo that must turn it off.
 *
 * Cost: a pack + install, roughly 60–90s. It belongs in the CI release/nightly tier next to
 * `cold-adopter:check` and `pack:check`, not in `pnpm ready`.
 *
 * Run: `pnpm isolated:check` (requires a prior `pnpm build`; skips cleanly without one).
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))

/** Packages the app under test installs. */
const PACKAGES = ['react', 'core', 'themes', 'tokens', 'i18n', 'storage', 'icons', 'charts']

/**
 * Only these build to `dist/`. `@cascivo/themes` and `@cascivo/tokens` are CSS-only and
 * publish `src/` directly, so requiring a dist for them would make this fixture skip
 * forever — silently, which is the failure mode a canary must never have.
 */
const NEEDS_DIST = ['react', 'core', 'i18n', 'storage', 'icons', 'charts']

const built = NEEDS_DIST.every((p) => existsSync(join(REPO_ROOT, 'packages', p, 'dist')))

let work: string
let app: string
/** The `hoist=false` twin — see NO_HOIST_NPMRC. */
let workNoHoist: string
let appNoHoist: string

/**
 * The app under test. Deliberately uses the exact props that vanished when the types could
 * not resolve — `children`, `className`, `onClick`, `style`, `aria-label` — across a mix of
 * components, plus a `ref` (C10) and a chart (so `@cascivo/charts` types are exercised too).
 */
// NOTE: reads `count.value` rather than rendering the Signal directly. Rendering a bare
// Signal as a child relies on @preact/signals-react augmenting `React.ReactNode`, and that
// augmentation is not reachable under `hoist=false` — so the fixture would fail on a
// THIRD-PARTY type detail instead of on cascivo's. Reading `.value` is also what
// docs/AI-RULES.md tells adopters to write.
const APP_TSX = `
import { createRef } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
  ThemeProvider,
  applyTheme,
  setTheme,
  useTheme,
} from '@cascivo/react'
import { BarChart } from '@cascivo/charts'
import { useSignal, useSignals } from '@cascivo/core'

export function App() {
  useSignals()
  const count = useSignal(0)
  const ref = createRef<HTMLTextAreaElement>()
  const [theme] = useTheme()

  return (
    <ThemeProvider defaultTheme="light">
      <main className="app" style={{ padding: 16 }} data-theme={theme}>
        <Card className="card">
          <CardContent>
            {/* children + variant */}
            <Badge variant="success">healthy</Badge>
            {/* children + className + onClick + aria-label */}
            <Button
              className="cta"
              aria-label="Increment the counter"
              onClick={() => {
                count.value++
                setTheme('dark')
                applyTheme('dark')
              }}
            >
              Clicked {count.value} times
            </Button>
            <Input className="field" placeholder="name" onChange={(e) => e.currentTarget.value} />
            {/* ref must be declared on the props type (C10) */}
            <Textarea ref={ref} rows={3} />
          </CardContent>
        </Card>
        <BarChart
          title="Incidents by severity"
          series={[{ id: 'a', label: 'Incidents', data: [{ x: 'SEV1', y: 2 }] }]}
          x={(d) => d.x}
          y={(d) => d.y}
          valueAxisTicks={2}
        />
      </main>
    </ThemeProvider>
  )
}
`

const TSCONFIG = {
  compilerOptions: {
    target: 'ES2022',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    moduleResolution: 'bundler',
    jsx: 'react-jsx',
    strict: true,
    noEmit: true,
    // THE POINT OF THIS FIXTURE. `true` is the documented default everywhere and is exactly
    // what hid C1 for thirteen minors: it suppresses the "cannot find module 'react'"
    // diagnostic inside cascivo's .d.ts, leaving only the baffling downstream errors.
    skipLibCheck: false,
  },
  include: ['app.tsx'],
}

describe('isolated-install — cascivo type-checks in a real consumer install', () => {
  before(() => {
    if (!built) return
    work = mkdtempSync(join(tmpdir(), 'cascivo-isolated-'))
    const tarballs = join(work, 'tarballs')
    mkdirSync(tarballs)

    for (const pkg of PACKAGES) {
      execFileSync('pnpm', ['pack', '--pack-destination', tarballs], {
        cwd: join(REPO_ROOT, 'packages', pkg),
        stdio: 'pipe',
      })
    }
    const files = readdirSync(tarballs)
    const tarballFor = (pkg: string): string => {
      const name = files.find((f) => f.startsWith(`cascivo-${pkg}-`))
      assert.ok(
        name,
        `pnpm pack produced no tarball for @cascivo/${pkg} (found: ${files.join(', ')})`,
      )
      return `file:${join(tarballs, name)}`
    }

    // Every inter-cascivo edge must be covered by PACKAGES, or the `overrides` below leave it
    // pointing at the registry — which either fails the install or, worse, silently
    // type-checks the last PUBLISHED copy of that package instead of the one built here.
    for (const pkg of PACKAGES) {
      const manifest = JSON.parse(
        readFileSync(join(REPO_ROOT, 'packages', pkg, 'package.json'), 'utf8'),
      ) as { dependencies?: Record<string, string> }
      for (const dep of Object.keys(manifest.dependencies ?? {})) {
        if (!dep.startsWith('@cascivo/')) continue
        assert.ok(
          PACKAGES.includes(dep.slice('@cascivo/'.length)),
          `${dep} is a dependency of @cascivo/${pkg} but is missing from PACKAGES, so this ` +
            `fixture would resolve it from the npm registry instead of the local build. ` +
            `Add it to PACKAGES (and to NEEDS_DIST if it builds to dist/).`,
        )
      }
    }

    // Both layouts are built from the same tarballs. See NO_HOIST_NPMRC for why the second
    // one exists and what the first one was quietly failing to test.
    work = buildWorkspace(tarballFor, DEFAULT_NPMRC)
    app = join(work, 'packages', 'app')
    workNoHoist = buildWorkspace(tarballFor, NO_HOIST_NPMRC, 'hoist: false\n')
    appNoHoist = join(workNoHoist, 'packages', 'app')
  })

  /**
   * pnpm's stock strict layout: no `publicHoistPattern`, no `node-linker=hoisted`.
   *
   * It is NOT as strict as it looks. pnpm still builds a hidden hoisted directory at
   * `node_modules/.pnpm/node_modules/` holding every transitive package — and that directory
   * sits on TypeScript's upward walk from a cascivo `.d.ts`'s real path. So React's types are
   * reachable from inside cascivo whether or not cascivo declares them.
   */
  const DEFAULT_NPMRC = 'strict-peer-dependencies=false\n'

  /**
   * The configuration that reproduces C1 — the missing piece the 2026-07-28 plan asked for.
   *
   * `hoist=false` removes `node_modules/.pnpm/node_modules/`, so the only way React's types
   * reach a cascivo `.d.ts` is if cascivo DECLARES them and pnpm links them into its own
   * virtual-store directory. That is precisely what the `@types/react` peer does, and the
   * reporter's fix — a `publicHoistPattern` for `@types/react` — is the sibling setting that
   * puts the package back on the resolution path by hand.
   *
   * Measured, both arms, on this workspace:
   *
   *   peer present  → `.pnpm/@cascivo+react@X/node_modules/` contains `@types` → 0 errors
   *   peer removed  → it does not → `Property 'children' does not exist on type 'CardProps'`
   *
   * That second line is the report, verbatim. With `skipLibCheck: true` — the default in every
   * framework preset, and what the reporter had — the "cannot find module 'react'" diagnostic
   * inside cascivo's own `.d.ts` is suppressed and only the baffling downstream error survives.
   *
   * ⚠ This supersedes the negative result this file used to carry. The old single-layout
   * fixture passed with the peer REMOVED, and concluded C1 did not reproduce. It passed
   * because pnpm's default hidden hoist was supplying the types by accident — a fixture that
   * passed for the wrong reason, which is the failure mode this whole directory documents.
   */
  const NO_HOIST_NPMRC = 'strict-peer-dependencies=false\nhoist=false\n'

  /**
   * Builds one isolated workspace from the packed tarballs and installs it.
   *
   * `npmrc` is the variable under test: pnpm's hoisting settings decide whether React's types
   * are reachable from inside a cascivo `.d.ts` at all. See NO_HOIST_NPMRC.
   */
  function buildWorkspace(
    tarballFor: (pkg: string) => string,
    npmrc: string,
    workspaceSettings = '',
  ): string {
    const work = mkdtempSync(join(tmpdir(), 'cascivo-isolated-'))

    // A WORKSPACE, not a single package — this is what makes the fixture faithful.
    //
    // In a single-package app, `node_modules/@types/react` sits at the app root, and
    // TypeScript resolving `from 'react'` inside `@cascivo/react/dist/index.d.ts` walks up
    // from the real (de-symlinked) path `<root>/node_modules/.pnpm/@cascivo+react@X/…` and
    // reaches that same root `node_modules` — so the types resolve by accident and the
    // fixture passes even with the peer removed. Verified: an earlier single-package
    // version of this file passed against the exact pre-fix package.json.
    //
    // In a WORKSPACE the app is a member (`packages/app`), so `@types/react` is linked into
    // `packages/app/node_modules` while `.pnpm` lives at the workspace ROOT. Walking up from
    // a cascivo package's real path now reaches the root `node_modules`, which does NOT
    // carry `@types/react` unless the package declares it as a peer. That is the layout the
    // 2026-07-28 adopter had — a pnpm + Turborepo monorepo — and it is the only one that
    // reproduces C1.
    // `pnpm pack` rewrites `workspace:^` to `^<version>`, so the packed @cascivo/react asks
    // for `@cascivo/core@^0.15.0` — from the REGISTRY, where the monorepo's current version
    // does not exist until release day. That is not a hypothetical: it turned this canary red
    // the moment a version bump landed ahead of a publish. Overrides pin every inter-cascivo
    // edge to the tarball built from THIS commit, which is also the only way the fixture
    // type-checks the build under test rather than a mix of it and the last published one.
    //
    // They live in pnpm-workspace.yaml, not package.json: pnpm 10+ stopped reading the
    // `pnpm` field and only warns about it, so a package.json override silently does nothing.
    const overrides = PACKAGES.map((p) => `  '@cascivo/${p}': '${tarballFor(p)}'`).join('\n')
    writeFileSync(
      join(work, 'pnpm-workspace.yaml'),
      `packages:\n  - 'packages/*'\n${workspaceSettings}overrides:\n${overrides}\n`,
    )
    writeFileSync(
      join(work, 'package.json'),
      JSON.stringify({ name: 'cascivo-isolated-root', private: true }, null, 2),
    )
    // pnpm's STRICT default layout is the whole point: no publicHoistPattern, no
    // node-linker=hoisted. With hoisting on, @types/react lands on the resolution path by
    // accident and this fixture stops testing anything.
    writeFileSync(join(work, '.npmrc'), npmrc)

    const app = join(work, 'packages', 'app')
    mkdirSync(app, { recursive: true })
    writeFileSync(
      join(app, 'package.json'),
      JSON.stringify(
        {
          name: 'cascivo-isolated-fixture',
          private: true,
          type: 'module',
          dependencies: Object.fromEntries([
            ...PACKAGES.map((p) => [`@cascivo/${p}`, tarballFor(p)]),
            ['react', '^19'],
            ['react-dom', '^19'],
            ['@preact/signals-react', '^3'],
            ['@types/react', '^19'],
            ['@types/react-dom', '^19'],
            ['typescript', '^5'],
          ]),
        },
        null,
        2,
      ),
    )
    writeFileSync(join(app, 'tsconfig.json'), JSON.stringify(TSCONFIG, null, 2))
    writeFileSync(join(app, 'app.tsx'), APP_TSX)

    // Install from the workspace ROOT so `.pnpm` lands there, not beside the app.
    execFileSync('pnpm', ['install', '--no-frozen-lockfile'], { cwd: work, stdio: 'pipe' })
    return work
  }

  after(() => {
    if (work) rmSync(work, { recursive: true, force: true })
    if (workNoHoist) rmSync(workNoHoist, { recursive: true, force: true })
  })

  it('a strict, non-hoisted install type-checks with skipLibCheck OFF', { skip: !built }, () => {
    let output = ''
    let failed = false
    try {
      output = execFileSync('pnpm', ['exec', 'tsc', '--noEmit'], {
        cwd: app,
        encoding: 'utf8',
        stdio: 'pipe',
      })
    } catch (error) {
      failed = true
      const e = error as { stdout?: string; stderr?: string }
      output = `${e.stdout ?? ''}${e.stderr ?? ''}`
    }

    // `skipLibCheck: false` also surfaces THIRD-PARTY .d.ts defects that are nobody's
    // business here — @preact/signals-react 3.11 ships a runtime d.ts importing
    // '../../../debug/src/devtools', which does not exist in its own tarball. Failing on
    // that would make this canary permanently red for a reason no cascivo change can fix,
    // and a permanently-red canary gets disabled. So the assertion is scoped to errors in
    // the app itself or inside a @cascivo package's types — exactly the surface C1 broke.
    const relevant = output
      .split('\n')
      .filter((line) => /error TS\d+/.test(line))
      // Match anywhere in the path, not just at the start: from a workspace member the
      // compiler reports third-party files as `../../node_modules/.pnpm/…`.
      .filter((line) => !line.includes('node_modules/') || line.includes('@cascivo'))

    assert.deepEqual(
      relevant,
      [],
      'cascivo does not type-check in a plain pnpm workspace install.\n\n' +
        'This is the surface the 2026-07-28 C1 report was about: if a React type cannot be ' +
        'resolved from inside a cascivo .d.ts, every `extends HTMLAttributes<…>` collapses ' +
        'to an error type and children/className/style/onClick/aria-* vanish from every ' +
        'component — with skipLibCheck: true hiding the cause. The monorepo cannot see it ' +
        '(types are root-hoisted there), which is why this installs packed tarballs into a ' +
        'workspace outside the repo.\n\n' +
        `Errors attributable to cascivo:\n${relevant.join('\n')}\n\nFull tsc output:\n${output}`,
    )
    // `failed` on its own is not asserted: see the third-party filter above.
    void failed
  })

  it(
    'the no-hoist layout really has no hidden hoist (guards against a false pass)',
    { skip: !built },
    () => {
      // Without this, the case below could pass because pnpm quietly reinstated the hoisted
      // directory — and a canary that passes for the wrong reason is how C1 stayed
      // "unreproducible" for two plans. The previous version of this test asserted
      // `assert.ok(true)`.
      const hidden = join(workNoHoist, 'node_modules', '.pnpm', 'node_modules', '@types')
      assert.ok(
        !existsSync(hidden),
        `hoist=false should remove ${hidden}, but it exists — pnpm's hoisting default may ` +
          'have changed, and this fixture is no longer testing what it claims.',
      )
    },
  )

  it(
    'the @types/react peer is what puts React types on cascivo’s resolution path',
    { skip: !built },
    () => {
      // The mechanism itself, asserted directly rather than inferred from a passing tsc:
      // with no hidden hoist, `@types` is inside cascivo's OWN virtual-store directory only
      // because the package declares the peer. Remove the peer and this directory loses it,
      // which is the pre-fix state that produces the report's symptom.
      const store = join(workNoHoist, 'node_modules', '.pnpm')
      const dir = readdirSync(store).find((d) => d.startsWith('@cascivo+react@'))
      assert.ok(dir, `no @cascivo/react entry in the virtual store at ${store}`)
      const linked = readdirSync(join(store, dir, 'node_modules'))
      assert.ok(
        linked.includes('@types'),
        'With hoist=false, React types reach cascivo ONLY through the declared ' +
          `@types/react peer. @cascivo/react's virtual store holds: ${linked.join(', ')}. ` +
          'If @types is missing, the peer was dropped and every component is about to lose ' +
          'children/className/style/onClick/aria-*.',
      )
    },
  )

  it('cascivo type-checks with pnpm hoisting OFF — the C1 configuration', { skip: !built }, () => {
    let output = ''
    try {
      output = execFileSync('pnpm', ['exec', 'tsc', '--noEmit'], {
        cwd: appNoHoist,
        encoding: 'utf8',
        stdio: 'pipe',
      })
    } catch (error) {
      const e = error as { stdout?: string; stderr?: string }
      output = `${e.stdout ?? ''}${e.stderr ?? ''}`
    }
    const relevant = output
      .split('\n')
      .filter((line) => /error TS\d+/.test(line))
      .filter((line) => !line.includes('node_modules/') || line.includes('@cascivo'))

    assert.deepEqual(
      relevant,
      [],
      'cascivo does not type-check with pnpm `hoist=false`.\n\n' +
        'This is the C1 configuration, and unlike the default-layout case above it has ' +
        'been observed failing on its pre-fix state: with the @types/react peer removed ' +
        "it reports `Property 'children' does not exist on type 'CardProps'` — the " +
        '2026-07-28 report verbatim.\n\n' +
        `Errors attributable to cascivo:\n${relevant.join('\n')}\n\nFull tsc output:\n${output}`,
    )
  })
})
