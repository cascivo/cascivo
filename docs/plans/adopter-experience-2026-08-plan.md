# Fix plan: the 2026-07-30 + 2026-08-02 adopter experience reports

**Status: IMPLEMENTED (Phases 1–4), 2026-08-02.** Every workstream below has shipped with
its guard. The spec is kept as-written because it is the root-cause record; where
implementation diverged from it, the divergences are listed immediately below rather than
edited into the workstreams — a spec quietly rewritten to match what happened stops being
evidence of anything.

Nine new guards now run in `pnpm ready`; the full gate (regen, format, lint, 201 meta
checks, build, typecheck, all package tests) is green. **Do not treat this header as
evidence** — that is the mistake §0 Cause 1 is about. Run `pnpm ready`; the guards answer
the question continuously.

Where the plan and reality diverged, in summary:

- **§0 Cause 1 was wrong** and is corrected in place: the prior plan's seven workstreams had
  all shipped; only its status header was stale. The corrected finding is worse, not better.
- **WS-D5** did not add an `ariaLabel` alias for the chart `title` as specced. An alias
  requires making both optional, which drops the compile-time guarantee that every chart has
  an accessible name. Documented loudly instead, with a guard.
- **WS-F1** did not converge the identity field on `value`. The audit found a real rule
  underneath the reported inconsistency (`value` is handed to a callback; `id`/`key` is a
  React key that is never passed anywhere), so the fix was to state the rule, not to rename.
- Several workstreams found **more instances than reported** once their guard existed —
  recorded per-WS below.

This document is written to be handed to an implementing agent as-is: every issue is
root-caused against current source with `file:line` evidence (all verified at `b18ce298`),
and every workstream carries a design decision, implementation steps, an executable guard,
and acceptance criteria.

**Sources:**

- **R1** — 2026-07-30, Vite 7 + React 19 + React Router 8, Path B, scaffolded with
  `npx cascivo create`. `@cascivo/react` 0.13.1.
- **R2** — 2026-08-02, TanStack Start 1.168 (SSR) + TanStack Router + Query, Path B,
  hand-wired. `@cascivo/react` 0.14.0.

Both shipped. Neither was blocked. **The library core is not the problem** — R1 passed
`tsc --noEmit` on the first run across ~700 lines using ~35 components, and R2 called the
AI-facing docs surface "the product's best feature". Read the "What went well" sections
before touching anything: `setLinkComponent`, SSR-without-config, `ThemeProvider`,
`DataTable`, `CommandMenu`, and the JSDoc-carrying `.d.ts` are all working as designed and
must not regress while fixing the items below.

---

## 0. The meta-finding: why these keep coming back

The commissioning note for this plan is that the same red-flag categories — docs, CSS,
theme provider, dependencies — "were already mentioned multiple times, and it always was
mentioned to be fixed." That is accurate, and the repository shows why. Three structural
causes, and **every workstream below is required to close one of them.**

**Cause 1 — a prior plan looked unimplemented, and nobody could tell.**
`docs/plans/tanstack-start-experience-report-plan.md` is a complete, correct, file:line
root-caused spec for the 2026-07-17 report, and its header read
**"Status: planned — not implemented."** for months.

**Correction (2026-08-02): all seven of its workstreams had in fact shipped.** Verified
against current source during WS-G5 — package-manager detection, the `init` dependency set,
npm-entry installs, host-strict lint, docs prerendering, the `Stack` disambiguation and the
DataTable gutter are all in the tree. The header was stale, not the work.

That is a *worse* finding than the original reading, not a better one. The project could
not answer "did this land?" from anything but a fresh source audit, so the honest default
was to assume it hadn't. A status line nobody re-reads is indistinguishable from an
abandoned plan, and it cost this review a full re-triage. **This is the argument for
guards over documents**: a check that fails when a fix is reverted answers the question
continuously and for free; a status line answers it once, then rots. See §8 for the
disposition of that document.

**Cause 2 — fixes land on the instance, not the class, and ship without a guard.**
The pattern is visible three times over:

| Reported | What was fixed | What was left | Now resurfaces as |
| --- | --- | --- | --- |
| Deps invisible at `init` (2026-07-17 WS2) | `init` dependency handling | `create` — added later — reintroduced the identical bug class | R1 #4 (WS-A2) |
| `Timeline` can't show a failed entry (R1 #3) | PR #186 added a `tone` prop | `status: 'error'` still silently maps to `current` | Still live (WS-C1) |
| Docs name a primitive Path B can't reach | `path-b-parity.test.ts` guards *primitive names* | The same idea was never applied to *prop names* or *component identity* | R2 🚩1, 🚩2 (WS-B1, WS-D1) |

In each case the narrow symptom was fixed and the generating mechanism was left running.

**Cause 3 — the guard suite has a blind spot exactly where adopters live.**
`pnpm ready` runs ~25 checks. They are thorough about the *repo* — manifests, layers,
props parity, exports, packed tarballs. **Not one of them ever executes `cascivo create`
and inspects its output.** `scripts/checks/cold-adopter.test.ts` gets closest and explicitly
scopes itself to "the offline-docs leg", deferring the app leg as a follow-up. So the very
first artifact an adopter touches is the least-guarded thing in the project. That is not a
coincidence — it is the direct explanation for WS-A2 shipping four documented-rule
violations at once.

**The doctrine this plan imposes.** No workstream below is complete when the code is
correct. It is complete when a check in `pnpm ready` fails if someone reverts it. Where a
finding is a *documentation* problem, the fix is not "add a page" — a page nobody routes to
is how we got here. It is: put the fact on the surface the adopter is *already reading* at
the moment they need it, and add a check that fails when the two disagree. Every WS names
its guard explicitly. **A WS with no guard is not done.**

---

## 1. Triage

Verdicts are from direct source inspection, not from the reports.

### P0 — blocks or misleads a new adopter in the first hour

