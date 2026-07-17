# Fix plan: TanStack Start dashboard experience report (2026-07-17)

**Status: planned — not implemented.** This document is the full spec for fixing every
item in the second hands-on experience report (a Vercel-style dashboard built on TanStack
Start + cascivo 0.4.3, pnpm monorepo, theme `midnight`). It is written to be handed to an
implementing agent as-is: every issue is root-caused against the current source with
file:line evidence, and every workstream carries design decisions, implementation steps,
tests, and acceptance criteria.

**Source:** experience report dated 2026-07-17. Outcome was positive — the full dashboard
shipped with zero console errors and no hydration mismatches — but the report lists eight
friction items, one naming surprise, and one cosmetic defect. Unlike the previous report
(`docs/plans/dashboard-experience-report-plan.md`, whose core premise was factually wrong),
**this report is accurate**. Every claim was verified against the codebase and reproduces
in the current source. The praise sections also confirm that earlier discovery/positioning
work landed (the agent found charts, blocks, `setLinkComponent`, and a11y behavior
first-try).

## TL;DR — triage

| # | Report item | Verdict | Root cause (evidence) | Workstream |
| --- | --- | --- | --- | --- |
| 1 | `init`/`add` shell out to `npm` inside a pnpm workspace and fail | **Confirmed bug** | `detectPackageManager` checks lockfiles in `cwd` only — a pnpm-workspace app dir has no `pnpm-lock.yaml`, so it falls back to `npm` (`packages/cli/src/utils/config.ts:100-105`) | WS1 (P0) |
| 2 | `init` prints `@cascivo/themes/<theme>.css` import but never installs `@cascivo/themes` | **Confirmed bug** | `init` installs only `@cascivo/core` + `@cascivo/tokens` (`packages/cli/src/commands/init.ts:51`) yet prints the themes import (`init.ts:63`) | WS2 (P0) |
| 3 | Full runtime-dependency set never stated up front | **Confirmed gap** | No single output lists core/tokens/themes/i18n/charts/signals-react; discovery is via install failures | WS2 (P0) |
| 4 | `@preact/signals-react` peer invisible | **Confirmed gap** | `@cascivo/core` peer-depends on it (`packages/core/package.json` `peerDependencies`) but nothing installs or mentions it at init time | WS2 (P0) |
| 5 | `cascivo.config.ts` doesn't typecheck — `cascivo` never added as devDependency | **Confirmed bug** | Generated config does `import type { CascadeConfig } from 'cascivo'` (`init.ts:29`) and no dev-dep install exists | WS2 (P0) |
| 6 | `cascivo add chart/…` copies nothing, prints instructions, "succeeds" | **Confirmed by design — design is wrong** | npm-distributed entries hit the `entry.install` branch which only prints (`packages/cli/src/commands/add.ts:248-256`) | WS3 (P1) |
| 7 | Copied source fails host's strict ESLint (44+ errors under `@tanstack/eslint-config`) | **Confirmed gap** | Component source is linted by Oxlint only; several objective and stylistic classes trip typescript-eslint strict configs; recurs on every `update` | WS4 (P1) |
| 8 | Docs unreadable to plain fetch / agents | **Partially confirmed** | `llms.txt` + per-component static HTML/markdown already exist and are good; but `/docs` root and the installation page are not prerendered (`apps/site/src/marketing/route-head.ts:171` — `PRERENDER_ROUTES` has no `docs` entries; component/category pages are prerendered separately in `apps/site/vite.config.ts:568-`) | WS5 (P1) |
| — | `stack` name grabs the wrong component | **Confirmed hazard** | `Stack` is a z-axis overlap/card-pile (`packages/components/src/stack/stack.meta.ts:4-6`); most ecosystems use "Stack" for vertical spacing | WS6 (P2) |
| — | DataTable adjacent auto-width columns can touch | **Plausible cosmetic** | Needs repro; cell padding exists at several scopes but not verified to guarantee a min gutter in all variants (`packages/components/src/data-table/data-table.module.css`) | WS7 (P2) |

Priority order: **WS1 → WS2** (they compound: the failed npm install is what makes the
missing deps and invisible peer a near-blocker) → WS3/WS4/WS5 → WS6/WS7.

---

## WS1 (P0) — Package-manager detection that works in workspaces

### Problem

