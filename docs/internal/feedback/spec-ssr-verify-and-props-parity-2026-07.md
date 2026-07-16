# Spec — SSR end-to-end verification + props-parity CI gate (2026-07)

**Status:** Planning artifact only — no code changes. Written for an implementing agent
(Opus) in a follow-up PR. Every item carries file:line pointers, effort (S/M/L), the
exact algorithm, and a verification gate.

**Origin:** the two deliberately-deferred items from the TanStack Start / Vite SSR
adopter report (`feedback-tanstack-ssr-adopter-2026-07.md` /
`fix-plan-tanstack-ssr-adopter-2026-07.md`). Everything else in that report shipped on
branch `claude/ui-library-report-analysis-kulk9q`. These two were split out because each
needs a new dependency and non-trivial harness, and neither fixes a live user bug —
they *verify* and *guard* work already done.

Two independent tracks; ship as **two separate PRs** (they share no files):

- **Track A — SSR end-to-end verification.** The docs now claim "Vite SSR /
  TanStack Start ✅ (with `ssr.noExternal`)", but nothing server-renders a cascivo
  component through that path in CI. Make the claim real.
- **Track B — props-parity CI gate.** Nothing checks that a component's `.meta.ts`
  `props` match its TypeScript prop interface. The reported "sideNav vs nav drift" was
  a false positive, but the class of bug is unguarded. Add the guard, correctly scoped
  so it doesn't drown in false positives.

An optional **Appendix** covers two minor open threads (a literal rocket glyph; block
`context/*.md` coverage).

---

## Track A — SSR end-to-end verification (M)

### The claim we must back

`docs/COMPATIBILITY.md`, `docs/USING-WITH-VITE-SSR.md`, `docs/TROUBLESHOOTING.md`,
`docs/GETTING-STARTED.md`, the `@cascivo/react` README, and `apps/site/public/llms.txt`
all now tell adopters: on Vite SSR (TanStack Start / Remix / workerd), add
`ssr.noExternal: [/^@cascivo\//]` (or the `cascivoSsr()` plugin, `packages/vite-plugin/src/index.ts`)
and import `@cascivo/react/styles.css` once, and SSR works. Today that rests on a
**unit test of the plugin's returned config object** (`packages/vite-plugin/src/index.test.ts`
— "returns ssr.noExternal covering every @cascivo/* package") plus documentation. **No
test server-renders a real component through the dist.**

### The critical subtlety — do NOT source-alias `@cascivo/react`

The existing CSR example does **not** reproduce the bug and could NOT verify the fix.
`apps/examples/react-vite/vite.config.ts:18-23` aliases `@cascivo/react` →
`packages/react/src/index.ts` (source), so it imports the `.tsx`/`.module.css` source,
never the **built dist** whose chunks carry the injected `import './x.css'`
(`packages/react/vite.config.ts:87`). The SSR failure is a property of the *published
dist*, not the source. **The SSR verification harness must consume the built
`@cascivo/react` dist via the package `exports` map — no `resolve.alias` for
`@cascivo/react`.** If the implementer copies the react-vite config verbatim, the test
passes while proving nothing. This is the single most important instruction in this spec.

Consequence: the harness can only build/run **after** `@cascivo/react` is built (its
`dist/` must exist). `vp run -r build` orders by the dependency graph, so a workspace
`@cascivo/react: workspace:*` dependency guarantees react builds first. It must **not**
be added to any job that builds without a prior full build (perf/storybook/landing — see
the "Workspace package aliases" rule in `CLAUDE.md`); it belongs only in the main
`ci.yml` build→test sequence (`.github/workflows/ci.yml:92,102`).

### A.1 — Cheap raw-Node guard: prove the dist really has the problem — S

Lands first; no Vite build, fast, and it locks the contract the docs describe.

- New `scripts/checks/ssr-import.test.ts` (node:test harness — mirror
  `scripts/checks/meta-coverage.test.ts:1-13`; wire into a new `pnpm ssr:check` script in
  `package.json` and add it to `.github/workflows/ci.yml` alongside `llms:check`).
- It requires `@cascivo/react` to be built. Guard: if `packages/react/dist` is absent,
  `it.skip` with a message ("run pnpm build first") so a cold `node --test` doesn't fail
  spuriously; CI always builds before checks in the same job.