| # | Item | Verdict | Root cause | WS |
| --- | --- | --- | --- | --- |
| R1 #1 | `react-hooks/immutability` errors on the mandatory signal idiom | **Confirmed, undocumented** | `grep -rl "immutability\|react-compiler" docs/ packages/ scripts/ skills/` → **zero hits**. No stated position anywhere. | **A1** |
| R1 #4 | `cascivo create` violates four of cascivo's own documented rules | **Confirmed ×5** | `create.ts:16` `CASCIVO_DEP='latest'`; `:122` `@cascivo/core`; `:125` `@cascivo/tokens`; no `@preact/signals-react` in `:121-127`; `:424` always writes `cascivo.config.ts`; `:378` AGENTS.md names layer `cascivo.example` that `:183`'s `@layer` statement omits | **A2** |
| R1 #2 | `doctor --ci` fails a correct Path B app, advising what docs forbid | **Confirmed** | `doctor.ts:38` `isAdopterProject` gates on `cascivo.config.*`, which `create.ts:424` always writes → Path B app judged copy-paste → `doctor.ts:19-24` demands `@cascivo/core`+`@cascivo/tokens` | **A3** |
| R2 🚩1 | Docs for `AppShell` tell you to import a component that isn't exported | **Confirmed + 1 unreported** | `scripts/llms/generate.ts:201` `packageFor` keys on `displayNameOf(entry)`, not entry id → `layout/app-shell` inherits `app-shell`'s export → `:295` emits `import { AppShell } from '@cascivo/react'`. **`Calendar` is a second instance nobody reported.** | **B1** |
| R2 🚩2 | `Select.onValueChange` documented as law, does not exist | **Confirmed** | `select.tsx:27` `extends Omit<SelectHTMLAttributes<HTMLSelectElement>,'size'>` — DOM `onChange` only. `llms.txt` lists `Select` in the `onValueChange` row. | **D1** |
| R2 🚩3 | Horizontal bar chart silently drops category labels; docs discourage the fix | **Confirmed** | `use-chart.ts:142-148` `autoLabelStride` derives `widest` from *character count × 6.5px* — a **horizontal** text extent — then `bar-chart.tsx:429` compares it against `innerH`, the **vertical** band, when `orientation="horizontal"`. Dimension mismatch. | **C2** |
| R1 #3 | `Timeline status:'error'` renders as neutral `current` | **Confirmed, still live** | `timeline.tsx:12` `error: 'current'`. PR #186's `tone` prop is an additive workaround; the reported mapping is unchanged. | **C1** |

### P1 — produces wrong output, or wastes a build cycle

| # | Item | Verdict | Root cause | WS |
| --- | --- | --- | --- | --- |
| R1 #7 | `secondAxis.label` renders nothing | **Confirmed — dead nested prop** | Typed at `area-chart.tsx:175`, `line-chart.tsx:166`. Only `.format` is ever read (`:339`, `:620-621`). `grep -rn "secondAxis?.label"` → **no hits**. `dead-props:check` only walks top-level interface members, so a dead *nested object field* is invisible to it. | **C3** |
| R2 #6 | `tokens.catalog.json` advertised as a closed set, isn't | **Confirmed ×2** | Verified absent from `apps/site/public/tokens.catalog.json`: `--cascivo-sidenav-inline-size`, `--cascivo-sidenav-bg`, `--cascivo-data-table-max-height`, `--cascivo-button-radius`. Claim at `generate.ts:545`. | **D2** |
| — | Component metas document tokens that **do not exist** | **Confirmed — unreported root cause** | `page-header.meta.ts:20,21,24` and `app-shell.meta.ts:52` declare `--cascivo-font-size-2xl`, `--cascivo-font-weight-bold`, `--cascivo-font-size-sm`, `--cascivo-font-size-xs`. None exist in `packages/tokens/src/*.css`. Real names: `--cascivo-text-*`, `--cascivo-font-semibold`. Adopters styling against these get silently unresolved properties. | **D3** |
| R1 #6 | `Stat`/`Kpi` colour delta by direction, never sentiment | **Confirmed** | `stat.tsx:10` `trend?:'up'\|'down'\|'flat'` and nothing else; `kpi.tsx:47,64` derive tone from `delta >= 0`. An error-rate tile is green when errors rise. | **C4** |
| R1 #10 | `audit --ai` false **error** on valid HTML passthrough | **Confirmed** | `jsx-props.ts:24-...` `HTML_PASSTHROUGH` is a hand-maintained 48-name list; `noValidate` absent. Any unlisted valid attribute is a CI-gating error. | **E1** |
| R1 #11 | `audit --ai` `raw-string` warns on ordinary page copy | **Confirmed** | `raw-strings.ts` gates only on `info.hasContent`; `Text` — a typography primitive whose children *are* content — qualifies. Every sentence in a real app warns. | **E2** |
| R2 #4 | SSR recipe defeats per-component CSS tree-shaking; unstated | **Confirmed contradiction** | `GETTING-STARTED.md:211-213` advertises 137 KB tree-shaken; `USING-WITH-VITE-SSR.md:97` calls the aggregate import "required, not optional". Neither mentions the other. | **D4** |
| R1 #8 | Chart `title` is required but invisible | **Confirmed** | `area-chart.tsx:83` `title: string` (required) → `:358` `<caption>` + `:454` SVG label. Correct a11y, misleading name. | **D5** |

### P2 — real friction, breaking to fix, sequence deliberately

| # | Item | Verdict | WS |
| --- | --- | --- | --- |
| R2 #2 | Identity field has four names (`id`/`value`/`key`/none) across collection components | **Confirmed** | **F1** |
| R2 #3 | `label` means visible text, invisible a11y name, or nothing, depending on component | **Confirmed** | **F2** |
| R1 #9 | `DataTable`: `width` is not a floor; sizing every column silently changes layout mode | **Confirmed, partly documented** (`data-table.tsx:18-33`, `:381`) | **F3** |
| R1 #12 | Docs discovery scattered; the best surface (`.d.ts`) is advertised nowhere | **Confirmed** | **D6** |
| R1 #13 | 540 KB JS / 177 KB gzip for six routes; Vite chunk warning on a stock app | **Confirmed, needs measurement** | **G1** |
| R2 #8 | `Text` renders `<p>`; nesting needs `as="span"`, not shown in examples | Confirmed docs gap | **D7** |
| R2 #8 | `StructuredList` exports both a config API and composable parts; unclear which is supported | Confirmed ambiguity | **F4** |
| R2 #8 | Charts render every series in the same hue by default in dark theme | Needs repro | **G2** |
| R1 #14 | `create <name>` seeds a 45-char brand from the directory name | Confirmed cosmetic | **A2** |
| R1 #14 | Scaffold has no `lint`/`typecheck`/`format` scripts | Confirmed | **A2** |
| R2 #8 | `Flex` defaults to `vertical` | **Working as intended.** Both reports say the JSDoc warning saved them. **Do not change the default** — a silent layout flip across every adopter is far worse. Documentation stays as-is. | — |
| R2 🚩4 | Four 0.x packages versioned independently | Confirmed operational cost | **G3** |
| R2 "could not confirm" | `CommandMenu` briefly light-themed in dark app | Not reproducible; computed styles correct at 0/60/150/300ms | **G4** (log only) |

