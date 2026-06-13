# cascade — Roadmap v12: The Long Run

**Last updated:** 2026-06-12
**Status:** 📋 Planned (builds on v11 — The Open Ecosystem)
**Plan documents:** `docs/superpowers/plans/2026-06-12-v12-master-plan.md` + tranches 1–6

---

## Vision

v11 opens cascade into an ecosystem. v12 makes adopting it **safe for years**. Across
headless copy-paste systems (shadcn/ui), class-based frameworks (Bulma), component-heavy
libraries (Chakra), and rigid enterprise systems (Carbon), users keep hitting the same five
walls — and every one of them is a _lifecycle_ cost, not a day-one cost:

1. **Copy-paste maintenance debt** — no upstream fix flow, no way to tell core code from
   local business logic.
2. **Styling lock-in** — rigid tokens, `!important` wars, runtime CSS-in-JS overhead vs.
   unreadable utility soup.
3. **Same-ness** — opinionated defaults so good that thousands of apps look identical;
   real branding costs more than the library saved.
4. **Bundle weight and hydration cost** — monolithic imports, CSS-in-JS hydration taxes,
   RSC incompatibility.
5. **A11y fragility** — the moment you customize the copied dropdown, keyboard navigation
   silently breaks, and nested composition (focus traps, announcements) is untestable.

> Concept: **"The long run."** Every v12 deliverable answers the question a staff engineer
> asks before adopting a design system: _what does this cost me in year two?_ The answer
> becomes: advisories reach your vendored code, your customizations are measurable and
> mergeable, your brand stays yours, your bundle stays flat, and your keyboard contract is
> tested in **your** repo — not just ours.

## The diagnosis (pain → what cascade has → what's missing)

| #   | Pain (industry)                    | cascade today (incl. v11)                                                             | Gap v12 closes                                                                                                                                  |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Copy-paste maintenance debt        | v11: per-item versions, `cascade.lock`, three-way-merge `update`, `update --check`    | No advisory channel (security/a11y fixes don't _reach_ users), no drift visibility (core vs. custom), no CI automation                          |
| 2   | Styling lock-in, `!important` wars | Three-level tokens, semantic theme layer, component tokens, no Tailwind/CSS-in-JS     | The customization promise is convention, not contract: nothing proves every visual is token-overridable; per-component theming docs don't exist |
| 3   | Same-ness / brand dilution         | 5 first-party themes, MCP `create_theme`, v11 DTCG import, themes as registry items   | No visual theme tool (tweakcn moment), no composable theme axes — two cascade apps with default config still look alike                         |
| 4   | Bundle + hydration cost            | Zero runtime CSS-in-JS, signals (no re-render storms), copy-paste = only what you use | No per-component size budgets/receipts, no RSC boundary audit (`"use client"` discipline unproven), no hydration numbers                        |
| 5   | A11y fragility after customization | WCAG AA manifests, v11 conformance page, FSM/keyboard tests in **our** repo           | Tests don't travel with copied code; no way to audit a _customized_ component; nested-composition behavior untested                             |

## The pitch additions (extends v11's seven claims)

| #   | Claim                                   | Substance                                                                                                                      |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 8   | **Advisories reach vendored code**      | Registry items carry advisories; `cascade audit` checks your lockfile like `npm audit` — for code you _own_.                   |
| 9   | **Your customizations are first-class** | `cascade doctor --drift` classifies every installed component (pristine / customized / conflicted) with line-level provenance. |
| 10  | **Customization is a contract**         | CI-enforced: zero `!important`, every visual property token-driven — proven by test, not promised by docs.                     |
| 11  | **Distinct by construction**            | Theme studio + composable axes (palette × shape × density × type) — default-config apps stop looking alike.                    |
| 12  | **Performance receipts, per component** | Published size table with CI budgets; RSC boundary matrix; hydration benchmarks.                                               |
| 13  | **The keyboard contract travels**       | A11y contract tests ship _with_ copied components and run in your repo; `cascade audit --a11y` checks customized code.         |

## Workstreams

| #   | Workstream              | Tranche | Summary                                                                                                                                                 |
| --- | ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Maintenance lifecycle   | T1      | Advisory schema + feed, `cascade audit`, `cascade doctor --drift` (core-vs-custom provenance), CI update automation (GitHub Action recipe).             |
| B   | Customization contract  | T2      | Repo-wide CSS contract tests (no `!important`, token coverage), generated per-component theming docs, `cascade theme create` interactive flow.          |
| C   | Distinctiveness engine  | T3      | Theme studio (visual editor in docs, live preview, CSS/DTCG/share-URL export), composable theme axes, community theme gallery.                          |
| D   | Performance receipts    | T4      | Per-component size budgets in CI + published size page, RSC boundary audit + matrix in the Next.js example, hydration bench numbers.                    |
| E   | Resilient accessibility | T5      | Keyboard-contract test files shipped with copied components, `cascade audit --a11y`, nested-composition integration matrix, focus primitives hardening. |
| F   | Receipts + launch gates | T6      | "Why cascade" page gains claims 8–13 with receipts, README/llms refresh, DoD walkthrough.                                                               |

## Decisions baked in

1. **Advisories live in the registry, not a side channel.** Schema v2 is additive (v11
   decision): items gain `advisories: [{ id, severity, affectedVersions, fixedIn,
summary, refs }]`. `cascade audit` resolves the lockfile against the registries that
   installed each item — community registries get the same mechanism for free.
2. **`audit` works on owned code honestly.** It reports _advisory exposure_ (your locked
   version is affected) and pairs each finding with the fix path (`cascade update <item>`
   → three-way merge). It never claims your customized file is "patched" — `doctor
--drift` provenance is shown alongside.
3. **Drift is measured against the pinned base.** `doctor --drift` diffs local files
   against the `r/<name>@<version>.json` base recorded in the lock: pristine (hash match),
   customized (N lines diverged, shown per file), conflicted (markers present). No lock →
   honest "unknown (pre-lockfile install)".