`cascivo init`/`add` invoked `npm install` inside a pnpm monorepo, which then crashed
running lifecycle scripts against pnpm-managed `node_modules` (`npm error code 127 …
npm-run-all: not found`). The adopter had to hand-install every runtime dependency. There
is no override flag.

### Root cause

`packages/cli/src/utils/config.ts:100-105`:

```ts
export function detectPackageManager(cwd: string = process.cwd()): PackageManager {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn'
  if (existsSync(join(cwd, 'bun.lockb'))) return 'bun'
  return 'npm'
}
```

Four distinct defects:

1. **No upward walk.** In a pnpm/yarn/bun workspace the lockfile lives at the workspace
   root, not in the app directory where the adopter runs the CLI. `cwd`-only detection is
   guaranteed to fail in exactly the monorepo case.
2. **Ignores `npm_config_user_agent`.** When invoked via `pnpm dlx cascivo …` /
   `yarn dlx` / `bunx` / `npx`, the invoking PM identifies itself in this env var — the
   single most reliable signal, and free.
3. **Ignores the `packageManager` field** (corepack) in `package.json`.
4. **Misses `bun.lock`** — bun ≥ 1.2's default text lockfile (only the legacy binary
   `bun.lockb` is checked).

Downstream, install *hints* are hardcoded to npm even where detection would have
succeeded:

- `packages/cli/src/commands/add.ts:43` — `npm install @cascivo/themes` (themes hint)
- `packages/cli/src/commands/add.ts:251` — `Install it with: npm install ${pkg}` (npm-distributed entries)
- `packages/cli/src/commands/add.ts:306` — `Run: npm install ${v.pkg}@latest` (peer-floor warning)
- `packages/cli/src/commands/create.ts:334` and `:493` — scaffold instructions

### Spec

**1. New detection precedence** (replace `detectPackageManager`; keep the name and
`PackageManager` type):

1. Explicit `--package-manager <pnpm|yarn|npm|bun>` (alias `--pm`) flag on `init`, `add`,
   `create`, and any other command that installs (grep for `installPackages` call sites).
   Invalid value → error listing valid values, exit 1.
2. `CASCIVO_PACKAGE_MANAGER` env var (same validation; enables CI/MCP use — thread it
   through `applyEnvOverrides` or read it directly in detection, implementer's choice, but
   document it wherever `CASCIVO_REGISTRY` is documented).