---

## 2. Track A — the scaffolder and doctor (P0)

R1 filed #2 and #4 separately. **They are one bug wearing two hats** and must be fixed as
one changeset: `create` writes a `cascivo.config.ts` into a Path B app, and `doctor` reads
that file as proof of a copy-paste app.

### WS-A1 — Take a public position on `react-hooks/immutability`

**The finding.** `eslint-plugin-react-hooks@7`'s `recommended-latest` enables
`react-hooks/immutability`, which reports `onClick={() => (open.value = !open.value)}` —
the canonical example in `HEADLESS.md` and the idiom `AI-RULES.md` mandates. All 8 of R1's
lint errors were this rule on documented code. The repo has **zero** occurrences of the
words `immutability`, `react-compiler`, or `React Compiler`.

This is the single highest-severity item in both reports, because the failure mode is a new
adopter running `pnpm lint`, seeing an error on **every piece of state they wrote**, and
concluding the library is incompatible with standard React tooling. The existing
`USING-WITH-STRICT-ESLINT.md` recipe does not help: it scopes rules off
`src/components/ui/**`, a path that does not exist on Path B, and would not cover page code
regardless.

**Design decision.** Signal writes through `.value` are the library's contract, and the
rule cannot distinguish a signal write from a React state mutation. There is no narrower
mechanism than disabling the rule for files that write signals. Do **not** pretend
otherwise — say so plainly and own the tradeoff, including what coverage is lost.

**Steps.**

1. **Ship `@cascivo/eslint-config`** — a new package exporting a flat-config fragment:
   - `react-hooks/immutability: 'off'` with an inline comment naming the reason.
   - Re-export the existing strict-ESLint accommodations from `USING-WITH-STRICT-ESLINT.md`
     so Path A and Path B adopters have one import instead of a recipe to hand-copy.
   - Consumed as `import cascivo from '@cascivo/eslint-config'` in a flat config array.
2. **Rewrite `docs/USING-WITH-STRICT-ESLINT.md`** to lead with this rule, not with the
   copied-source glob. Add a verbatim copy of the error text an adopter sees
   (`Error: This value cannot be modified`) so a web search for the message lands here.
3. **Put it where it will actually be read.** A guide nobody routes to is the failure mode
   this plan exists to stop. All of:
   - `docs/AI-RULES.md` — in the reactivity contract, adjacent to the `useSignal` mandate
     that triggers it. This file is pasted into agent system prompts; the warning must
     travel with the rule it contradicts.
   - `docs/HEADLESS.md` — beside the `open.value = !open.value` example itself.
   - `docs/GETTING-STARTED.md` — one line in the Path B setup section.
   - `docs/TROUBLESHOOTING.md` — keyed on the literal error string.
   - The `llms.txt` "Reactivity & state" section via `scripts/llms/generate.ts`.
   - The `cascivo create` scaffold's `eslint.config.js` (WS-A2), pre-wired.
4. **State the forward position** on React Compiler in `AI-RULES.md`: the ecosystem will
   keep tightening here, and a signal-native library needs a stated stance rather than
   silence.

