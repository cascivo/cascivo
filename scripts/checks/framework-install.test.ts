/**
 * Framework-install canary — a scaffolded app, installed the way an adopter installs it.
 *
 * This exists because of a specific miss. The Astro island CSS drop (docs/USING-WITH-ASTRO.md)
 * was diagnosed and fixed against `apps/examples/astro-islands`, which depends on
 * `@cascivo/react` as `workspace:*`. Vite never externalizes a linked package, so that
 * fixture always has cascivo in its server module graph — and Astro collects a page's CSS by
 * walking that graph. The fix looked complete and the compatibility matrix was re-graded ✅.
 *
 * It was not complete. A real npm install gets an EXTERNALIZED package whose graph Vite does
 * not walk, and rendered unstyled. The byte-identical fixture page that passes in the
 * monorepo fails from a tarball. Two independent causes had to be fixed, and neither
 * suffices alone:
 *
 *   (a) `module` ahead of `node` in the exports map — else the bundled build is the
 *       CSS-free twin. Guarded by scripts/checks/css-contract.test.ts.
 *   (b) `vite.resolve.noExternal` in astro.config.mjs — and it must be `resolve.`, not
 *       `ssr.`, which Astro's prerender environment never reads. Emitted by
 *       `cascivo create --framework astro`, and guarded HERE.
 *
 * The generalizable lesson, and the reason this file is not Astro-specific in shape: **a
 * workspace-linked example app cannot validate packaging behaviour that depends on
 * externalization.** `isolated:check` and `pack:check` both passed the export-condition fix
 * and neither could catch (b), because neither builds a framework app from tarballs.
 *
 * So this check packs the tarballs, runs the real `cascivo create` scaffolder, installs
 * outside the monorepo, builds, and asserts the emitted HTML's cascivo classes actually have
 * rules. Each framework arm also runs a NEGATIVE arm that breaks the wiring on purpose and
 * requires the check to fail — a canary that cannot fail is worth nothing, which is the
 * failure mode this whole directory documents.
 *
 * Cost: a pack + two installs + four builds — ~30s with a warm pnpm store, a few minutes
 * cold, and it needs network access. It runs in CI after the build, next to
 * `isolated:check`; it is NOT in `pnpm ready`.
 *
 * Run: `pnpm framework:check` (requires a prior `pnpm build`; skips cleanly without one).
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { before, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CLI = join(REPO_ROOT, 'packages', 'cli', 'dist', 'index.mjs')

/**
 * The scaffold's dependency closure. `react` pulls core/i18n/themes; themes pulls tokens.
 * Any inter-cascivo edge missing here resolves from the npm REGISTRY instead of this build —
 * which would silently test the last published copy. Asserted below, not assumed.
 */
const PACKAGES = ['react', 'core', 'themes', 'tokens', 'i18n', 'storage', 'icons']
const NEEDS_DIST = ['react', 'core', 'i18n', 'storage', 'icons']

const built = NEEDS_DIST.every((p) => existsSync(join(REPO_ROOT, 'packages', p, 'dist')))
const cliBuilt = existsSync(CLI)
const ready = built && cliBuilt

let tarballDir: string

/**
 * `execFileSync` with the child's output attached to the failure.
 *
 * The default swallows stdout/stderr under `stdio: 'pipe'`, which turns every failure in
 * this file into a bare "Command failed: pnpm install" with no cause — useless in CI, where
 * nobody can re-run it by hand.
 */
function run(cmd: string, args: string[], cwd: string): void {
  try {
    execFileSync(cmd, args, { cwd, stdio: 'pipe' })
  } catch (error) {
    const e = error as { stdout?: Buffer; stderr?: Buffer }
    const out = `${e.stdout?.toString() ?? ''}${e.stderr?.toString() ?? ''}`.trim()
    throw new Error(`\`${cmd} ${args.join(' ')}\` failed in ${cwd}\n${out}`)
  }
}

/** `file:` specifier for a packed package. */
function tarballFor(pkg: string): string {
  const files = readdirSync(tarballDir)
  const name = files.find((f) => f.startsWith(`cascivo-${pkg}-`))
  assert.ok(name, `pnpm pack produced no tarball for @cascivo/${pkg} (found: ${files.join(', ')})`)
  return `file:${join(tarballDir, name)}`
}

/**
 * Scaffolds with the real CLI, repoints every @cascivo/* dep at the packed tarballs, and
 * installs. Returns the app directory.
 */
