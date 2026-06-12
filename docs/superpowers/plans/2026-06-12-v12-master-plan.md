# v12 Master Plan — The Long Run (Lifecycle, Contract, Distinctiveness, Receipts, Resilience)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-12-v12-tranche-1.md` … `2026-06-12-v12-tranche-6.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans.
>
> **Hard dependency:** v12 builds on v11 (`docs/ROADMAP-V11.md`). T1 requires v11's
> registry schema v2, `cascade.lock`, versioned `r/<name>@<version>.json` output, and the
> three-way-merge `update`. If v11 has not landed when a tranche starts, STOP and
> re-sequence — do not re-implement v11 pieces ad hoc.

**Goal:** Execute `docs/ROADMAP-V12.md` — close the five lifecycle pain points of current
UI libraries: (1) copy-paste maintenance debt → advisory feed + `cascade audit` + drift
provenance + CI update automation; (2) styling lock-in → CI-enforced customization
contract + generated theming docs; (3) same-ness → theme studio + composable axes +
gallery; (4) bundle/hydration weight → size budgets + RSC boundary audit + published
receipts; (5) a11y fragility → contract tests that travel with copied code +
`audit --a11y` + nested-composition matrix.

**Architecture:** No new packages. `@cascade-ui/registry` (v11) gains advisory + drift
types; the CLI gains `audit` and extends `doctor`/`add`; `packages/components` gains
contract-test files + composition tests; `packages/themes` optionally gains axis partials;
`apps/docs` gains Theme Studio, Size, and theming-docs surfaces; `.github/` gains the
update-automation composite action; `scripts/` gains size/RSC/theming-docs generators
wired into the regen pipeline.

**Tech stack:** unchanged — React 18+, modern CSS, Preact signals, vitest, vp toolchain.
Size measurement uses build output analysis (vp/Rolldown stats or a minimal size-limit
style script — decided in T4 after evaluating what vp exposes).

---

## Research findings (ground truth — verified 2026-06-12 unless marked v11-dependent)

### The five pain points this version answers (user-supplied research, cross-checked)

1. **Copy-paste maintenance overhead** (shadcn-class systems): no `npm update` path for
   security/a11y fixes; local customization makes core-vs-proprietary indistinguishable.
   Confirmed by shadcn discussions #7170/#1467 (v11 research) — and v11's lockfile/merge
   answers only the _mechanics_; nothing yet _notifies_ or _classifies_.
2. **Styling lock-in** (Carbon/Chakra-class): rigid tokens force `!important` overrides;
   Chakra's Emotion runtime costs at render; Bulma/Tailwind-class systems trade it for
   class soup. cascade's token architecture avoids this _by convention_ — unproven as a
   contract.
3. **Same-ness** (shadcn "Vercel-chic", Chakra defaults): default-styled apps look
   identical; rebranding rigid systems costs more than they saved. tweakcn's existence is
   the market proof (v11 research).
4. **Bundle + hydration** (monolithic imports, CSS-in-JS hydration, RSC): State of React
   2025 — CSS-in-JS churn + bundle weight top-10 pains; RSC compatibility is now a
   checklist item (v11 research).
5. **A11y fragility**: customized copies break keyboard/ARIA silently ("broken keyboard
   effect"); nested composition (focus traps, announcements) is fragile and untested in
   user projects. cascade's tests currently live only in this monorepo.

### cascade ground truth relevant to v12

- **CLI**: commands `init/add/list/update/theme/generate/doctor` (+v11: `registry build`,
  `search`, `view`, `tokens import`). `doctor.ts` exists today (component-rule checks) —
  `--drift` extends it. v11 adds `utils/lock.ts` (item → registry, version, file hashes)
  and `utils/merge.ts` (diff3) — `audit` and drift reuse both.
- **Registry**: v11's `@cascade-ui/registry` owns schema v2 (additive evolution
  guaranteed by its validator design — unknown fields warn, never fail), per-item
  `version` + `changelog`, static `r/<name>.json` + `r/<name>@<version>.json`.
  Advisories slot in as a new optional item field.
- **Components**: every component dir ships tsx + module css + `component.meta.ts` +
  tests. Registry `files` today lists source files — **whether test files are included
  must be audited in T5** (assumption: they are not).