- Assertion (proves the documented failure mode is real): pick a representative built
  chunk (e.g. `packages/react/dist/menubar/menubar.module.js`) and assert its **source
  text contains a bare `import './menubar.css'`** (the injected edge). This is the
  contract the SSR docs are written against; if a future dist change removes it (e.g.
  someone lands "Option A" from the parent plan), this test fails and forces the docs to
  be updated in lockstep. Keep it resilient: scan `dist/**/*.module.js` and assert *at
  least one* carries a bare `import './*.css'`.
- Optional stronger assertion (raw-loader repro): via `node:child_process`, run
  `node --input-type=module -e "import('<abs path to a dist chunk>')"` and assert it
  exits non-zero with `ERR_UNKNOWN_FILE_EXTENSION` / `Unknown file extension ".css"`.
  This is the literal adopter error. Gate it behind the same dist-exists skip. Note it
  proves the *problem*, not the *fix* (the fix is a Vite-build-time behavior — see A.2).
- **Verify:** `pnpm build && pnpm ssr:check` green; deleting the injected import in a
  scratch build makes the first assertion fail.

### A.2 — Real Vite-SSR example that renders through the fix — M

The living proof `COMPATIBILITY.md` should point at.

- New `apps/examples/react-vite-ssr/` (mirror `apps/examples/react-vite/` layout:
  `package.json`, `vite.config.ts`, `index.html`, `src/`, `readme.body.md`). Name it
  `@cascivo/example-react-vite-ssr`, `private: true`.
- `package.json`: depend on `@cascivo/react`, `@cascivo/themes`, `@cascivo/tokens`,
  `@preact/signals-react`, `react`, `react-dom` (all `workspace:*`/`catalog:` as in
  react-vite's package.json). **Do not** add a `@cascivo/react` source alias.
- `vite.config.ts`: `ssr: { noExternal: [/^@cascivo\//] }` **or**
  `plugins: [cascivoSsr()]` (prefer the plugin — it's the thing we're validating). A
  `@cascivo/core`/`i18n` source alias is fine (those are pure JS, not the CSS path); the
  point is `@cascivo/react` resolves to **dist**.
- `src/entry-server.tsx`: `renderToString(<App/>)` from `react-dom/server`, where `App`
  imports and renders a couple of CSS-bearing components (`Button`, `Card`, `Menubar` —
  Menubar is the one from the report) plus `import '@cascivo/react/styles.css'` and a
  theme. `src/entry-client.tsx`: `hydrateRoot`.
- `scripts`: `"build": "vite build && vite build --ssr src/entry-server.tsx"`,
  `"test": "node ./test/ssr-smoke.mjs"`. The smoke test imports the built SSR bundle (or
  runs it via `node`), calls the server render, and asserts (a) it does **not** throw
  `Unknown file extension ".css"`, and (b) the returned HTML string contains expected
  component markup (e.g. a `role="menubar"` / the button label). Exit non-zero on
  failure.
- **Negative control (recommended):** a second config/build with `noExternal` removed
  that asserts the SSR build **fails** with the `.css` error — proving the plugin is
  load-bearing, not decorative. Keep it in the same `test` script (spawn a build, expect
  non-zero + the error string). If flaky/slow, downgrade to a documented manual step.
- CI: it builds under `vp run -r build` (after react) and its `test` runs under
  `pnpm run test` (`ci.yml:102`), which is after the build step (`ci.yml:92`) — so dist
  exists. Confirm `vp run -r test` picks up the example's `node`-based test script (the
  other examples use `vp test`; a raw `node` test script is fine as long as `vp run`
  invokes the package's `test` script — verify, and if `vp run -r test` only runs vitest
  projects, express the smoke test as a `*.test.ts` using vitest's SSR-capable
  environment instead).