**Guard.** `scripts/checks/eslint-position.test.ts`, wired into `meta:check`: assert the
string `react-hooks/immutability` appears in each of the six surfaces above, and that the
rule is present in `@cascivo/eslint-config`'s exported rules with value `'off'`. Extend
`getting-started-contract` (which already enforces "a first-day fact appears on every
first-day surface") to treat this as a first-day fact.

**Acceptance.** A stock Vite + React 19 app with `eslint-plugin-react-hooks@7`
`recommended-latest` plus `@cascivo/eslint-config`, containing a `useSignal` write in an
event handler, lints clean. Searching the offline docs corpus for `immutability` returns hits.

### WS-A2 — `cascivo create` must emit a project that obeys cascivo's own docs

**The finding.** Five violations, all in `packages/cli/src/commands/create.ts`:

| # | Violation | Evidence | Contradicted rule |
| --- | --- | --- | --- |
| 1 | `"latest"` for all four cascivo deps | `:16`, `:122-125` | GETTING-STARTED.md: "Pin **exact** versions (no `^`)" |
| 2 | `@cascivo/core` as a direct dep, and imported at `:255` | `:122` | AI-RULES.md: "**Never** add `@cascivo/core` to a prebuilt-path app's package.json" |
| 3 | `@cascivo/tokens` as a direct dep + bare side-effect import at `:259` | `:125` | GETTING-STARTED.md: "you **never install it by hand**" |
| 4 | `@preact/signals-react` **absent** from `dependencies` though `App.tsx` calls `useSignals()` | `:121-127` | Required peer; resolves only transitively |
| 5 | `AGENTS.md` says the app layer slot `cascivo.example` is "declared in the order statement in `index.html`"; the generated `index.html` omits it | `:378` vs `:183` | Layer discipline — an agent following the handed file emits into an undeclared layer |

Violation 4 is the sharpest: the scaffold depends on a package it does not declare, so it
survives only by hoisting and breaks under pnpm's strict layout or any dedupe.

**Steps.**

1. Replace `CASCIVO_DEP = 'latest'` with exact versions resolved at build time from the
   published set — the same source `version-pins.test.ts` already reads.
2. Drop `@cascivo/core` and `@cascivo/tokens` from `dependencies`; drop
   `import '@cascivo/tokens'` at `:259`; re-point `import { signal, useSignals }` at `:255`
   to `@cascivo/react`, which re-exports both.
3. Add `@preact/signals-react` to `dependencies` at its peer floor (`>=3.0.0`, per
   `peer-floors.test.ts`).
4. **Do not write `cascivo.config.ts` on the prebuilt path** (`:424`). It is the direct
   cause of WS-A3. Emit it only when the scaffold is a copy-paste (Path A) project.
5. Add `cascivo.example` to the `@layer` statement at `:183`, **or** change the AGENTS.md
   text at `:378` to name a layer that is declared. Prefer adding it — an app slot above
   `cascivo.blocks` and below `cascivo.override` is the correct shape, and AGENTS.md is
   already teaching that model.
6. Pre-wire `eslint.config.js` with `@cascivo/eslint-config` (WS-A1).
7. Add `lint`, `typecheck`, and `format` scripts to the generated `package.json`.
8. Clamp the seeded `ShellHeader brand.name` to a sane length (title-case the first
   1–2 dash-separated segments), so a dated demo directory does not produce a 45-character
   brand.

**Guard — this is the important half of the workstream.**
`scripts/checks/scaffold-contract.test.ts`, wired into `pnpm ready`. It runs `cascivo create`
into a temp dir outside the repo tree and asserts against the *output*:

- no `@cascivo/core` / `@cascivo/tokens` in `dependencies` on the prebuilt path;
- `@preact/signals-react` present and at/above the peer floor;
- every cascivo dep is an exact version — no `latest`, no `^`, no `~`;
- no `cascivo.config.*` on the prebuilt path;
- every layer name referenced in the generated `AGENTS.md` appears in the generated
  `index.html`'s `@layer` statement;
- every `import` in generated source resolves to a declared dependency (the phantom-dep
  check that would have caught violations 2–4 at once);
- `tsc --noEmit` and `eslint` both pass on the scaffold as emitted.

This check is the direct remedy for Cause 3 in §0. **Nothing currently executes the
scaffolder**, which is why five violations shipped together in the one artifact every
adopter touches first.

**Acceptance.** `pnpm cascivo create demo && cd demo && pnpm i && pnpm typecheck && pnpm lint
&& pnpm build` is clean, and `cascivo doctor --ci` exits 0 (with WS-A3).

### WS-A3 — `doctor` must infer the install path

**The finding.** `doctor.ts:38` `isAdopterProject()` returns true iff a `cascivo.config.*`
exists. `create.ts:424` always writes one. So every scaffolded Path B app is judged a
copy-paste app and hits `REQUIRED_RUNTIME_DEPS` (`doctor.ts:19-24`), which demands
`@cascivo/core` and `@cascivo/tokens` — both forbidden on Path B. `doctor --ci` exits 1,
so the CI gate the docs recommend
(`"lint": "cascivo doctor --ci && cascivo audit --ai src"`) is red on day one. The
documented remedy is to install two packages the docs forbid.

**Design decision.** Detect the path from evidence rather than from a config file's
presence:

- **Path B** — `@cascivo/react` in `dependencies`, and no copied component source.
- **Path A** — copied source present under the configured components dir (this is what
  `cascivo.config.*` should mean), or `@cascivo/react` absent.
- **Both** — a hybrid app that copied a component while consuming the package. Apply the
  Path A dependency requirements only to the copied subtree.

**Steps.**

1. Introduce `detectInstallPath(cwd): 'prebuilt' | 'copied' | 'hybrid' | 'unknown'`.
2. Gate `REQUIRED_RUNTIME_DEPS` on `copied`/`hybrid` only. On `prebuilt`, require exactly
   `@cascivo/react`, `@cascivo/themes`, `@preact/signals-react`.
3. On `prebuilt`, **invert the check**: `@cascivo/core` or `@cascivo/tokens` as a *direct*
   dependency is now the finding, with the AI-RULES.md rationale in the message.
4. Return `unknown` — and emit no dependency findings — when evidence is absent, rather
   than defaulting to the copy-paste assumption.
5. Make every finding message name the detected path, so a wrong inference is visible
   rather than mysterious: `"detected prebuilt (Path B) — …"`.

**Guard.** Extend `scripts/checks/scaffold-contract.test.ts` to run
`cascivo doctor --ci` on the freshly scaffolded app and assert exit 0. Add unit tests for
`detectInstallPath` across all four fixture shapes.

**Acceptance.** `doctor --ci` exits 0 on a scaffolded Path B app, exits 0 on a correct
Path A app, and exits 1 on a Path B app that has wrongly added `@cascivo/core`.

---

## 3. Track B — component identity (P0)

### WS-B1 — Two entries share an export name; the docs advertise the unreachable one

**The finding.** `registry.json` contains two entries whose display name is `AppShell`
(`components:app-shell` and `components:layout/app-shell`) and two named `Calendar`
(`components:calendar` and `components:chart/calendar`). **The `Calendar` collision appears
in neither report** — it was found by sweeping the registry for this plan, which is itself
evidence that the class, not the instance, needs the fix.

`@cascivo/react` exports exactly one of each — `app-shell/app-shell` (`index.ts:256`) and
`calendar/calendar` (`:240`). The APIs are incompatible: `nav` vs `sideNav`, and
`layout/app-shell` additionally has `aside`, `persistKey`, `sideNavMode`, and a progress bar.

**Root cause, exactly.** `scripts/llms/generate.ts:201`:

```ts
if (reactExports.has(displayNameOf(entry))) return '@cascivo/react'
```

`packageFor` resolves distribution by **display name**, not by registry entry id. Because
the display name `AppShell` is a react export, *every* entry named `AppShell` is classified
as npm-distributed — so `layout/app-shell` gets the `:295` Install block reading
`import { AppShell } from '@cascivo/react'`, which does not give you that component. The
existing `⚠ Name collision` banner (`:250`) names the siblings but never states which one
the package actually exports — so it flags the hazard without resolving it.

R2 calls this "the single most likely thing to make a new adopter conclude the library is
broken." Agreed: the adopter reads a page, writes exactly what it says, and gets a type
error on the one prop they cannot omit.

**Steps.**

1. **Fix `packageFor` to resolve by entry identity, not display name.** Match the entry's
   own source path against what `packages/react/src/index.ts` re-exports, rather than
   matching a string. This one change fixes both collisions and every future one.
2. **Make the collision banner actionable.** It must state the resolution explicitly, e.g.
   `` `@cascivo/react` exports `app-shell`. This page documents `layout/app-shell`, which is
   copy-paste only (`npx cascivo add layout/app-shell`). ``
3. **Suppress the "Or use it from the prebuilt package" block** on any entry that is not
   itself exported. This is the sentence that produced the wrong code.
4. **Rename to remove the collisions.** A banner is mitigation, not a fix; two exported
   symbols with disjoint APIs and one name is a trap regardless of documentation quality.
   Proposed, pending the naming decision in §7:
   - `layout/app-shell` → `AppFrame` (it is the richer shell: aside, persisted collapse,
     progress bar);
   - `chart/calendar` → `CalendarHeatmap` (already how `export-collisions.test.ts:29`
     describes it in prose).
   Ship behind the deprecation policy in WS-F0.

**Guard.** `scripts/checks/export-collisions.test.ts` exists but is **cross-package only**
(react vs charts vs icons) — structurally unable to see two same-named entries inside the
`components` collection. Extend it, or add `registry-name-collisions.test.ts`, to fail when
two registry entries share a display name unless the pair is in a `KNOWN` map with a stated
reason — mirroring the existing pattern at `:26-31`. Additionally assert: **no page emits an
`import … from '@cascivo/react'` line for a symbol absent from `reactExportedNames()`.** That
second assertion is the generalisation of `path-b-parity.test.ts` from primitives to
components, and it is what turns this from a point-fix into a class-fix.

**Acceptance.** `/llms/layout/app-shell.md` shows no `@cascivo/react` import; its banner
names the exported twin; the guard fails if `packageFor` is reverted.

---

## 4. Track C — defects that ship visibly wrong output (P0/P1)

These four produce incorrect UI with no error, no warning, and no type failure. R1: "the one
thing in the build that produced **visibly wrong output** rather than just friction." R2 on
the chart: "silent data loss in a visualisation is a different severity class."

### WS-C1 — `Timeline` silently downgrades `status: 'error'`

`timeline.tsx:12` maps `error → 'current'`, so a failed deploy and a running deploy render
the identical neutral grey dot. The JSDoc at `:32` explicitly advertises `error` as accepted.

**Note for the implementer:** PR #186 added a `tone` prop, and it is easy to read that as
"already fixed." It is not. `tone` is a separate, well-designed axis (documented at `:36-51`
as answering "what *kind* of entry", deliberately independent of sequence position). The
reported defect — `status: 'error'` rendering as neutral — is unchanged. **Fixing the
mapping is still required.** This is the clearest instance of Cause 2 in §0.

**Steps.** Add a distinct `error` status class; style the marker with the danger token,
matching `Steps`' error treatment so one status enum drives both consistently; keep the
non-colour affordance (icon/shape), since tone alone is not perceivable without colour
vision — the file's own JSDoc at `:49-51` already makes this argument.

**Guard.** Extend `timeline.test.tsx`: `status:'error'` must render
`data-status="error"`, and must not equal what `status:'active'` renders. Add a
vocabulary-level assertion that every member of `ProgressInput` maps to a distinct rendered
`data-status` in every component that accepts it — catching the same silent-collapse class
in `Steps` and any future consumer.

### WS-C2 — Horizontal bar charts drop category labels

`bar-chart.tsx:429` calls `autoLabelStride(categories, isVertical ? innerW : innerH)`, which
correctly passes the vertical extent for horizontal bars. But `use-chart.ts:142-148`
computes the crowding threshold as:

```ts
const widest = labels.reduce((m, s) => Math.max(m, s.length), 0) * AXIS_CHAR_PX + 6
```

`AXIS_CHAR_PX = 6.5` (`:85`) — a **character width**. So for horizontal orientation the
function compares an available *vertical* band against a *horizontal* text extent. Long
category names then look "crowded" no matter how much vertical room exists. R2's case: 7
categories down a 240px axis (band ≈ 34px) against `"/pricing"` ≈ 58px → strides away most
labels. Seven labels down a 240px axis is not a crowded axis.

Compounding it, `RECIPE-DASHBOARD.md` actively steers adopters away from the workaround:
"omit it unless you specifically want a different stride; passing `Math.ceil(n / 8)` 'to
help' makes it worse." A careful reader who trusts the docs keeps the broken chart.

**Steps.**

1. Give `autoLabelStride` an explicit axis-direction parameter. When labels stack
   vertically, the crowding threshold is **line height** (~1em + gap), not text width.
2. Update every call site: `bar-chart.tsx:429`, `combo-chart.tsx:283`.
3. Amend the `RECIPE-DASHBOARD.md` guidance so it no longer discourages the fix in the
   case where the heuristic was wrong.

**Guard.** A unit test on `autoLabelStride` asserting that 7 short-to-medium categories on a
240px vertical axis stride to `undefined` (all labels shown). A `bar-chart.test.tsx` case
rendering 7 horizontal categories and asserting 7 tick labels in the DOM.

### WS-C3 — `secondAxis.label` is typed but never rendered

Declared at `area-chart.tsx:175` and `line-chart.tsx:166`; only `.format` is ever read
(`:339`, `:620-621`). `grep -rn "secondAxis?.label"` across `packages/charts` returns
nothing. On a dual-axis chart the label is the entire mechanism for telling the reader which
axis is which, so the chart is unreadable without a legend workaround.

**Steps.** Render it, mirroring the existing left-axis label treatment and reserving gutter
width via the logic already at `use-chart.ts:126`.

**Guard — the class fix.** `dead-props.test.ts` walks top-level interface members only
(`:91`, `:106`), so a dead field on a nested object type is invisible to it. Extend it to
descend one level into inline object-literal prop types. Run the extension across the whole
catalog before implementing — expect it to surface other dead nested fields, and fix or
allowlist each with a reason.

### WS-C4 — `Stat`/`Kpi` colour by direction, not sentiment

`stat.tsx:10` offers `trend?: 'up'|'down'|'flat'` and nothing else; `kpi.tsx:47` derives
`deltaPositive = delta >= 0` and `:64` maps it straight to `data-trend`. So up is always
green. On a deploy console the two most-watched tiles are errors and latency, where up is
bad — R1 shipped `Errors 2.9K ▲ 14.9%` in green and `Errors/day ▼ -5.4%` in red, both
backwards, because lying about `trend` would reverse the arrow too.

**Design decision.** Separate *direction* (which arrow) from *sentiment* (which colour).
Add `goodDirection?: 'up' | 'down' | 'neutral'` (default `'up'`, preserving today's
behaviour) to both. `'neutral'` renders the arrow with no sentiment colour. Prefer this over
a raw `tone` override: it states intent about the metric rather than hard-coding a colour,
so it stays correct when the delta's sign flips.

**Guard.** Tests asserting `goodDirection="down"` + positive delta ⇒ danger tone with an up
arrow. Add `Stat`/`Kpi` to the `axis-parity`-style capability sweep so the two tile
components cannot drift apart again.

---

## 5. Track D — documentation correctness (P0/P1)

The commissioning constraint applies with full force here: **"If it's a docs issue, make
sure this is perfectly documented and easy to find."** For every item below, the deliverable
is a fact placed on the surface the adopter is already reading, plus a check that fails when
code and prose disagree. Adding a page is not sufficient.

### WS-D1 — `Select.onValueChange` is documented and does not exist

`llms.txt` states the event-handler rule as law and lists `Select` in the `onValueChange`
row. `select.tsx:27` extends `Omit<SelectHTMLAttributes<HTMLSelectElement>,'size'>` and
carries only the DOM `onChange`. TypeScript's suggestion is `onVolumeChange`.

This is worse than an undocumented API. The table is presented as a *predictive rule* —
"predict the prop from what it receives" — so an adopter who trusts it writes wrong code for
every component they have not individually verified. A wrong rule about a component as
central as `Select` discredits the whole table.

**Design decision — move `Select`, do not add the prop.** `Select` wraps a real
`<select>`; per CLAUDE.md's own naming contract, a component whose handler receives a DOM
`ChangeEvent` belongs in the `onChange(event)` row beside `NativeSelect` and `Checkbox`.
Adding a value-carrying `onValueChange` would make `Select` carry both shapes and weaken the
rule further. Fix the docs to match the correct code.

**Steps.** Move `Select` to the `onChange(event)` row in `llms.txt`'s generator,
`AI-RULES.md`, and `docs/RECIPE-DASHBOARD.md`. In `select.tsx`'s JSDoc, state plainly that
`Select` is a native wrapper and takes `onChange(event)` — the `.d.ts` is where R1 says
adopters actually look.

**Guard — the highest-leverage check in this plan.**
`scripts/checks/handler-naming-parity.test.ts`: parse the event-handler-naming table out of
`AI-RULES.md`/`llms.txt`, and for **every component named in it**, assert the claimed
handler prop exists on that component's TS interface. R2 identifies exactly this: a
`path-b-parity`-shaped check applied to the prop-name table would have caught it. This
converts a promise-shaped doc into an enforced one, and is the single check most likely to
prevent the *next* report's 🚩.

### WS-D2 + WS-D3 — the token catalog is incomplete, and metas cite tokens that do not exist

Two distinct bugs, one guard. `generate.ts:545` advertises "Token catalog (closed set, every
`--cascivo-*` + layer + default)".