- **Themes**: 5 themes, v9 parity key-set test (`packages/themes/src/parity.test.ts`),
  oklch values; MCP `create_theme` (three-color derivation, oklab color-mix); v11 adds
  DTCG export/import + theme-type registry items.
- **Docs app** (Preact): per-component pages (`ComponentPage.tsx`), nav from registry,
  llms + conformance generators (v11) establish the generated-surface pattern; Playground
  page exists (`PlaygroundPage.tsx`) — the Theme Studio is a sibling page.
- **Prebuilt distribution**: `packages/react` re-exports all components
  (`@cascade-ui/react`) — the size-budget target. Copy-paste path has no library bundle
  by construction.
- **Examples**: `apps/examples/react-next` (Next.js App Router, RSC demo) — the RSC
  matrix host. Landing/examples are real React: `useSignals()` rule applies.
- **Components are "use client"-marked per RSC-compat claim in CLAUDE.md** — actual
  per-component directive state must be audited in T4 (the claim has never been enforced
  by a test).
- **CI**: `.github/workflows/` has ci + cf-pages deploy (+v11: directory validation).
  Composite actions precedent: none yet — T1 adds the first.

---

## Decisions

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                | Rationale                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Advisory schema (in `@cascade-ui/registry`): item-level `advisories: [{ id: 'CSA-2026-001', severity: 'low'\|'moderate'\|'high'\|'critical', affectedVersions: semver-range, fixedIn: version, summary, refs[] }]`; surfaced in both the index and per-item JSON                                                                                                                                        | Additive on schema v2; community registries inherit the mechanism            |
| 2   | `cascade audit`: for each lock entry, fetch current item JSON from its **recorded source registry**, match `affectedVersions` against locked version; output table (item, severity, advisory, fixedIn, drift status) + exit 1 on findings ≥ a `--level` threshold                                                                                                                                       | npm-audit ergonomics on owned code; CI-friendly                              |
| 3   | `audit` pairs every finding with provenance from drift analysis — "affected AND customized" warns that `update` will three-way merge, never that it auto-fixes                                                                                                                                                                                                                                          | Honesty rule; roadmap decision 2                                             |
| 4   | `cascade doctor --drift`: per lock entry, fetch `r/<name>@<lockedVersion>.json` base → classify pristine (hash match) / customized (line diff count vs base) / conflicted (marker scan) / unknown (no lock entry); `--json` for tooling                                                                                                                                                                 | Line-level core-vs-custom answer to pain #1b; reuses v11 base-fetch path     |
| 5   | Update automation: composite action `.github/actions/cascade-update/` + documented workflow recipe — schedule → `cascade audit --json` + `update --check --json` → if actionable, run `update` non-interactively (`--yes`, clean merges only; conflicts leave a draft PR note) → open PR via `peter-evans/create-pull-request` or `gh` (pick at implementation; no custom infra)                        | Dependabot-for-vendored-code with zero hosted services                       |
| 6   | CSS contract test (repo-wide, in components package): parse every `*.module.css`; assert zero `!important`; assert visual-property values (color/background/border/box-shadow/border-radius/margin/padding/gap/font-_) are `var(--cascade-_)`, `var(--\_\*)`, or structural keywords (none/transparent/inherit/currentColor/0); maintain an explicit, commented allowlist file for justified exceptions | Pain #2 becomes a gate; allowlist keeps it honest rather than rubber-stamped |
| 7   | Generated theming docs: `scripts/` generator emits per-component token tables (name, default value resolved from tokens/themes, description if present) consumed by `ComponentPage.tsx` as a "Theming" section with a live token-editing example (signal-driven)                                                                                                                                        | Zero-drift, same pipeline as llms/conformance                                |
| 8   | `cascade theme create`: interactive prompts (base colors → preview ramp in terminal where possible, axes selection) wrapping the existing `generateThemeCss` + v11 DTCG machinery; writes theme CSS + optional DTCG                                                                                                                                                                                     | CLI parity with MCP `create_theme`; the studio's headless twin               |
| 9   | Theme Studio = docs page (`ThemeStudioPage.tsx`): semantic-token + axis editors, live preview rendering real components (reuse docs demos), exports: theme CSS file, DTCG JSON, shareable URL (full state in location.hash, no backend)                                                                                                                                                                 | tweakcn-class tool, first-party; pain #3                                     |
| 10  | Axes: palette / shape (radius + border treatment) / density (spacing multiplier) / type (font stack + scale) as CSS partials generated by the studio. First-party themes re-expressed as presets ONLY if the v9 parity test + visual review pass; else axes stay studio-output-only in v12                                                                                                              | Distinctiveness without destabilizing shipped themes                         |
| 11  | Theme gallery: docs page listing first-party + directory theme items (v11 `type: 'theme'`) with preview swatches + `cascade add` snippets                                                                                                                                                                                                                                                               | Community surface for distinctiveness; builds on v11 directory               |
| 12  | Size receipts: script measures per-component cost via isolated Rolldown builds of single-component entries from `@cascade-ui/react` (minified + gzip); budgets in a committed `size-budgets.json`; CI compares; docs Size page generated from results                                                                                                                                                   | Receipts not vibes; budget file makes regressions reviewable                 |
| 13  | RSC audit: classification file `rsc-matrix.json` (component → server-safe \| client + reason); test walks component sources asserting directive presence matches the matrix; `react-next` example gains a page rendering all server-safe components inside an RSC                                                                                                                                       | Pain #4b; CLAUDE.md's RSC claim becomes enforced                             |
| 14  | Contract tests travel: each component gains `<name>.contract.test.tsx` — keyboard + ARIA assertions only, importing exclusively from the component's own files + @testing-library (no monorepo-internal imports, so it runs in user projects); registry `files` includes it; `cascade add` copies by default, `--no-tests`/config opt-out                                                               | Pain #5a: the broken-keyboard effect gets a tripwire in the user's repo      |
| 15  | `cascade audit --a11y`: locates installed components (lock/outputDir), runs vitest on their copied contract tests + axe smoke per component (requires vitest + jsdom in the user project — detected, with actionable install hint if missing)                                                                                                                                                           | Audits the _customized_ code, which our CI can never see                     |
| 16  | Nested-composition matrix (components package integration tests): menu-in-modal, modal-from-dropdown, combobox-in-sheet, toast-over-dialog — assert focus placement, Escape unwinding order, `aria-live` announcements, scroll lock; each scenario doubles as a docs example                                                                                                                            | Pain #5b; v11-T4 popover/top-layer work makes these meaningfully testable    |
| 17  | "Why cascade" page extends with claims 8–13, each linking its receipt (audit demo, drift output, contract-test CI run, studio, size page, RSC matrix)                                                                                                                                                                                                                                                   | Same receipts-not-adjectives bar as v11-T7                                   |
| 18  | Deferred explicitly: hosted advisory DB, codemods, Figma kit, visual-regression service, classless layer, rich text                                                                                                                                                                                                                                                                                     | Scope control                                                                |