- Update `docs/COMPATIBILITY.md:14-15` and `apps/examples/*` references to point the
  "Vite SSR / TanStack Start" row at this example (replacing the "verified only against
  CSR" caveat). Add it to the example list in `docs/GETTING-STARTED.md` and
  `docs/USING-WITH-VITE-SSR.md` ("Where's a working example?").
- **Verify:** `pnpm build && pnpm exec vp run @cascivo/example-react-vite-ssr#test`
  green; temporarily removing `cascivoSsr()`/`noExternal` makes the smoke test fail with
  the `.css` error (negative control). `pnpm ready:ci` green (build-order rule — this
  example is the exact case that rule protects).

### A.3 — TanStack Start note (optional, XS)

TanStack Start *is* Vite, so A.2 covers the mechanism. If a maintainer wants a literal
TanStack Start example, it's a larger dependency footprint for marginal additional proof;
recommend deferring unless there's demand. `docs/USING-WITH-VITE-SSR.md` already has the
TanStack-specific `__root.tsx` snippet.

### Track A non-goals

- Do **not** change the published dist (the parent plan's Wave 1.3 "Option A/B" was
  explicitly declined — leave `packages/react/vite.config.ts` as-is). This track only
  *verifies* the documented `noExternal` path.
- Do not add a `@cascivo/react` source alias to the SSR example (see the critical
  subtlety above) — it would make the test vacuous.

---

## Track B — props-parity CI gate (M)

### What it guards

A `.meta.ts` `props` array is hand-authored and rendered verbatim into every AI surface
(`scripts/llms/generate.ts` `propsTable`, and `registry.json` which inlines `meta.props`).
Nothing reconciles it with the component's actual TypeScript prop interface
(`interface <Pascal>Props` in `<name>.tsx`). A real rename (`sideNav`→`nav`) in the
`.tsx` without touching the `.meta.ts` would ship undetected. Current `meta:check`
(`package.json:36` → `manifest-completeness.test.ts`, `meta-coverage.test.ts`,
`primitive-docs.test.ts`) checks *presence/registration*, never prop *names/types*.

### Why it was deferred — the false-positive minefield (measured)

A source-heuristic probe on current `main` (recorded during the parent session):
- **"interface member missing from meta"** flags **60 / 150** components — nearly all
  legitimate: `className`/`children` passthrough, and internal sub-component `*Props`
  interfaces in the same file (e.g. `MenubarItemProps`) that the regex wrongly picked up.
- **"meta prop absent from source text"** flags **20** — all HTML-attribute passthrough
  via `...ComponentProps<'button'>` spreads (`onClick`, `checked`, `href`): the prop is
  real and correctly documented, it just isn't a literal identifier in the source.

Conclusion: a text heuristic is unshippable in both directions. A correct check **needs
the TypeScript type checker** to (a) resolve inherited/spread members and (b) distinguish
a component's *own* declared props from an internal helper interface. Neither `typescript`
nor `ts-morph` is currently resolvable from `scripts/` (the repo type-checks via bundled
`vp`/tsc). So Track B's first task is adding the dependency.

### B.1 — Add `ts-morph` and a type resolver — S

- Add `ts-morph` to root `devDependencies` (via the catalog if the repo pins tool
  versions there; otherwise latest stable). It bundles its own TS, sidestepping the
  "typescript not importable from scripts" problem.
- Helper `scripts/checks/lib/component-props.ts`: given a component's `.tsx` path and its
  expected `<Pascal>Props` name, return two sets:
  - `declaredOwn`: members declared **directly** on the props interface/type
    (`InterfaceDeclaration.getProperties()` returns own members only, excluding
    `extends`; for a `type X = A & { … }` intersection, take members from the
    object-literal arm only). This is the set an author is expected to document.
  - `resolvedAll`: the full property set including inherited/spread members
    (`TypeChecker.getPropertiesOfType(typeAtLocation)`). This answers "does this prop
    exist *at all*" and is what kills the 20 passthrough false positives.

### B.2 — The check, correctly directional — M

New `scripts/checks/props-parity.test.ts` (node:test; wire into `meta:check` at
`package.json:36`). For each registry entry that has a `.tsx` + a `<Pascal>Props`:

- **Resolve the right files, keyed by directory, not display name.** Walk from each
  `<name>.meta.ts` to its sibling `<name>.tsx` (the same directory the registry generator
  uses, `scripts/registry/generate.ts:~228-231`). This is what prevents the exact mistake
  the human reporter made — `layout/app-shell` and `app-shell` are different files and
  must be checked independently. Pick the **exported** props type whose name matches the
  component's export (`<Pascal>Props`), not the first `*Props` in the file (skips
  `MenubarItemProps` etc.).