**D2 — real tokens missing from the catalog.** Verified absent from
`apps/site/public/tokens.catalog.json`: `--cascivo-sidenav-inline-size`,
`--cascivo-sidenav-bg`, `--cascivo-data-table-max-height`, `--cascivo-button-radius`. These
are precisely the per-component knobs an adopter reaches for ("make the sidebar narrower"),
and they are invisible to anyone validating against the catalog — which R2 did.

**D3 — phantom tokens in metas (root cause, unreported).** `page-header.meta.ts:20,21,24`
and `app-shell.meta.ts:52` declare `--cascivo-font-size-2xl`, `--cascivo-font-weight-bold`,
`--cascivo-font-size-sm`, `--cascivo-font-size-xs`. **None exist** in
`packages/tokens/src/*.css`; the real names are `--cascivo-text-*` and
`--cascivo-font-semibold`. These flow into generated docs, so an adopter who copies them
gets silently unresolved custom properties — R2's "the difference between 'my app is
correct' and 'my app silently has three unresolved custom properties'."

**Steps.** Fix the four phantom names in the two metas. Regenerate the catalog from the
token sources so component-scoped tokens are included. Either make the catalog genuinely
closed, or soften the `generate.ts:545` claim — do not leave an unqualified "every".

**Guard.** `scripts/checks/token-catalog.test.ts`, in `meta:check`, asserting **both
directions**: every token named in any `*.meta.ts` `tokens:` array resolves to a real
declaration in `packages/tokens` or the component's own CSS (catches D3), and every
`--cascivo-*` declared anywhere appears in the catalog (catches D2). Bidirectional, exactly
like `props-parity`.