4. **Update automation is a recipe, not a service.** A documented GitHub Actions workflow
   (composite action in this repo) runs `cascade audit` + `update --check` on schedule and
   opens a PR with the merged result. Dependabot-for-vendored-components, zero
   infrastructure.
5. **The customization contract is CI-enforced, repo-wide.** A vitest parses every
   component CSS file: zero `!important`; every _visual_ declaration (color, background,
   border, shadow, radius, spacing, font) resolves to `var(--cascivo-*)` or a private
   `--_*` knob — structural properties (display, position, grid tracks) are allowlisted.
   Failures name file:line. This turns pain #2 from a promise into a gate.
6. **Theming docs are generated from manifests.** Each component's docs page gains a
   "Theming" section listing its `meta.tokens` with defaults and an editable live example —
   same zero-drift pipeline as llms/conformance.
7. **The theme studio is client-only.** A docs-app page (signals, house rules): edit
   semantic tokens + axes with live preview on real components, export as theme CSS,
   DTCG JSON (v11 pipeline), or a shareable URL (state in the hash). No backend, no
   accounts. It is cascade's tweakcn — first-party, day one.
8. **Distinctiveness comes from composable axes.** A theme = palette × shape (radius/
   border treatment) × density (spacing scale) × type (font pairing/scale). Axes ship as
   small CSS partials the studio composes; first-party themes are re-expressed as axis
   presets **only if** the v9 theme-parity test stays green and visual diffs are
   reviewed — otherwise axes remain studio-output-only this version.
9. **Size budgets bind the prebuilt distribution.** Per-component byte budgets on
   `@cascivo/react` build output (the copy-paste path has no bundle by construction —
   say so on the receipts page). Budget breach fails CI; the size table publishes to docs.
10. **RSC discipline is audited, not assumed.** Classify every component:
    server-renderable (no directive) vs. client (`"use client"` present and justified by
    signals/handlers). A test enforces the classification; the `react-next` example
    renders the server-safe set in actual Server Components.
11. **A11y contract tests travel with the code.** Each component's keyboard-contract spec
    (`<name>.contract.test.tsx` — focused on keyboard + ARIA, no internal imports) is
    listed in its registry files and copied by `cascade add` (opt-out:
    `--no-tests` / config flag). `cascade audit --a11y` runs axe + the copied contract
    tests against the user's possibly-customized components.
12. **Nested composition gets a test matrix.** Menu-in-modal, modal-from-dropdown,
    combobox-in-sheet, toast-over-dialog: focus, Escape-unwinding, and announcement
    assertions live in the components package as integration tests (and double as
    documentation examples).
13. **No new packages, no paid tier.** Everything lands in existing packages + docs;
    `@cascivo/registry` (v11) absorbs the advisory/drift types.

## Definition of Done

- [ ] An advisory published for a registry item is reported by `cascade audit` in a
      project whose lock pins an affected version, with severity and the `update` fix
      path; a fixed/unaffected project reports clean. Works for a community-registry item
      in the fixture suite.
- [ ] `cascade doctor --drift` classifies pristine/customized/conflicted correctly across
      the scenario matrix (untouched install, edited file, conflict markers, pre-lockfile
      project) with per-file diverged-line counts.
- [ ] The documented GitHub Action, run against a demo repo/fixture, opens a PR containing
      a three-way-merged component update with audit output in the PR body.
- [ ] The CSS contract test runs repo-wide and is green: zero `!important` anywhere,
      visual-property token coverage at 100% (allowlist documented); intentionally
      violating a fixture fails with file:line.
- [ ] Every component docs page shows a generated Theming section (tokens + defaults +
      live edit); `cascade theme create` produces a valid theme interactively (parity test
      passes on its output).
- [ ] The theme studio edits axes + tokens with live component preview and exports all
      three formats; a shared URL reproduces the exact theme; two default-axis-preset
      combinations produce visibly distinct apps (screenshot pair recorded in the PR).
- [ ] CI fails when a component exceeds its size budget (proven on a fixture breach); the
      published size page lists every `@cascivo/react` component with measured bytes;
      the copy-paste-has-no-bundle note is explicit.
- [ ] RSC matrix: server-safe components render inside a real Server Component in
      `react-next` without hydration warnings; the classification test fails if a
      `"use client"` directive is added/removed against the recorded matrix.
- [ ] `cascade add` copies contract tests by default (opt-out works); in a fixture
      project, breaking keyboard handling in a customized dropdown makes
      `cascade audit --a11y` fail with the contract-test name; the nested-composition
      matrix (4 scenarios) is green in the components package.
- [ ] "Why cascade" page states claims 8–13 with reproducible receipts; README/llms
      updated.
- [ ] Full local CI gate exits 0: `vp check`, build, type check, tests, regeneration +
      `git diff --exit-code`.

## Deferred (do not re-litigate in v12)

- **Hosted advisory database / CVE registration** — the registry-embedded feed is the
  v12 ceiling; a hosted DB is infrastructure cascade doesn't need yet.
- **Automated codemods for breaking component changes** — the three-way merge + changelog
  covers v12; codemod tooling is its own project (revisit with real demand).
- **Figma kit** — still gated on DTCG adoption (v11 deferral stands); the theme studio's
  DTCG export is another step toward it.
- **Visual regression service (Chromatic-style)** — screenshot pairs in PRs are the v12
  bar; a service is out of scope.
- **Bulma-style classless/utility layer** — fighting on that terrain contradicts the
  token contract; not a direction.
- **Rich text editor** — v11 deferral stands.
