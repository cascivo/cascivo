# Remediation plan for the 2026-07 adoption audit

Companion to [`audit-ai-first-adopter-2026-07.md`](./audit-ai-first-adopter-2026-07.md).
Every item below maps to a numbered audit finding, states the concrete change, and ends with
a verification gate. Work is grouped into six waves, each shippable as one or a few focused
PRs. Waves 0–2 are days of work and remove every trust-breaking issue; waves 3–5 are the
larger program.

Effort scale: **S** = under half a day, **M** = 1–2 days, **L** = 3–5 days, **XL** = a week+
or requires humans/hardware.

---

## Wave 0 — Honesty fixes (ship first, no design decisions needed)

Nothing here changes behavior; it makes every public claim true. One PR.

### 0.1 Reword the AT-testing claims — S
- `apps/site/src/marketing/pages/AccessibilityStatement.tsx:64-72`: replace
  "Representative manual AT testing across 12 components and 4 stacks" with truthful copy:
  the matrix and methodology exist (`docs/specs/at-matrix.md`, `at-methodology.md`), results
  are pending. Change the "12 × 4" stat card to "matrix defined — results pending".
- `apps/site/src/marketing/pages/WhyCascadePage.tsx:105`: same rewording ("documents tested
  components" → "defines the test plan").
- `readme.body.md` highlights: change "an AT support matrix (NVDA / JAWS / VoiceOver)" to
  "an AT test plan (results pending)" — restore the strong wording only when Wave 5.3 lands.
- **Verify:** `grep -ri "manual AT testing\|documents tested" apps/site/src docs readme.body.md`
  returns nothing that asserts completed testing; `pnpm regen && git diff --exit-code` on
  README after body edit is committed.

### 0.2 Scope the axe claim — S
- `AccessibilityStatement.tsx:80`: "Zero axe violations across all components in CI" →
  "Zero axe violations in the CI-gated interaction suite (tables, forms, dialogs)".
  Wave 5.2 widens the gate, then the copy can widen again.
- **Verify:** grep as above; claim text matches the states listed in
  `apps/bench/runner/src/a11y.ts`.

### 0.3 Make the hand-written README numbers generated — M
The badge/table are generated and correct; the Highlights prose rotted. Remove the ability
to rot:
- Add placeholders to `readme.body.md` (e.g. `{{count.components}}`, `{{count.charts}}`,
  `{{count.themes}}`), filled by `scripts/readme/generate.ts` from `registry.json` and
  `packages/themes/src` (theme count = theme files minus `all.css`, `base.css`,
  `tailwind.css` → 12 today).
- Fix the theme badge (14 → generated), the site's `themeCount()` in
  `apps/site/vite.config.ts:30-37` (exclude `tailwind.css` so it stops injecting 13), and
  leave `ChartShowcase.tsx:92` reading the same injected constant instead of hardcoding.
- Fix the repo-structure tree in `readme.body.md` (drop `apps/docs/`, `apps/landing/`; show
  `apps/site`), and soften the Storybook line ("stories for every manifest" → generated
  count, see Wave 5.1).
- Add a `claims:check` script (node --test, same pattern as `breakpoint:check`) asserting no
  bare hardcoded counts remain in `readme.body.md`/marketing pages; wire into `pnpm ready`.
- **Verify:** `pnpm regen` produces a README where badge, highlights, table, and site all
  agree; `claims:check` passes; intentionally editing a count in `readme.body.md` fails CI.

### 0.4 Fix stale/wrong doc statements — S
- `docs/RELEASING.md`: mark the first-publish bootstrap section as completed history.
- `packages/cli/README.md:34`: `cascivo build` → `cascivo registry build`.
- README tree label for `packages/ai` ("AI context layer" → "AI-native components"); README
  `component.meta.ts` → `<name>.meta.ts` (also in `CLAUDE.md`'s manifest section).
- `skills/cascivo-design-page/SKILL.md:30`, `skills/cascivo-extend/SKILL.md:18`:
  `apps/docs/public/llms.txt` → `apps/site/public/llms.txt`.
- **Verify:** `grep -rn "apps/docs" skills/ docs/ readme.body.md` → no hits;
  `grep -rn "component.meta.ts"` → no hits outside historical roadmap files.

---

## Wave 1 — Release & correctness bugs

### 1.1 `@cascivo/flow` missing from `build:release` — S
- Add `-F @cascivo/flow` to `build:release` in the root `package.json`.
- Prevent recurrence: add a check script (`scripts/checks/release-filter.test.ts`) that reads
  every `packages/*/package.json` with `private !== true` and asserts its name appears in
  `build:release`. Wire into `pnpm ready`.
- **Verify:** the new test fails when flow is removed from the filter; passes on the fix.

### 1.2 CLI version constant — S
- Replace `VERSION = '0.0.0'` (`packages/cli/src/index.ts:16`) with the package version
  injected at build time (vite `define` of `__CLI_VERSION__` from `package.json`, same
  pattern as the site's `__CASCIVO_COMPONENT_COUNT__`). Same fix for the `--help` banner.
  Audit the other published CLIs' banners (`@cascivo/mcp` server version) for the same bug.
- **Verify:** build, `node dist/index.mjs --version` prints the package.json version; add a
  unit test that imports the built constant.

### 1.3 Per-command `--help` — M
- In the dispatch switch (`packages/cli/src/index.ts:46-170`), intercept `--help`/`-h` in
  each command's argv **before** any prompt, fetch, or install runs; print usage + flags +
  one example per command. Add the currently undocumented commands (`tokens import`,
  `eject`, `generate`, `doctor --drift`, `theme add`) to both the top-level help and the CLI
  README command table.
- **Verify:** integration test matrix: for every command, `<cmd> --help` exits 0, prints a
  `Usage:` line, performs no network call (assert via injected fetch mock), and creates no
  files. `add --help` no longer says "Component \"--help\" not found".

### 1.4 `doctor` must be AST-aware and the library must pass it — M
- Fix the analyzer: strip comments and string literals before the banned-hook scan (a small
  tokenizer pass is enough; no full parser needed). Regression tests: a file with
  `useState` only in a comment passes; a real `useState` import/call fails.
- Fix the 4 real violations: `combobox.tsx:242`, `data-table.tsx:557,568`, `dock.tsx:20`,
  `steps.tsx:33` — route through `t(builtin.<component>.<key>)` with `labels` prop
  overrides per the authoring rules; add the keys to the `@cascivo/i18n` built-in catalog.
- Add `cascivo doctor --ci` (already exists) to the CI verify job so the library can never
  fail its own doctor again.
- **Verify:** `npx cascivo doctor` on the repo exits 0 with zero findings; new analyzer unit
  tests pass; CI job green.

### 1.5 Marketplace bot output fails the format gate — S
- In `.github/workflows/marketplace.yml` (and `scripts/registry/build-marketplace.ts`), run
  `vp fmt` on `apps/site/public/marketplace.json` before committing, or emit it
  pre-formatted from the generator.
- **Verify:** `pnpm exec vp check` is clean immediately after `build-marketplace` runs.

### 1.6 CI hardening — S
- Re-enable the `push: [main]` trigger in `ci.yml` (currently commented out).
- Decide on `visual.yml.disabled`: re-enable behind a label/nightly schedule, or delete it —
  a `.disabled` workflow reads as abandonware.
- Raise the registry-count guard in `ci.yml` from `>= 49` to a moving floor
  (`>= 185`, updated on release) so mass-deletion regressions can't pass.
- **Verify:** a push to main runs the full verify gate; guard fails on a truncated
  registry.json fixture.

---

## Wave 2 — CLI first-five-minutes

### 2.1 `add` must leave the user with something that renders — M
- After install, check the target `package.json` for `@cascivo/tokens`/`@cascivo/themes` and
  scan the project entry (or just always print) a next-step block:
  `import '@cascivo/themes/all'` + `data-theme` example. If neither package is present,
  offer to install `@cascivo/themes` (default yes; `--no-install-themes` to opt out).
- **Verify:** e2e test in a temp dir: `cascivo add button` output contains the theme
  instruction; with `--yes`, `@cascivo/themes` lands in package.json.

### 2.2 Non-interactive `init`, honest theme list — M
- Add `--theme <name>` and `--yes` (accept defaults, never prompt; also honor
  `CI=true`/non-TTY stdin as implicit `--yes`). Validate the theme against the real theme
  set exported by `@cascivo/themes` (12 today), and make the prompt list them all —
  delete the hardcoded "(light/dark/warm)" (also stale in the top-level help banner's
  `theme add` line).
- **Verify:** `echo | cascivo init` and `cascivo init --theme midnight --yes` both complete
  in a pipe with no TTY; unknown theme fails fast with the valid list.

### 2.3 Retire the "cascade" leftovers — M
- `cascade.lock` → `cascivo.lock`: write the new name; on read, fall back to `cascade.lock`
  and migrate it (rename) with a one-line notice. Keep the fallback for two minor versions.
- `~/.cascade/cache` → `~/.cascivo/cache`: caches are disposable — just switch the path.
- MCP bin: add `cascivo-mcp` to `packages/mcp` `bin`, keep `cascade-mcp` as a deprecated
  alias for one release; changeset callout.
- `.github/workflows/cf-pages.yml`: rename project defaults from `cascade-ui-*` to
  `cascivo-*` (coordinate with the CF dashboard — rename there first, then merge).
- Sweep remaining docs branding: `BENCHMARKS.md` title, `docs/THEMING.md`,
  `docs/MIGRATING-FROM-SHADCN.md`, `docs/ROADMAP.md` title; rename
  `apps/bench/app-cascade` → `app-cascivo` (update bench runner paths).
- **Verify:** `grep -rni "cascade" --include='*.{ts,tsx,yml,json,md}' packages apps docs .github | grep -vi cascade.lock-migration`
  reviewed down to intentional historical mentions; lockfile migration covered by a unit test.

### 2.4 One HTTP stack for all commands — M
- Route `fetchRegistry` (`utils/registry.ts:128-134`) and the `fetchText` copies in
  `add.ts`/`update.ts` through `utils/http.ts` (cache, 4 retries, 15s timeout, size cap).
- Make `add` transactional: collect all file fetches first; on any failure, delete files
  already written for that item and **do not** write the lockfile entry — exit non-zero
  naming the failed URL (replaces the `console.warn` at `add.ts:251-253`).
- Offline behavior: `list`/`view` serve from cache with a "cached from <date>" notice;
  `add` fails fast with a clear offline message.
- **Verify:** unit tests with mocked fetch: transient 500 → retry succeeds; hard failure →
  no partial files, no lockfile entry, exit 1; offline `list` after one warm run succeeds.

### 2.5 Templates reachable from the default registry — M
- Extend `scripts/registry/generate.ts` to fold `templates/cascivo-registry.json` entries
  into root `registry.json` as `type: "template"`, so `cascivo add <template>` and
  `create --template <bare>` resolve against the default registry (the `@ns/` directory
  path stays as-is for third parties).
- Fix the third-party heuristic while in there: `add.ts:138` keys on
  `itemUrl.includes('cascivo.com')` — make first-party detection match the actual file
  hosts (allowlist `cascivo.com` + `raw.githubusercontent.com/cascivo/cascivo`).
- Purge `example.com` / stray `cascivo.dev` URLs from the source metas feeding
  `registry.json`; add a generator assertion that every URL host is on the allowlist.
- **Verify:** `jq '[.components[] | select(.type=="template")] | length' registry.json` ≥ 3;
  e2e: `cascivo create --template dashboard` scaffolds in a temp dir; URL-host assertion
  fails on a planted `example.com` fixture.

### 2.6 Real versioning for the registry — L (design decision)
Recommended design (no per-component semver bookkeeping needed):
- **Pin content by release tag**: `registry:generate` stamps `registry.json` with the
  library release version and rewrites `files[]` raw URLs from `/main/` to the release tag
  (`/vX.Y.Z/`) as part of the release workflow. `main` keeps a dev registry; the deployed
  `cascivo.com/registry.json` is the tagged one.
- **Per-file hashes for updates**: generator adds `sha256` per file (the lockfile already
  stores install-time hashes). `cascivo update --check` compares lockfile hashes against
  registry hashes — accurate "outdated" detection without inventing per-component versions.
  Set entry `version` to the release version instead of `0.0.0`.
- Add `cascivo add <component>@<version>` / `--ref <tag>` for pinned installs.
- **Verify:** unit tests for hash-diff update detection; e2e: install at tag N, regenerate
  registry with a modified file, `update --check` flags exactly that component; raw-URL
  fetch of a tagged file returns 200.

---

## Wave 3 — AI layer delivery

### 3.1 Make the MCP server self-contained — M
- `packages/mcp/package.json` build script: copy `tokens.catalog.json`, `context.json`,
  `tokens.variants.json`, `marketplace.json` into `dist/` next to `registry.json`. Keep the
  network path as a freshness fallback, not a requirement.
- Fix the `templates.ts` bug regardless: add the same network fallback the other loaders
  have, and make an empty catalog an explicit error ("marketplace catalog unavailable"),
  never a silent `EMPTY`.
- Resolve the pnpm `catalog:` protocol concern: verify `pnpm publish` rewrites
  `@modelcontextprotocol/sdk`/`zod` to concrete ranges in the published tarball (inspect
  with `pnpm pack`); pin explicitly if not.
- **Verify:** `pnpm pack` the mcp package, install the tarball in an offline temp dir, run
  the server, and exercise all 20 tools — every one returns data, none errors. Add this as
  a CI smoke test (`deps:smoke` pattern already exists).

### 3.2 Context coverage for all registry types — L
- Extend `scripts/context/generate.ts` beyond `type:"component"` to charts, layouts, blocks,
  sections, flow, editor (66 currently invisible entries).
- Add `intent` to the 11 block manifests that lack it entirely; fill the 15 empty
  `examples: []` and triage the 14 empty `props: []` (real prop-less components get an
  explicit `props: 'none'` marker or allowlist entry, not silence).
- Harden the existing gate: extend `packages/components/src/intent-completeness.test.ts` to
  every meta in every registry-source package and to fail on empty `examples`/missing
  `intent`.
- **Verify:** `jq '.components | length' apps/site/public/context.json` == registry length;
  the completeness test fails when a fixture meta drops `intent`.

### 3.3 Register the orphaned manifests — M
- Root-cause why `scripts/registry/generate.ts` skips `packages/components/src/blocks/*`
  (12 metas) and `flow-canvas.meta.ts`, then either register them (files + category) or —
  if the blocks intentionally live in `packages/layouts`' registry space — delete/merge the
  duplicates so disk and registry agree.
- Add a generator assertion: every `*.meta.ts` under registry-source packages is either
  registered or on an explicit exclusion list with a reason.
- **Verify:** meta-file count vs registry count reconcile to zero unexplained gap
  (currently 204 vs 191).

### 3.4 Version/breaking-change surface for agents — M
- Generate `breaking-changes.json` (and a section in `llms.txt`) from changeset/changelog
  history: package, version, change type, affected components.
- Include the library version + per-file hashes (from 2.6) in `get_component` responses and
  `context.json` so an agent can detect drift between its training-time knowledge and the
  installed version.
- **Verify:** MCP `get_component('button')` returns `version` + `files[].sha256`; generator
  test over a fixture changelog produces expected JSON.

### 3.5 Structured prop types — M
- `grammar.ts` already parses TS-union strings into enums; serialize that parse into the
  registry/context output as `props[].schema` (`{kind: 'enum', values: [...]}` /
  `{kind: 'boolean'}` / `{kind: 'string'}` …) alongside the raw `type` string.
- **Verify:** schema present for all props of 5 sampled components; `validate_view` consumes
  the structured form (no behavior change, one parser).

### 3.6 Decide `@cascivo/ai` — M
- It's advertised in the README yet `private: true`/`0.0.0`. Recommend **publish**: add
  `files`, `repository`, `license`, real version, changeset, README pass, and add it to
  `build:release` (the 1.1 check will enforce that automatically). If instead it's not
  ready, remove it from the README package tables until it is.
- **Verify:** `npm view @cascivo/ai version` resolves post-release; README claim matches
  reality either way.

### 3.7 One canonical artifact host — S
- Code fetches `cascivo.com/...`; docs advertise `docs.cascivo.com/llms/...`. Pick one
  canonical base (recommend `cascivo.com`, with docs.cascivo.com serving the same tree),
  put it in a single shared constant used by the CLI, MCP loaders, llms generator, and
  README, and note the mirror explicitly.
- **Verify:** `grep -rn "docs.cascivo.com\|cascivo.com" packages scripts | sort -u` shows
  one constant definition; both hosts return the same `llms.txt` (deploy check).

---

## Wave 4 — Documentation program

### 4.1 Ship the two starter examples — L
- `apps/examples/react-vite`: a real minimal Vite + React app — the committed output of
  `cascivo init` + `cascivo add button card dialog`, one themed page, real
  `dev`/`build`/`test` scripts (replacing the `echo` placeholders). This doubles as a live
  test of the CLI flow.
- `apps/examples/react-next`: Next.js App Router app — `@cascivo/themes/all` imported in
  `app/layout.tsx` (Server Component), components used in both server and client trees, one
  streaming/RSC demo page.
- Wire both into `vp run -r build` and CI (they're workspace packages, so `pnpm ready`
  picks them up); follow the CLAUDE.md vite-alias checklist if either imports a
  dist-exporting package.
- **Verify:** `pnpm ready` builds both; a Playwright smoke test renders the vite example's
  page and asserts a styled (non-default-font) button.

### 4.2 Separate adopter docs from internal artifacts — M
- Create `docs/internal/` and move: `ROADMAP-V2..V58`, `superpowers/plans/`,
  `specs/mobile-audit-*.md`, `merge-plan.md`, `t4-color-audit.txt`, `THEME-PROPOSALS.md`,
  `feedback/` (this audit included). Keep `specs/` entries that are genuinely public
  (wcag-2.2, at-matrix, chart-palette) in place.
- Rewrite `docs/ROADMAP.md` as a short current-state pointer (it currently claims "ground
  truth" while 58 files supersede it); link the internal history.
- Add `docs/README.md`: a curated index — start here, guides, references, specs, internal.
- Move `FEATURES.md` out of the repo root into `docs/internal/` (it's the Carbon-cloning
  blueprint with LaTeX artifacts and npm commands), or rewrite it as a public architecture
  overview; fix or delete the dead `scripts/factory-supervisor.sh` reference.
- **Verify:** `ls docs/*.md` shows ~12 curated files; every entry in `docs/README.md`
  resolves (extend the existing link checker `scripts/quality/landing-links.ts` or add a
  docs variant to CI).

### 4.3 Write the missing adopter guides — L
Create, and link from `docs/README.md`, the site guides page, and `llms.txt`:
- `docs/GETTING-STARTED.md` — both install paths (CLI copy-paste vs `@cascivo/react`),
  themes import, first component; the in-repo mirror of the site's GettingStartedPage.
- `docs/USING-WITH-NEXTJS.md` — App Router/RSC/SSR: where to import CSS, `'use client'`
  boundaries, signals hydration notes; promote the existing FAQ entry into a real guide,
  backed by the now-real `react-next` example.
- `docs/TESTING.md` — consumer testing: Testing Library + signal-driven components,
  `useSignals` gotcha in React test environments, jsdom notes for `@container`/popover.
- `docs/TROUBLESHOOTING.md` + FAQ — start from the 8 site FAQ entries plus the failure
  modes this audit hit (unstyled components → missing themes import; frozen UI → missing
  `useSignals`; layer-order overrides → CSS-LAYERS-PITFALL).
- `docs/UPGRADING.md` — index of version notes (fold in the orphaned
  `v37-CONSUMER-CHANGES.md`), plus the policy: what changesets mean, how deprecations roll.
- Root `CHANGELOG.md` — generated index linking per-package changelogs per release tag
  (extend `scripts/readme/generate.ts` or a small new generator; regenerate in the release
  workflow).
- **Verify:** docs link-check passes; `llms.txt` lists the new guides after `pnpm regen`.

### 4.4 Package README pass — M
- `packages/search`: write a real `readme.body.md` (the only package without one — its
  README is a 21-line stub with a doubled `---`), or mark the package experimental
  (see 5.4).
- Thicken `ai` (33 lines), `themes` (35 — it has 12 themes and a 9KB theming guide to point
  at), `layouts` (39), `registry` (43), `render` (53).
- Fix bare-filename references in npm-facing READMEs (`CSS-LAYERS-PITFALL.md`, `TOKENS.md`
  in `packages/react/README.md`) to absolute GitHub URLs — bare names dead-end on
  npmjs.com. Add a generator rule so `readme:generate` rewrites relative doc links to
  absolute URLs for package READMEs.
- Document all 20 MCP tools in `packages/mcp/README.md` (currently 7).
- **Verify:** no package README under 60 lines without an "experimental" banner; link
  checker covers package READMEs.

---

## Wave 5 — Coverage & the big claims, earned

### 5.1 Storybook: close the 60% gap — L
- `stories:generate` covers 119 of 191 registry items. Extend the generator to emit at
  least a default + variant-matrix story for every registry item from its manifest (the
  manifests carry `variants`/`sizes`/`examples` — this is mechanical), or scope the README
  claim to the generated set (0.3 already softened it).
- Raise `audit:stories` to assert story-count == registry-count (minus an explicit,
  reasoned exclusion list).
- **Verify:** `pnpm audit:stories` fails if a new component ships without a story.

### 5.2 Axe over every story — L
- Add an axe sweep over the full Storybook build (test-runner + axe-playwright, or iterate
  `iframe.html?id=` with `@axe-core/playwright` in the existing bench runner) as a CI gate.
  Budget for triage of first-run findings across ~191 items — this is most of the effort.
- Once green, restore the site claim ("zero axe violations across all component stories,
  CI-enforced") — now true, and stronger than the original wording.
- **Verify:** CI job red on an injected violation (fixture story with missing label);
  green on main.

### 5.3 Actually run the AT matrix — XL (humans + environments)
- The 12×4 plan in `docs/specs/at-matrix.md` is well-scoped. Schedule real sessions:
  NVDA/Chrome + JAWS/Chrome on Windows, VoiceOver/Safari on macOS, TalkBack/Chrome on
  Android, following `at-methodology.md`. Record per-cell results with dates and versions;
  fix what fails; publish.
- Only then restore the Wave-0-removed site/README claims, now pointing at populated data.
- **Verify:** zero "not tested" cells for the 12 scoped components; site stat card renders
  from the data file rather than hardcoded prose (prevents this class of drift).

### 5.4 `search` and `video`: invest or label — M
- `packages/search` (2 source files) and `packages/video` (26 files, 1 test): either bring
  to standard (tests, README, registry presence) or mark both with an "experimental —
  API unstable, not part of the support surface" banner in their READMEs and the README
  package table. No middle state: half-built packages listed alongside finished ones read
  as neglect.
- **Verify:** README table and package READMEs agree on status; if kept, video gets a
  baseline test suite (target: every exported component has ≥1 render test).

---

## Sequencing and dependencies

```
Wave 0 (S–M, ~2 days)   → independent, ship immediately
Wave 1 (S–M, ~3 days)   → independent of 0; 1.4 i18n keys before 5.x a11y claims
Wave 2 (M–L, ~1.5 wks)  → 2.5 before 2.6 (registry generator changes stack);
                          2.6 unblocks 3.4
Wave 3 (M–L, ~1.5 wks)  → 3.2 depends on 3.3 (register blocks before generating
                          their context); 3.1 independent, do first
Wave 4 (M–L, ~2 wks)    → 4.1 independent and highest-visibility; 4.3's Next.js
                          guide depends on 4.1's react-next example
Wave 5 (L–XL, ongoing)  → 5.2 depends on 5.1; 5.3 is calendar-bound (humans),
                          start scheduling during Wave 1
```

Recurring guards introduced along the way (all wired into `pnpm ready`/CI so findings
can't regress): release-filter check (1.1), doctor in CI (1.4), claims:check (0.3),
registry URL-host allowlist (2.5), meta-vs-registry reconciliation (3.3), story-count
gate (5.1), MCP offline smoke (3.1), docs link check (4.2).