### WS-D4 — the SSR CSS contradiction

`GETTING-STARTED.md:211-213` advertises "a ~45-component dashboard measured 137 KB / 19 KB
gzip of the 273 KB". `USING-WITH-VITE-SSR.md:97` says the aggregate import is "required, not
optional, under SSR". R2's build emitted **both**: a 306 KB aggregate *and* 12 per-component
chunks duplicating a subset of it. The tree-shaking benefit is unavailable to SSR apps, and
nothing says so — while SSR frameworks are where most new dashboards get built.

**Steps.** State the tradeoff explicitly in both files, each linking the other. Qualify the
137 KB figure as client-only/SPA. Investigate whether a `styles.css` variant can be
client-shakeable, or whether the per-component chunks can be suppressed when the aggregate
is present (they are pure duplication today). If neither is feasible, say so — an honest
documented limitation beats two numbers that quietly contradict.

**Guard.** Extend `css-contract:check` to assert the two files' claims stay mutually
consistent, keyed on the shared measured figure.

### WS-D5 — chart `title` is required and invisible

`area-chart.tsx:83` `title: string` required → `<caption>` at `:358` + SVG accessible name
at `:454`. Correct a11y; the prop name promises a heading. R1 wrote a title, saw nothing,
and added a redundant `<CardTitle>` above every chart.