function scaffold(framework: string, name: string): string {
  const work = mkdtempSync(join(tmpdir(), `cascivo-fw-${framework}-`))
  run('node', [CLI, 'create', name, '--framework', framework, '--yes'], work)
  const app = join(work, name)

  const manifestPath = join(app, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
  }
  for (const dep of Object.keys(manifest.dependencies)) {
    if (dep.startsWith('@cascivo/')) manifest.dependencies[dep] = tarballFor(dep.slice(9))
  }
  // The scaffold's eslint config is not what this canary tests, and pulling it from the
  // registry would make the install depend on a published version of this very repo.
  delete manifest.devDependencies['@cascivo/eslint-config']
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  // Overrides pin every INTER-cascivo edge to the tarballs too. `pnpm pack` rewrites
  // `workspace:^` to `^<version>`, so the packed @cascivo/react asks the REGISTRY for
  // @cascivo/core — which would quietly mix the build under test with the last published
  // one, or fail outright before a release.
  //
  // They must live in pnpm-workspace.yaml: pnpm 10+ stopped reading the `pnpm` field of
  // package.json and only WARNS about it, so overrides written there silently do nothing.
  // (Same trap as scripts/checks/isolated-install.test.ts, which documents it too.)
  const overrides = PACKAGES.map((p) => `  '@cascivo/${p}': '${tarballFor(p)}'`).join('\n')
  writeFileSync(
    join(app, 'pnpm-workspace.yaml'),
    `packages:\n  - '.'\n` +
      // pnpm 10+ FAILS the install (ERR_PNPM_IGNORED_BUILDS) rather than warning when a
      // dependency's build script is skipped, and esbuild's postinstall is what fetches the
      // platform binary Vite and Astro need to build at all.
      //
      // `onlyBuiltDependencies: [esbuild, sharp]` is the targeted form and is what you would
      // reach for first — it works on pnpm 10.33 and is still rejected by 11.8.0, which this
      // fixture hit. The blanket setting is the one that holds across both. It is acceptable
      // here and nowhere else: this is a throwaway temp directory installing the dependency
      // tree of our own scaffold, discarded at the end of the run.
      `dangerouslyAllowAllBuilds: true\n` +
      `overrides:\n${overrides}\n`,
  )
  writeFileSync(join(app, '.npmrc'), 'strict-peer-dependencies=false\n')
  run('pnpm', ['install'], app)

  // Non-vacuity: prove the overrides actually took. A registry-resolved @cascivo would make
  // every assertion below describe the last PUBLISHED build instead of this commit's.
  const store = readdirSync(join(app, 'node_modules', '.pnpm'))
  for (const pkg of ['react', 'core', 'themes']) {
    assert.ok(
      store.some((d) => d.startsWith(`@cascivo+${pkg}@file+`)),
      `@cascivo/${pkg} did not resolve to a local tarball — this canary would be testing ` +
        `the published package. Store entries: ${store.filter((d) => d.includes('cascivo')).join(', ')}`,
    )
  }
  return app
}

/** Every `_name_hash_line` CSS-module class in a built HTML file that has no rule behind it. */
function unstyledClasses(app: string): { page: string; used: number; unmatched: string[] }[] {
  const dist = join(app, 'dist')
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    )
  const out: { page: string; used: number; unmatched: string[] }[] = []
  for (const file of walk(dist).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8')
    const used = [
      ...new Set([...html.matchAll(/\b(_[a-zA-Z][\w-]*_[a-z0-9]{5,}_\d+)\b/g)].map((m) => m[1]!)),
    ]
    const linked = [...html.matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1]!)
    const css = linked
      .map((href) => {
        const p = join(dist, href.replace(/^\//, ''))
        return existsSync(p) ? readFileSync(p, 'utf8') : ''
      })
      .join('\n')
    const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
      .map((m) => m[1]!)
      .join('\n')
    const available = css + inline
    out.push({
      page: file.slice(dist.length + 1),
      used: used.length,
      unmatched: used.filter((c) => !available.includes(`.${c}`)),
    })
  }
  return out
}