## Tranche map

| Tranche | File                          | Contents                                                                                                                                       | Risk                                                                                       |
| ------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| T1      | `2026-06-12-v12-tranche-1.md` | Advisory schema + `cascade audit`, `doctor --drift` provenance, update-automation composite action + recipe                                    | Medium-high (depends on v11 T1/T2 surfaces; non-interactive update safety)                 |
| T2      | `2026-06-12-v12-tranche-2.md` | CSS customization-contract tests (no `!important`, token coverage), generated per-component theming docs, `cascade theme create`               | Medium (contract false-positive tuning; first repo-wide sweep will find violations to fix) |
| T3      | `2026-06-12-v12-tranche-3.md` | Theme Studio page, composable axes, theme gallery                                                                                              | Medium (studio scope discipline; axis/preset visual review)                                |
| T4      | `2026-06-12-v12-tranche-4.md` | Per-component size measurement + budgets + CI gate + docs Size page, RSC matrix + enforcement test + react-next RSC page, hydration bench note | Medium (vp/Rolldown stats API unknowns; Next/example build times)                          |
| T5      | `2026-06-12-v12-tranche-5.md` | Contract tests authored + shipped via registry, `cascade add --no-tests` plumbing, `audit --a11y`, nested-composition matrix                   | High (test portability outside the monorepo is the hard part)                              |
| T6      | `2026-06-12-v12-tranche-6.md` | Why-page claims 8–13 + receipts, README/llms refresh, DoD walkthrough, roadmap close-out                                                       | Low                                                                                        |