- **Direction A — "the manifest documents a prop that doesn't exist" (ERROR):**
  for each `meta.props[].name`, if it is **not** in `resolvedAll` → fail. This is the
  `sideNav`→`nav` bug. Using `resolvedAll` (incl. inherited) means `onClick` documented
  against a `ComponentProps<'button'>`-spreading component passes — killing the 20.
- **Direction B — "a real own prop is undocumented" (WARN → later ERROR):**
  for each `declaredOwn` member, if it is **not** in `meta.props` and not in a small
  `SKIP` set (`className`, `children`, `style`, `key`, `ref`) → warn. Using `declaredOwn`
  (own only) means inherited HTML attributes aren't required to be documented — killing
  most of the 60. Start Direction B as warn-only (print, don't fail) so it doesn't block;
  promote to error once the manifests are cleaned.
- **ALLOWLIST** (mirror `primitive-docs.test.ts:36` `Record<string, string>` of
  name→reason): for the handful of genuinely-intentional divergences (e.g. a component
  that documents a convenience prop implemented via `...rest`, or an internal prop
  deliberately omitted). Every entry carries a reason; a companion test asserts no stale
  allowlist entries (mirror `primitive-docs.test.ts:137`).
- **Optionality (stretch, warn-only):** compare `meta.props[].required` against the
  member's `?` optionality; report mismatches as warnings. Do not gate on this first pass.

### B.3 — Burn-down before turning Direction A into a hard gate — S

- First run of Direction A will surface any genuine manifest lies. Expected to be near-zero
  (the parent investigation found the reported drift was a false positive), but fix each by
  correcting the `.meta.ts` (then `pnpm regen`) or allowlisting with a reason. Only then
  add `props-parity` to the `meta:check` chain as a failing gate.
- **Verify:** seeded mutation test in the same file — construct a fixture (or use ts-morph
  on an in-memory source) with `interface FooProps { nav: ... }` and `meta.props=[{name:'sideNav'}]`
  and assert Direction A fails; then align them and assert it passes. `pnpm meta:check`
  green on the real repo.

### Track B non-goals

- Do **not** replace manifest-authored props with type-generated props. The manifests
  carry curated descriptions/defaults/examples the types can't express; this is a
  *parity check*, not a codegen change. (The adopter's "auto-generate from .d.ts"
  suggestion is satisfied by the check without losing curation.)
- Do not gate Direction B (undocumented own prop) on the first PR — warn-only until the
  manifests are swept, or it blocks CI on `className`-style noise.

---

## Appendix — two minor open threads (optional, low priority)

### C.1 — Literal rocket glyph (XS, judgment call)

The report's "no Rocket/deployment icon" is currently answered by an **alias**
(`Rocket`/`deploy`/`ship` → the existing `Spaceship` glyph, `packages/icons/svg/aliases.json`),
which resolves intent and search. If a maintainer wants a *distinct* rocket silhouette,
add `packages/icons/svg/rocket.svg` (normalized `viewBox="0 0 24 24"`, Feather/chromicons
stroke style) + a `metadata.json` entry, then `pnpm icons:generate`. Recommendation: skip
unless a design need arises — the alias covers the discoverability gap the report actually
raised.

### C.2 — Block `context/*.md` coverage (S)

New page blocks now get `llms/block/*.md` (the surface agents read) but not
`context/block/*.md`. The older layouts-blocks have context docs
(`apps/site/public/context/*.md`). For full parity, extend `scripts/context/generate.ts`
to include `registry.blocks` (mirror the `blockEntries()` normalization added to
`scripts/llms/generate.ts`), then `pnpm regen`. Low impact — `llms/block/*.md` already
covers the primary AI need; do this only if context/intent docs for blocks are requested.

---

## Suggested sequencing

1. **PR 1 — Track A** (A.1 cheap guard first, then A.2 example). Highest value: turns a
   "verified ✅" doc claim into an actually-verified one, and A.1 alone locks the dist
   contract the SSR docs depend on.
2. **PR 2 — Track B** (B.1 dep → B.2 check as warn/error split → B.3 burn-down → gate).
3. Appendix items folded into whichever PR touches icons/context, or skipped.

Each PR: `pnpm ready` green (regen → check --fix → build → typecheck → tests); run
`pnpm ready:ci` on PR 1 (it exercises the exact cold-build ordering the SSR example
depends on). Commit regenerated artifacts.