3. `npm_config_user_agent` prefix (`pnpm/`, `yarn/`, `bun/`, `npm/`).
4. Walk from `cwd` upward to the filesystem root; at each level check, in order:
   `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, `bun.lock`, `package-lock.json`, and the
   `packageManager` field of a `package.json` if present. First hit wins. Stop the walk
   early at a directory containing `.git` after checking it (a sensible repo boundary),
   otherwise continue to root.
5. Default `npm` (unchanged).

**2. `installCommand` unchanged in shape** but audited: pnpm/yarn/bun use `add`, npm uses
`install` (current behavior is correct). Add a dev-dependency variant (needed by WS2):
`installCommand(pm, packages, { dev: true })` → `-D` for pnpm/yarn/bun, `--save-dev` for
npm.

**3. Kill every hardcoded `npm install` hint.** Add a helper in `utils/exec.ts` (or
`config.ts`):

```ts
export function installHint(pm: PackageManager, packages: string[], opts?: { dev?: boolean }): string
```

and use it at all four sites above plus any new output added by WS2/WS3. `create.ts`'s
generated README/scaffold text should also use the detected PM.

**4. Failure behavior.** `installPackages` already returns `false` on failure; today
`init`/`add` ignore the return value. Change: on failure, print the exact command the
adopter should run themselves (via `installHint`, with the detected PM), set
`process.exitCode = 1`, and **continue** writing files (the report confirms files-written
+ manual-install is a workable degraded path; do not make it worse by aborting).

**5. Order of operations in `init`.** Today `init` installs before writing
`cascivo.config.ts` (`init.ts:51` vs `:58-59`). Reverse it: write files first, install
last, so an install crash can never leave a half-initialized project.

### Tests

Extend `packages/cli/src/utils/config.test.ts` (temp-dir based, follow existing patterns):

- Workspace layout: `root/pnpm-lock.yaml` + `root/apps/web/` → detection from
  `root/apps/web` returns `pnpm`. Same for yarn/bun (both lockfile names)/npm.
- `npm_config_user_agent='pnpm/9.0.0 …'` beats a `package-lock.json` in cwd.
- Flag beats env beats user-agent beats lockfile walk (test the full precedence chain).
- `packageManager: "yarn@4.x"` field with no lockfile → `yarn`.
- `.git` boundary: lockfile *above* a `.git` directory is not picked up.
- `installHint` renders `pnpm add`, `npm install`, dev variants.
- `init`/`add` output snapshot: no literal `npm install` remains when detection says pnpm
  (grep-style assertion over captured stdout).

### Acceptance criteria

- In a fixture pnpm monorepo (lockfile at root only), `cascivo init --yes` run from an app
  subdirectory invokes `pnpm add`, never `npm`.
- `cascivo add button --pm bun` invokes `bun add` regardless of lockfiles.
- A failed install exits non-zero, prints a copy-pasteable fallback command with the
  correct PM, and still writes all component/config files.

---

## WS2 (P0) — `init` installs and states the complete dependency set

### Problem

Three compounding gaps: `init` installs 2 of the packages it needs (`init.ts:51`), prints
an import for a package it didn't install (`@cascivo/themes`, `init.ts:63`), generates a
config whose type import needs `cascivo` as a devDependency it never adds (`init.ts:29`),
and never mentions the `@preact/signals-react` peer. The full set was discovered
"piecemeal through install failures and build-time warnings".

### Spec

**1. Runtime install set** in `init` becomes:

```
@cascivo/core  @cascivo/tokens  @cascivo/themes  @preact/signals-react
```

Rationale per package:

- `@cascivo/themes` — `init` immediately tells the adopter to import it; installing it is
  strictly implied by the printed guidance.
- `@preact/signals-react` — it is `@cascivo/core`'s peer (`>=2.0.0`). Do **not** rely on
  the PM auto-linking peers: npm ≥7 auto-installs but the report's failure mode (#1)
  disables exactly that path, pnpm's behavior depends on `auto-install-peers`, yarn never
  auto-installs. Installing it explicitly makes it visible in the adopter's
  `package.json`, which is itself half the fix for report item #4.

**2. Dev install** (second `installPackages` call with the `dev: true` variant from WS1):

```
cascivo   (dev)  — required by the generated config's `import type { CascadeConfig } from 'cascivo'`
```

**3. `--no-install` flag** on `init`: skip both installs, print the two exact commands
instead (via `installHint`). This is also the natural fallback path when an install fails.

**4. A "dependencies" summary block** printed at the end of `init` — the "here's
everything you need" line the report asked for. Exact content (adjust wording freely,
keep the information):

```
Dependencies
  runtime: @cascivo/core @cascivo/tokens @cascivo/themes @preact/signals-react
  dev:     cascivo (types for cascivo.config.ts)
  added on demand by `cascivo add`: @cascivo/i18n, @cascivo/charts (npm-distributed
  entries and components that need them declare these; add installs them for you)