**Steps.** Keep the a11y behaviour and the required-ness. Accept `ariaLabel` as an alias
matching the library's own stated convention ("an **invisible** accessible name … goes to
`aria-label`"), keeping `title` for compatibility. Make the JSDoc's **first sentence** say
the text is not visibly rendered and that a visible heading needs `CardTitle` — the `.d.ts`
is the surface adopters read.

**Guard.** Extend `tsdoc-parity` to require that any prop rendering only to an accessible
name states its invisibility in the first JSDoc sentence. Apply catalog-wide.

### WS-D6 — make the `.d.ts` a first-class documentation surface

R1: "For a library that markets itself as AI-first, the single most useful artefact (the
typed, JSDoc-annotated `index.d.ts`) is the one nothing points you at." Both reports
independently rate the types as the best documentation in the project, and getting to a
working model required reading four surfaces (site, `llms.txt`, `@cascivo/docs`, `.d.ts`),
each holding something the others lacked.

**Steps.** Add a short "Where the documentation lives" section to `GETTING-STARTED.md`,
`docs/README.md`, and the `llms.txt` preamble: name all four surfaces, say what each is
authoritative for, and state plainly that **the `.d.ts` is authoritative for props** and
should be consulted before the site. Explain the `context/*.md` vs `llms/*.md` split inside
the `@cascivo/docs` package README — R2 found it unexplained by the package itself.

**Guard.** `doc-urls:check`/`getting-started-contract` extension: the four-surface section
must exist on all three surfaces and name all four.

### WS-D7 — `Text` renders `<p>`

Nesting an icon plus text inside another `Text` produces invalid HTML without `as="span"`.
Inferable from the `as` prop; not shown in the examples. Add an example to `text`'s manifest
showing the inline case. Guard: none needed beyond `example-props`.

---

## 6. Track E — `audit --ai` false positives (P1)

The audit is pitched as a CI gate, so a false **error** is expensive: R1 deleted a valid,
type-checked prop to get the audit green. An audit that makes correct code worse trains
adopters to disable it.

### WS-E1 — `unknown-prop` on valid HTML passthrough

`jsx-props.ts:24` `HTML_PASSTHROUGH` is a hand-maintained list of 48 attribute names.
`noValidate` is not in it, so `<Form noValidate>` is a non-suppressible error — despite
`FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>,'onSubmit'>` making it valid and
type-checked. Any unlisted valid attribute on any component is a false error; the list can
never be complete by hand.

**Design decision.** Stop hand-maintaining it. Derive the allowlist from the component's
declared `extends …HTMLAttributes<…>` — the information is already in the source, and
`props-parity` already parses these interfaces. Fall back to a broad React DOM attribute set
(generated from `@types/react`, not typed by hand) when the base interface is unresolvable.

**Guard.** A fixture using ≥10 valid-but-unlisted passthrough attributes across different
element types, asserting zero findings. Add `noValidate` explicitly as the regression case.

### WS-E2 — `raw-string` on ordinary page copy

`raw-strings.ts` gates only on `info.hasContent`, and `Text` — a typography primitive whose
children *are* the page's prose — qualifies. So `<Text>Automatic deployments</Text>` warns.
In a real app every sentence on every page warns, which trains adopters to ignore the rule
and thereby hides the real i18n findings it exists to surface.