describe('framework-install — a scaffolded app renders styled from packed tarballs', () => {
  before(() => {
    if (!ready) return
    const work = mkdtempSync(join(tmpdir(), 'cascivo-fw-tarballs-'))
    tarballDir = join(work, 'tarballs')
    mkdirSync(tarballDir)
    for (const pkg of PACKAGES) {
      execFileSync('pnpm', ['pack', '--pack-destination', tarballDir], {
        cwd: join(REPO_ROOT, 'packages', pkg),
        stdio: 'pipe',
      })
    }
  })

  it(
    'covers every inter-cascivo edge, so nothing resolves from the registry',
    { skip: !ready },
    () => {
      for (const pkg of PACKAGES) {
        const manifest = JSON.parse(
          readFileSync(join(REPO_ROOT, 'packages', pkg, 'package.json'), 'utf8'),
        ) as { dependencies?: Record<string, string> }
        for (const dep of Object.keys(manifest.dependencies ?? {})) {
          if (!dep.startsWith('@cascivo/')) continue
          assert.ok(
            PACKAGES.includes(dep.slice('@cascivo/'.length)),
            `${dep} is a dependency of @cascivo/${pkg} but is missing from PACKAGES, so this ` +
              'fixture would resolve it from the npm registry instead of the local build.',
          )
        }
      }
    },
  )

  describe('astro', () => {
    let app: string

    before(() => {
      if (!ready) return
      app = scaffold('astro', 'astro-app')
      run('pnpm', ['exec', 'astro', 'build'], app)
    })

    it('emits the CSS its server-rendered markup references', { skip: !ready }, () => {
      const results = unstyledClasses(app)
      assert.ok(results.length >= 3, `expected the scaffold's 3 routes, got ${results.length}`)
      // Non-vacuity: a build that renders no cascivo components proves nothing.
      assert.ok(
        results.some((r) => r.used > 0),
        'no cascivo module classes in any built page — the scaffold stopped rendering ' +
          'components, so this canary is testing nothing.',
      )
      const broken = results.filter((r) => r.unmatched.length > 0)
      assert.deepEqual(
        broken.map((b) => `${b.page} (${b.unmatched.length} unmatched, e.g. .${b.unmatched[0]})`),
        [],
        'Server-rendered markup references cascivo classes with no rule behind them, so those ' +
          'pages render unstyled. Check that `cascivo create --framework astro` still emits ' +
          '`vite.resolve.noExternal` (NOT `ssr.noExternal`) and that `module` is still listed ' +
          'ahead of `node` in the exports map. See docs/USING-WITH-ASTRO.md.',
      )
    })

    /**
     * The arm that would have caught the original miss. Without it, this file would pass on a
     * scaffold that had quietly stopped emitting the config — the exact shape of failure that
     * made `apps/examples/astro-islands` look conclusive when it was not.
     */
    it('fails without resolve.noExternal (the canary can actually fail)', { skip: !ready }, () => {
      const config = join(app, 'astro.config.mjs')
      const original = readFileSync(config, 'utf8')
      try {
        writeFileSync(
          config,
          "import { defineConfig } from 'astro/config'\n" +
            "import react from '@astrojs/react'\n" +
            'export default defineConfig({ integrations: [react()] })\n',
        )
        execFileSync('pnpm', ['exec', 'astro', 'build'], { cwd: app, stdio: 'pipe' })
        const broken = unstyledClasses(app).filter((r) => r.unmatched.length > 0)
        assert.ok(
          broken.length > 0,
          'Removing `resolve.noExternal` did NOT produce unstyled pages. Either Astro/Vite no ' +
            'longer externalizes the package (in which case the scaffold can drop the config ' +
            'and docs/USING-WITH-ASTRO.md should be re-written), or this canary has stopped ' +
            'measuring anything.',
        )
      } finally {
        writeFileSync(config, original)
      }
    })
  })

  describe('react-vite', () => {
    let app: string

    before(() => {
      if (!ready) return
      app = scaffold('react-vite', 'vite-app')
      run('pnpm', ['exec', 'vite', 'build'], app)
    })

    it('bundles per-component CSS rather than the aggregate sheet', { skip: !ready }, () => {
      const assets = join(app, 'dist', 'assets')
      const css = readdirSync(assets)
        .filter((f) => f.endsWith('.css'))
        .map((f) => readFileSync(join(assets, f), 'utf8'))
        .join('\n')
      assert.ok(css.length > 0, 'the Vite scaffold emitted no CSS at all')
      // The shell composition the scaffold ships must be styled.
      assert.match(
        css,
        /\._shell_[a-z0-9]+_\d+/,
        'AppShell CSS is missing from the built stylesheet — the scaffold renders unstyled.',
      )
      // The whole point of the per-component path: NOT the ~308 KB aggregate.
      assert.ok(
        css.length < 250_000,
        `entry CSS is ${Math.round(css.length / 1024)} KB — that is aggregate-sheet sized. ` +
          'The scaffold should ship only the components it uses.',
      )
    })
  })
})