```

**5. `cascivo doctor` extension** (nice-to-have, small): add a check that the five
packages above are resolvable from the project (`require.resolve` /
`import.meta.resolve`-style probe or a `package.json` scan), with a per-package fix hint.
This turns "cannot find module `@preact/signals-react`" from a dead end into a diagnosed
condition. Keep it advisory (warning, not failure) for `@cascivo/i18n`/`@cascivo/charts`.

**6. Docs**: update `docs/GETTING-STARTED.md` and the `llms.txt` generator
(`scripts/llms/generate.ts`) "How to use it" section so the copy-paste path lists the full
set in one line, matching the new `init` output. Run `pnpm regen`.

### Tests

- `init` (mocked `installPackages`) is called exactly twice: once with the 4 runtime
  packages, once with `['cascivo']` + dev flag.
- `--no-install` performs zero installs and prints both commands.
- Summary block appears in output (string assertions).
- Existing non-TTY/`--yes`/`--theme` behavior unchanged (tests exist for
  `template-init`; add an `init.test.ts` if none exists — currently there is **no**
  `init.test.ts` in `packages/cli/src/commands/`).

### Acceptance criteria

- Fresh project: `cascivo init --yes` then `tsc --noEmit` on `cascivo.config.ts` passes
  with no manual installs.
- Following the printed theme-import guidance verbatim resolves.
- `init` output contains the complete dependency list in one place.

---

## WS3 (P1) — npm-distributed entries (`charts`, `flow`, `editor`) actually install

### Problem

`cascivo add chart/area-chart` prints install/import instructions, copies nothing, and
exits 0 — the ownership mental model silently flips halfway through the catalog, and "the
command succeeds while having added nothing".

### Root cause

`packages/cli/src/commands/add.ts:248-256`: the `entry.install` branch is print-only.
(`cascivo list` already labels these groups correctly — `Charts (npm: @cascivo/charts)`,
`packages/cli/src/commands/list.ts:10-18` — so the gap is `add`, not `list`.)

### Spec

**1. Install, don't instruct.** When a resolved entry carries `install`:

- Collect all such packages across the resolved closure into a set (five chart entries
  must produce **one** `@cascivo/charts` install, not five).
- Print an explicit model statement *before* installing, e.g.:
  `"chart/area-chart" is distributed as the npm package @cascivo/charts (not copied source — updates come via your package manager).`
- Run `installPackages` (WS1 detection) once for the whole set, skipping packages already
  present in the project's `package.json` (reuse the dependency-scan approach of
  `hintThemesIfMissing`, `add.ts:28-46`).
- Then print the import lines exactly as today (`import { AreaChart } from
  '@cascivo/charts'`, plus the stylesheet line when `entry.styles` is set).
- On install failure: non-zero exit + `installHint` fallback command (WS1 semantics).
- `--no-install` (add the flag to `add` too) restores today's print-only behavior.

**2. Dry-run parity.** `add --dry-run` currently only covers the multi-registry path
(`add.ts:163-179`). Ensure the bare-name path with an `install` entry prints
`would install npm package: @cascivo/charts` under dry-run.

**3. Do not lock npm-distributed entries.** They are not vendored files; keep them out of
`cascivo.lock` (verify the current branch already skips them — it does, via `continue`
before `updateLockEntry`; preserve that).

**4. Message audit for the "package is not installed" warning** the report saw: that is
the `checkPeerVersions` floor warning (`add.ts:300-310`). After this WS it should only
fire when the package is genuinely missing/outdated *after* the auto-install attempt, and
its hint must use `installHint` (WS1).

### Tests

- `add chart/area-chart chart/bar-chart` with mocked registry: exactly one
  `installPackages(['@cascivo/charts'])` call; import lines printed; no files written; no
  lock entries.
- Already-installed package → no install call, just import lines.
- `--no-install` → zero install calls, instructions printed, exit 0.
- Dry-run prints the planned npm install.

### Acceptance criteria

- In a fixture project, `cascivo add chart/area-chart` leaves `@cascivo/charts` in
  `package.json` dependencies (via the detected PM) and prints working import lines.
- The two distribution channels are each explicit at the moment of `add`, not only in
  `list`.

---

## WS4 (P1) — Vendored source survives strict host lint configs

### Problem

Under `@tanstack/eslint-config` (typescript-eslint strict + stylistic), the copied
component source produced 44+ errors. Cited classes: inline type specifiers, unnecessary
type assertions, an always-true `no-unnecessary-condition`, generic type-parameter naming
(`Row` vs required `T`-prefix), `no-shadow`, and a stale `eslint-disable` directive. The
adopter's only recourse (scoping rules off for `src/components/ui/**`) is permanent
maintenance because `cascivo update` re-copies files.

### Position

Split the classes in two. **Objective classes** (unnecessary assertion, always-true
condition, shadowing, stale/unscoped disable directives, inline type specifiers) are code
smells by our own standards — fix them at the source so every adopter benefits.
**Host-stylistic classes** (T-prefixed type params, naming conventions) are one config's
opinion; chasing every host's style in vendored code is unwinnable — for those, ship an
official, documented scoping recipe instead. Explicit non-goal: renaming public generic
parameters like `Row` (it is part of the readable-source product; `TRow` is a
typescript-eslint stylistic house rule, not a correctness issue).

### Spec

**1. Source hygiene sweep** over everything the registry copies (at minimum
`packages/components/src/**`, plus layouts/blocks source if registry-served — confirm via
`registry.json` file URLs):

- Remove type assertions that a strict-mode compiler proves unnecessary.
- Remove/rewrite always-true conditions (`no-unnecessary-condition` hits).
- Rename shadowing inner variables.
- Convert the 4 files using inline `import { type X }` to top-level `import type` (matches
  `verbatimModuleSyntax`-friendly style and the `import-x/consistent-type-specifier-style`
  default in strict configs).
- Every `eslint-disable` comment (≈10+ files: `alert-dialog.tsx`, `sheet.tsx`,
  `popover.tsx`, `context-menu.tsx`, `form.tsx`, `menu.tsx`, `action-sheet.tsx`,
  `hover-card.tsx`, `switcher.tsx`, `code-snippet.tsx`, …): make it a rule-scoped
  `eslint-disable-next-line <rule-id>` with a trailing `-- reason`, and delete any that no
  longer suppress anything (the "stale directive" hit). These comments also serve Oxlint —
  keep Oxlint green while tightening them.
- Gate: `pnpm ready` (Oxlint + tsc + tests) still fully green; behavior-neutral diff.

**2. Official lint-scoping recipe** for host-stylistic rules:

- New doc `docs/USING-WITH-STRICT-ESLINT.md` (sibling of the other `USING-WITH-*.md`
  guides): explains the model ("vendored code is generated-style code; scope stylistic
  rules off for your `outputDir`"), with a copy-paste ESLint flat-config block:

  ```js
  {
    files: ['src/components/ui/**'], // your cascivo outputDir
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      // …the short list of stylistic rules cascivo does not adopt
    },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
  }
  ```

  The `files` glob must be described as "your `outputDir` from cascivo.config.ts".
- `init` prints a one-line pointer to this doc when it detects an ESLint config in the
  project root (`eslint.config.*`, `.eslintrc*`). Do **not** auto-edit the adopter's
  ESLint config — too invasive, too many formats.
- Add the recipe to the `llms.txt` generator (short note + URL) and `pnpm regen`.

**3. CI guard against regression** — new check script (wired into `pnpm ready` /
`vp check` family like `breakpoint:check` etc.): `lint:host-strict`. It runs ESLint
programmatically with a **pinned** `@tanstack/eslint-config` (devDependency of the check
only) over `packages/components/src/**`, with the host-stylistic rules from the recipe
disabled — i.e. it enforces exactly the "objective" classes we commit to keeping clean.
The check's config header must state that its rule carve-outs and
`docs/USING-WITH-STRICT-ESLINT.md` are the same list and must be kept in sync. If wiring
ESLint into the vp toolchain proves heavy, an acceptable fallback is a standalone
`scripts/checks/host-lint/` with its own minimal `package.json`, run in CI as a separate
job — decide at implementation time; the non-negotiable part is that CI fails when a
newly-authored component reintroduces an objective-class violation.

### Tests / acceptance criteria

- `lint:host-strict` passes on the swept source and is demonstrably capable of failing
  (add a unit/self-test with a deliberately bad fixture, or verify locally by temporary
  injection — document which).
- In the fixture TanStack app, copied `button`, `card`, `data-table` produce **zero**
  ESLint errors under `@tanstack/eslint-config` + the documented recipe block, and only
  stylistic-class errors without it.
- `pnpm ready` green; zero behavior diffs (component tests unchanged).

---

## WS5 (P1) — Getting-started that agents (and `curl`) can actually read

### Problem

`cascivo.com/docs` 404s to a plain fetch; `docs.cascivo.com` docs routes are
client-rendered; npm package pages 403 non-browser fetchers. The agent fell back to
`npm view` + reading source.

### What already exists (do not rebuild)

- `apps/site/public/llms.txt`, `llms-full.txt`, `/llms/<name>.md`, `/context/<name>.md`,
  `context.json`, `registry.json` — statically served, CORS-enabled, with real 404s for
  wrong names (`apps/site/public/_headers`, `_redirects`).
- Component and category docs pages get fully static prerendered HTML bodies
  (`apps/site/vite.config.ts:530-` `prerenderPages`).

The genuine gaps: (a) `/docs` root and the installation/getting-started route are **not**
in `PRERENDER_ROUTES` (`apps/site/src/marketing/route-head.ts:171-190` — only marketing
routes are listed), so the exact entry points an adopter fetches first return the empty
SPA shell or 404; (b) nothing served over HTTP states the full install story in
fetchable markdown; (c) discoverability of `llms.txt` from the HTML shell.

### Spec

**1. Prerender the entry-point docs routes.** Add `docs`, `docs/installation` (and any
other top-level docs index routes that exist in the router) to the prerender pipeline with
real static bodies — same pattern as component pages: derive the body from the same source
that feeds WS2's dependency summary (install commands, dependency set, theme wiring,
first `cascivo add`). Investigation step: confirm how `cascivo.com` and
`docs.cascivo.com` map to this app's deploy (the `_redirects`/`_headers` live in
`apps/site/public`; `docs.cascivo.com mirrors the same tree` per
`packages/cli/src/utils/config.ts:6-9`) and why `/docs` 404s on the apex host — if the
apex Pages project lacks an SPA fallback, the prerendered `dist/docs/index.html` fixes it
for free.

**2. Serve getting-started as markdown.** Generate `public/docs/getting-started.md` (from
`docs/GETTING-STARTED.md` content or the llms generator — single source, no hand copy)
during `pnpm regen`, so `curl https://cascivo.com/docs/getting-started.md` works. Add it
to the `_headers` CORS/plain-text block and link it from `llms.txt`'s "Start here"
section.

**3. Point agents at llms.txt from the shell.** In the SPA HTML shell: a
`<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-readable docs">` tag
and a `<noscript>`/static-comment note ("Agent? Fetch /llms.txt or
/docs/getting-started.md"). Also add `/docs/* → llms hint` to the machine-surface 404
handling only if `/docs/<unknown>` currently falls through to the SPA shell — mirror the
existing `/llms/*` 404 pattern rather than inventing a new one.

**4. npm 403s** are out of our control (npmjs.com bot-blocks), but mitigate: ensure every
published package README (`packages/{core,tokens,themes,i18n,charts,cli,react}/README.md`)
opens with the full dependency set + a link to `https://cascivo.com/llms.txt` —
`npm view <pkg> readme` is fetchable without a browser and was the agent's actual working
path.

### Acceptance criteria

- `curl -s https://cascivo.com/docs` (and `/docs/installation`) returns HTML whose body
  contains real install instructions, JS disabled. (Locally: assert on
  `apps/site/dist/docs/index.html` after build; deployment verification is a follow-up
  once deployed.)
- `curl -s https://cascivo.com/docs/getting-started.md` returns markdown.
- The shell HTML contains the `rel="alternate"` llms.txt link.
- `pnpm regen && git diff --exit-code` clean after committing artifacts (drift gate).

---

## WS6 (P2) — `stack` naming disambiguation

### Problem

`cascivo add stack` installs a z-axis overlap/card-pile component; in most systems
"Stack" is a vertical spacing primitive. Easy to grab the wrong component by name.

### Position

Do **not** rename `Stack` (breaking, and the name is defensible for the card-pile) and do
**not** alias `stack` → `flex` (it would hijack a real component's name). Fix it at the
moment of confusion instead.

### Spec

1. **Point-of-use notice in `add`.** Alongside `LAYOUT_ALIASES`
   (`packages/cli/src/commands/add.ts:65-70`), add a `NAME_NOTES: Record<string, string>`
   consulted for *requested* bare specs; for `stack` print:
   `Note: cascivo's Stack overlaps children into a card-pile (z-axis). For a vertical spacing stack use Flex direction="vertical" — cascivo add flex (aliases: vstack, hstack).`
   Print it for `cascivo view stack` too (`commands/view.ts`) if `view` renders
   descriptions — keep it one implementation (export the note, reuse).
2. **Manifest tags.** Add discovery tags to `stack.meta.ts` (`overlap`, `pile`,
   `layered`, `z-axis`) and make the description's first words disambiguate ("Overlaps
   children …" — already does). Ensure the *boundaries/context* doc for stack states
   "not a vertical spacing primitive; that is Flex direction=vertical" (this flows into
   `/context/stack.md` via `pnpm regen`).
3. **llms.txt naming note.** The generator already has a name-mapping section for icons;
   add one line for components: `Stack ≠ vertical layout (use Flex direction="vertical"; vstack/hstack resolve to it)`. `pnpm regen`.

### Tests / acceptance

- CLI test: `add stack` output contains the note; `add flex` does not.
- Regenerated `context/stack.md` / `llms.txt` contain the disambiguation (drift gate
  covers commitment).

---

## WS7 (P2) — DataTable default column gutter

### Problem (report: minor/cosmetic)

Adjacent auto-width columns (branch/commit) can visually touch with long content; per-column
explicit `width` was the workaround. Requested: a small default gutter.

### Spec

1. **Reproduce first** in Storybook/site with two long-content auto columns at 320–1280px
   across variants (compact/default density, sticky columns if present). Identify which
   cell scope lacks horizontal padding — `packages/components/src/data-table/data-table.module.css`
   has `padding-inline` at several scopes (`:56`, `:125-126`, `:143-144`, `:180`) but the
   report implies at least one path where effective inter-column space reaches 0.
2. **Fix as a component token**: introduce `--cascivo-data-table-column-gap` (default
   e.g. `var(--cascivo-space-3)`) applied as base cell `padding-inline` (or asymmetric
   `padding-inline-end`) so adjacent columns always keep a minimum gutter without breaking
   existing explicit-width layouts. Follow the token architecture (component token →
   semantic default) and layer discipline (inside `@layer cascivo.component`).
3. **Manifest + regen**: add the token to `data-table.meta.ts` `tokens` list; `pnpm regen`.
4. **Regression coverage**: a component test or story asserting computed
   `padding-inline` on body cells (JSDOM-level), plus the mobile-overflow sweep at
   320/360/390/414 per the authoring rules.

### Acceptance

- Long-content adjacent auto columns show a visible gutter with zero consumer CSS.
- No visual regression in existing table stories (spot-check compact density and any
  block using DataTable, e.g. `users-table-page`).

---

## Cross-cutting requirements (all workstreams)

- **Gates:** every PR passes `pnpm ready` (regen → check --fix → build → typecheck →
  tests). WS4/WS7 touch component source → also `pnpm breakpoint:check`,
  `pnpm layers:check`, `pnpm unlayered:check`, `pnpm primitives:check` as bundled in the
  ready gate. Manifest or generator changes → commit regenerated artifacts (drift job
  diffs them).
- **Changesets:** repo versions via changesets ("Version Packages" PRs). Add changesets:
  `cascivo` (CLI) **minor** (new flags `--pm`/`--no-install`, behavior change in `add`
  for npm-distributed entries), `@cascivo/components`-published sources per their channel
  (WS4 sweep = patch; WS7 = patch), site/docs changes as the repo convention dictates
  (apps are likely unversioned).
- **CLAUDE.md untouched** unless a new check lands (WS4's `lint:host-strict` should be
  added to the "reproduce individual CI steps" list once wired).
- **Fixture for end-to-end verification** (WS1–WS3): a throwaway pnpm-workspace fixture
  under the CLI's integration tests (there is precedent: `add.integration.test.ts`) that
  runs `init --yes` + `add button` + `add chart/area-chart` against a local registry
  server and asserts on `package.json` contents and spawn calls. Mock `spawnSync` rather
  than hitting the network/real installs.

## Suggested PR breakdown

1. **PR 1 (WS1+WS2)** — PM detection + init completeness. One PR because WS2's new
   installs are only correct once detection works; ships the biggest adopter-facing fix
   atomically.
2. **PR 2 (WS3)** — npm-distributed `add` behavior (+ `--no-install` on `add`).
3. **PR 3 (WS4)** — source hygiene sweep + recipe doc + `lint:host-strict` check.
4. **PR 4 (WS5)** — docs prerender + getting-started.md + shell alternate link + package
   READMEs.
5. **PR 5 (WS6+WS7)** — stack note + DataTable gutter (small, independent).

## Open questions for the implementer (defaults chosen; deviate with reason)

1. WS2: should `init` also pre-install `@cascivo/i18n`? **Default: no** — components that
   need it declare it and `add` installs it (once WS1 makes that reliable); keep init
   minimal-but-sufficient for the printed guidance.
2. WS3: auto-install without a prompt? **Default: yes, no prompt** — `add` already
   auto-installs `dependencies` for copied components (`add.ts:296-298`); npm-distributed
   entries becoming consistent with that is the whole point. `--no-install` is the
   escape hatch.
3. WS4: exact rule list for `lint:host-strict` — derive it empirically by running
   `@tanstack/eslint-config` over the swept source and carving out only what remains and
   is genuinely stylistic; the carve-out list must equal the documented recipe.
4. WS5: whether `docs.cascivo.com`'s router serves `/docs/*` or root-relative paths —
   resolve during the deploy-mapping investigation before choosing redirect vs prerender
   for the apex host.