## Cross-cutting rules (every tranche)

1. **v11 surfaces are dependencies, not suggestions.** Re-verify each assumed surface
   (lock shape, `r/@version` availability, merge module, directory) at tranche start;
   if missing, stop and escalate rather than re-implementing.
2. **Generated, never hand-maintained**: theming docs, size page, RSC matrix page,
   gallery data — all flow through the regen pipeline and the drift gate
   (`git diff --exit-code`).
3. **Offline-testable**: audit/drift/gallery network paths go through the v11 `http.ts`
   wrapper with injected fetch in tests; no live calls in CI.
4. **Honesty in tooling output**: audit/drift/update never overstate ("merged cleanly" ≠
   "verified working"); every automated PR body says what was and wasn't checked.
5. **House component rules** bind all component/docs work (signals, tokens, logical
   properties, i18n chrome strings, `useSignals()` in React apps).
6. **Surgical changes**: the contract sweep (T2) fixes only genuine violations it finds;
   broader refactors are out.
7. **Gate before committing** (CLAUDE.md): `pnpm exec vp check` → `pnpm build` →
   `pnpm exec vp run -r check` → `pnpm test` → regen → `pnpm exec vp check --fix` →
   `git diff --exit-code`.

## Edge cases / risks registry

1. **v11 slippage:** if any v11 tranche is unmerged, T1 is blocked (lock, versioned
   bases). The tranche docs name their exact prerequisites; re-sequence rather than fork.
2. **Advisory semantics on customized files:** a user may have already hand-fixed the
   issue locally — audit reports exposure by _version_, and the drift column communicates
   uncertainty. Never auto-dismiss, never auto-claim safe.
3. **Non-interactive `update --yes` in the action:** clean three-way merges only;
   any conflict aborts that item and the PR body lists it as manual work. The action must
   be idempotent (re-runs find existing PR and update it, not stack duplicates).
4. **Contract-test sweep fallout (T2):** the first run will find real violations
   (hardcoded values, maybe `!important`). Budget fixing into the tranche; allowlist only
   with a written justification per line.
5. **Token default resolution (T2 docs):** component token defaults may resolve through
   theme chains — resolve against the light theme and say so; don't invent values.
6. **Studio scope creep (T3):** semantic tokens + 4 axes + export + share URL is the
   whole v12 studio. No undo stack, no component-level token editing, no theme upload —
   listed as explicit non-goals in the tranche.
7. **Hash-state size (T3):** full token state in the URL can get long — compress
   (lz-string-style; evaluate a tiny dep for docs app only) or encode deltas from a base
   theme; URLs must stay shareable in chat tools (~2k chars target).
8. **Per-component build measurement (T4):** entry-per-component builds of
   `packages/react` may hit cross-component imports (e.g. shared internals) — measure
   _delta over baseline_ methodology if isolation is impossible; document methodology on
   the Size page.
9. **RSC matrix churn (T4):** new components must declare their classification —
   enforcement test fails on unlisted components, which is the desired pressure; factory
   templates updated accordingly.
10. **Contract-test portability (T5):** no monorepo aliases, no `@cascade-ui/*` dev-only
    imports, testing-library + vitest only, relative imports into the component's own
    folder. Prove it: a fixture "user project" in CLI integration tests installs a
    component + tests and runs them green WITHOUT the monorepo's vitest config.
11. **`audit --a11y` environment variance (T5):** user projects have arbitrary vitest
    configs — run with an isolated minimal config shipped by the CLI (temp file) rather
    than inheriting theirs; document the boundary.
12. **jsdom limits for composition tests (T5):** top-layer/popover behavior in jsdom is
    partial (v11-T4 learnings apply) — assert on ARIA/focus/order semantics, not pixel
    stacking; note any browser-only gaps honestly in the matrix doc.
13. **Axis presets vs theme parity (T3):** re-expressing first-party themes as presets
    risks subtle value drift — the v9 parity test plus a manual visual pass gate it;
    fallback (axes as studio-output-only) is pre-approved by roadmap decision 8.