**Design decision.** Distinguish *chrome text owned by a component* (a Dialog's "Cancel", a
DataTable's "No results" — genuinely `labels`-prop territory) from *authored page content
passed as children of a typography primitive*. Add an explicit `contentPrimitive: true`
marker to the manifests of `Text`, `Heading`, and their peers, and skip them. Prefer this
over widening the prose heuristic, which cannot tell the two apart from the string alone.

**Guard.** A fixture page of ordinary prose inside typography primitives asserting zero
`raw-string` findings, alongside the existing positive cases.

---

## 7. Track F — API consistency (P2, breaking)

These are real and worth fixing, but each is a breaking rename across a 192-entry catalog.
**Sequence them behind Tracks A–E**, which are non-breaking and higher-severity.

### WS-F0 — the deprecation mechanism (prerequisite)

Before any rename in WS-B1/F1/F2, establish one mechanism and use it for all of them:
accept both names for one minor; `@deprecated` JSDoc on the old name with the replacement;
a dev-only console warning on first use; an entry in `breaking-changes.json`; a codemod in
`scripts/migration`. The four-package 0.x sprawl (R2 🚩4) makes ad-hoc renames especially
costly — do this once, properly.

### WS-F1 — collection identity field

Four names for one concept: `CommandMenu.groups[].items[].id`, `OverflowMenu.items[].value`,
`Select.options[].value`, `DataTable.columns[].key`, `StructuredList.items[].id`,
`SideNav.items[]` (keyed by `href`). R2 wrote `{id, label}` for `OverflowMenu` immediately
after writing `CommandMenu`; TypeScript caught it, but it is four gratuitous facts to
memorise.

Converge on `value` as canonical (already the catalog convention per `command-menu`'s own
JSDoc), accepting `id` as a deprecated alias — the pattern `CommandMenu` already uses.
`DataTable.columns[].key` is arguably a different concept (a column, not a value) and may
stay; decide in §8 Q3.

**Guard.** A `vocabulary.test.ts` extension: every config-driven collection prop's item type
must expose `value`.

### WS-F2 — `label` vs `ariaLabel`

`label` currently means visible text (`Search`, `Toggle`, `Input`, `Select`), invisible
accessible name (`IconButton`, `Sparkline`), or is not accepted (`OverflowMenu`, `SideNav`
take `ariaLabel` only). `StructuredList` lists both `ariaLabel` and `aria-label` as separate
props. The docs acknowledge the history; the cost lands on every new adopter.

Canonical rule: **`label` = visible text; `ariaLabel` = invisible accessible name.** Add
`ariaLabel` everywhere it is missing, deprecate `label`-as-a11y-name on `IconButton` and
`Sparkline`, and collapse `StructuredList`'s duplicate pair.

**Guard.** `vocabulary.test.ts`: no component may accept `label` as an a11y-only name;
every component with an invisible name accepts `ariaLabel`.

### WS-F3 — `DataTable` `width` is a footgun

Two verified behaviours: sizing *every* column flips to `table-layout: fixed`
(`data-table.tsx:381`), which overflows behind an overlay scrollbar with no affordance that
columns are hidden (R1 measured `clientWidth 1052` vs `scrollWidth 1360`); and a *sized*
column can be squeezed below its content, breaking `Building` across lines mid-word, while
`:23-25` promises unsized columns never collapse. Every `width` therefore needs a paired
`minWidth`.

`RECIPE-DASHBOARD.md`'s advice ("set `Column.width` on identifier-shaped columns") is what
leads adopters into sizing everything. Make `width` imply a content-derived floor unless
`minWidth` says otherwise; add a horizontal-overflow affordance (fade or visible scrollbar)
when the table scrolls; amend the recipe to warn against sizing every column.

### WS-F4 — `StructuredList` dual API

Exports both a config-driven `items`/`cells` API and composable `StructuredListItem` parts,
with no statement of which is supported. R2 wrote the composable form first, then discovered
the config prop is the real API. Pick one as primary, document the other's status
explicitly, and add an `@deprecated` marker if it is not supported.

---

## 8. Track G — measurement and follow-ups (P2)

- **WS-G1 — bundle size.** 540 KB JS / 177 KB gzip for six routes, and Vite emits its 500 KB
  chunk warning on a stock cascivo app — an alarming first build. Measure where it goes
  (`audit:bundle` exists but is not in `pnpm ready`); publish a per-component JS cost table
  alongside the existing CSS one; document route-level code-splitting in
  `RECIPE-DASHBOARD.md`. Consider whether the scaffold should ship a manualChunks config.
- **WS-G2 — chart series hues.** R2 avoided a two-series chart because the docs did not make
  clear how the positional `--cascivo-chart-N` palette differentiates series in dark theme.
  Reproduce; if series do collapse to one hue, fix. Either way, document the palette's
  positional assignment on the chart pages.
- **WS-G3 — version sprawl.** Four independently-versioned 0.x packages that must stay
  mutually compatible. `all.css` changing meaning in 0.14.0 is the warning shot R2 names.
  Evaluate lockstep-versioning the family, or ship a `@cascivo/react` peer range that makes
  an incompatible `@cascivo/charts` an install-time error rather than a runtime surprise.
- **WS-G4 — unreproducible `CommandMenu` theming.** R2 saw a light-themed dialog in a dark
  app once and could not reproduce it; computed styles resolved correct dark tokens at
  0/60/150/300ms. Most likely a headless-screenshot compositing artifact. **No action** —
  recorded so it is not lost if seen again.
- **WS-G5 — dispose of the stale plan.** `docs/plans/tanstack-start-experience-report-plan.md`
  is still "planned — not implemented." Re-triage it against current source: its WS1/WS2
  (package-manager detection, dependency visibility) may be wholly or partly fixed; its WS4
  (strict ESLint) is superseded by WS-A1. Either implement the remainder, fold it into this
  plan, or close it with a stated reason. **Leaving a third experience-report plan
  unimplemented is the failure mode this document exists to break.**

---

## 9. Sequencing

**Phase 1 (P0, non-breaking, ship together).** WS-A1, WS-A2, WS-A3, WS-B1, WS-C1, WS-C2,
WS-D1. This is the first-hour experience plus the three silent-wrong-output defects. A2 and
A3 must land in one changeset. Every one of these ships with its guard.

**Phase 2 (P1, non-breaking).** WS-C3, WS-C4, WS-D2/D3, WS-D4, WS-D5, WS-D6, WS-D7, WS-E1,
WS-E2.

**Phase 3 (P2, breaking).** WS-F0 first, then WS-F1, WS-F2, WS-B1's renames, WS-F3, WS-F4.

**Phase 4 (measurement).** WS-G1, WS-G2, WS-G3, WS-G5.

## 10. Definition of done

A workstream is done when all four hold:

1. The code is correct and `pnpm ready` is green.
2. **A check in `pnpm ready` fails if the fix is reverted.** No exceptions — this is the
   remedy for Cause 2 in §0.
3. If it was a docs finding, the fact is on the surface the adopter is reading *at the
   moment they need it* (not only in a new guide), and a check fails when code and prose
   disagree.
4. For Track A, the acceptance test runs against the **scaffolder's actual output** in a temp
   dir outside the repo tree — not against repo fixtures.

## 11. New guards this plan adds

Consolidated, since these are the durable deliverable:

| Guard | Catches | WS |
| --- | --- | --- |
| `scaffold-contract.test.ts` | Everything in WS-A2/A3 — the currently-unguarded first artifact | A2, A3 |
| `eslint-position.test.ts` | The immutability position silently dropping off a surface | A1 |
| `registry-name-collisions.test.ts` | A new same-name registry pair; docs importing a non-export | B1 |
| `handler-naming-parity.test.ts` | A documented handler prop that doesn't exist (`Select`) | D1 |
| `token-catalog.test.ts` (bidirectional) | Phantom tokens in metas; real tokens missing from the catalog | D2, D3 |
| `dead-props` nested-field extension | Typed-but-inert nested fields (`secondAxis.label`) | C3 |
| `ProgressInput` distinctness assertion | A status value silently collapsing onto another | C1 |
| `tsdoc-parity` invisible-prop rule | A prop that renders only to an accessible name not saying so | D5 |
| Audit false-positive fixtures | Valid passthrough attrs and ordinary prose flagged as findings | E1, E2 |

## 12. Open questions

1. **WS-A1** — ship `@cascivo/eslint-config` as a new published package, or document a
   copy-paste rules block? A package is better DX and testable; it is also a fifth
   independently-versioned artifact (WS-G3).
2. **WS-B1** — accept the `AppFrame` / `CalendarHeatmap` renames, or keep both names and rely
   on the corrected banner? Recommend renaming: R2 calls the collision the most likely reason
   an adopter concludes the library is broken, and a banner is mitigation, not a fix.
3. **WS-F1** — does `DataTable.columns[].key` converge to `value`, or is a column key a
   genuinely different concept that should keep its name?
4. **WS-D4** — is a client-shakeable `styles.css` achievable under SSR, or is the
   tradeoff permanent and documentation the only remedy?
5. **WS-C4** — `goodDirection` as specified, or a more general per-metric `sentiment`
   descriptor that other tiles could adopt later?
