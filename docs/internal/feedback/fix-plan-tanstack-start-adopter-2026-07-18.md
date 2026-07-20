# Fix plan — TanStack Start adopter report (2026-07-18, published 0.7.1 packages)

**Status: planned — not implemented.** This document is the handoff spec for fixing
every actionable item in the third TanStack Start experience report
(`feedback-tanstack-start-adopter-2026-07-18.md`, same directory). It is written to be
handed to an implementing agent as-is: every claim is triaged against current `main`
(2026-07-20, HEAD `e1a4263`) with file:line evidence, and every workstream carries a
spec, tests, and acceptance criteria.

**Context that shapes this plan.** This is the *third* report from a TanStack Start
adopter, and the first against the fixed surface: the previous two reports
(2026-07-16 `fix-plan-tanstack-ssr-adopter-2026-07.md`, 2026-07-17
`docs/plans/tanstack-start-experience-report-plan.md`) drove the SSR `noExternal`
recipe, the machine-readable 404s, `getting-started.md` as fetchable markdown, the
Stack naming notes, and the props-parity check — and this adopter confirms those
landed ("SSR worked as documented", "the only Vite change needed", DataTable praised,
llms surface praised). The new report's headline problem is different: **the shipped
source and repo-generated docs are now accurate, but what the adopter fetched from the
deployed docs hosts was stale or unreachable.** Several findings therefore resolve to
"harden the deploy/freshness story", not "fix the docs content".

**Verification headline (do not re-litigate during implementation):**

- Every API the report calls out as mis-documented is **correct in the current repo
  artifacts**: `llms/data-table.md` documents `rows` + `columns` keyed by `Column<Row>`
  (`apps/site/public/llms/data-table.md:39-40`), `llms/button.md` lists exactly
  `primary | secondary | ghost | destructive`, and `llms/chart/area-chart.md` documents
  `series` + accessor `x`/`y`. `llms-full.txt` inlines these same files
  (`scripts/llms/generate.ts:944-972`), so the repo-generated aggregate cannot diverge
  from the per-component docs.
- `Stat`'s `visual` prop **is** in the manifest and the generated doc
  (`packages/components/src/stat/stat.meta.ts:33-37`,
  `apps/site/public/llms/stat.md:32`) — since commit `810b8ba`, 2026-07-14, four days
  *before* the report. The adopter reading a `stat.md` without `visual` on
  docs.cascivo.com on 2026-07-18 is direct evidence of a stale or mis-mapped deployed
  artifact, not a repo defect.
- `@cascivo/themes/all` does **not** ship 15 themes: `packages/themes/src/all.css`
  imports tokens + base + `light` + `dark` only (lines 17-22, unchanged since
  2026-07-13, i.e. the same content published as 0.4.1). The reported "287 kB ≈ 39 kB
  gzip" figure matches `@cascivo/react/styles.css` (~273 kB / ~37 kB gzip, per
  `scripts/llms/generate.ts:533`), which the SSR path *requires* importing — the
  adopter almost certainly measured a merged CSS chunk and attributed it to the themes
  import. The *recommendation* gap (quick start doesn't steer a single-theme app to
  `base` + one theme) is still real and cheap to fix.
- The `setLinkComponent` phantom-dependency problem is **fully confirmed**:
  `packages/core/src/index.ts:45` exports it, `packages/react/src/index.ts` re-exports
  other core primitives (`:68`: `ErrorBoundary`, `SuspenseBoundary`, `Portal`,
  `FocusScope`) but not the link API, and `docs/HEADLESS.md:71` +
  `docs/USING-WITH-VITE-SSR.md:137` both tell Path-B (prebuilt-package) users to
  import from `@cascivo/core`, which they never installed.
- The `exports`-map inconsistency is confirmed and wider than reported: of the 15
  published packages, **only `@cascivo/react`** exports `./package.json`.
- One *new* defect the report didn't spot fell out of verification: DataTable's
  manifest describes `rows` as **"Number of visible text rows."**
  (`packages/components/src/data-table/data-table.meta.ts:18`) — a Textarea
  description pasted onto a `Row[]` prop, shipped verbatim into registry.json, the
  props table, and every AI surface. The existing props-parity gate
  (`scripts/checks/props-parity.test.ts`) checks names only, so prose like this
  slips through.

## Triage — finding → verdict (F# = friction section, R# = red-flag section)

| # | Report item | Verdict | Root cause / evidence | Workstream |
| --- | --- | --- | --- | --- |
| F1 | Aggregated "read-everything" bundle disagreed with real API (DataTable `data`/`id`, Button `default`/`outline`, chart `xKey`/`yKey`) | **Not reproducible in repo — treat as deployed-artifact staleness** | Repo-generated per-component docs and `llms-full.txt` are correct (evidence above); no source in the repo teaches the wrong APIs (`docs/MIGRATING-FROM-SHADCN.md:110-129` maps *away* from `outline`). Deployed hosts served older content (see F2 evidence) | WS-A |
| F2 | `docs.cascivo.com/llms/stat.md` omits `visual` | **Confirmed as deployed staleness; already fixed in repo** | `visual` in meta + generated md since `810b8ba` (2026-07-14); report dated 2026-07-18. `cf-pages.yml` deploys on every main push with no post-deploy verification, and nothing in a served `.md` reveals which registry version produced it | WS-A |
| F3 | `setLinkComponent` documented against `@cascivo/core`, a transitive dep — phantom-dependency error under pnpm; not re-exported from `@cascivo/react` | **Confirmed** | `packages/react/src/index.ts` (no link re-export; other core re-exports at `:68`); `docs/HEADLESS.md:71-77`; `docs/USING-WITH-VITE-SSR.md:137-141`; `packages/components/src/side-nav/side-nav.tsx:72` JSDoc | WS-B |
| F4a | `Avatar` has no `name` prop / initials-from-name convenience | **Confirmed (by design, but the papercut is real)** | `packages/components/src/avatar/avatar.tsx:15-18` (`alt` + `fallback` only). The `User` composite (`packages/components/src/user/user.tsx`) has `name` but does not derive initials for its Avatar either | WS-G |
| F4b | `Stack` is an overlap/z-stack, not a flow primitive — costly first attempt | **Already mitigated on main** | llms.txt naming note (`scripts/llms/generate.ts:904-907`), CLI point-of-use note (`packages/cli/src/commands/add.ts:87-89`), same-name collision cross-links in per-component docs (`generate.ts:219-228`). Adopter hit the pre-fix deployed surface | WS-A (freshness only) |
| F5 | `@cascivo/themes/all` ships every theme → 287 kB chunk | **Partially refuted; recommendation gap confirmed** | `all.css` = tokens + base + light + dark only; 287 kB figure matches `@cascivo/react/styles.css`. But `docs/GETTING-STARTED.md:148` and `scripts/llms/generate.ts:524` present `all` as *the* wiring with no single-theme guidance and no size expectations | WS-F |
| F6 | Inconsistent `exports` maps — `@cascivo/charts` lacks `./package.json` | **Confirmed, repo-wide** | Only `packages/react/package.json` exports `./package.json`; the other 14 published packages don't (`@cascivo/{ai,charts,core,editor,flow,i18n,icons,mcp,registry,storage,themes,tokens,vite-plugin}` + `cascivo`) | WS-D |
| F7 | Docs across three hosts with 404s: `cascivo.com/docs/components.md` 404; `docs.cascivo.com/llms/area-chart.md` empty shell | **Confirmed (guessable-URL gaps + deploy question)** | Charts are namespaced `chart/<name>` in the registry, so `/llms/area-chart.md` is a guessed-name miss; `_redirects` maps it to `llms-404.md`, but that hint file mentions only the `block/` namespace, not `chart/` or `layout/`; "empty shell" on docs.cascivo.com again implies that host wasn't serving current `_redirects` (→ WS-A). Nothing generates `/docs/components.md` or any fetchable guide besides `getting-started.md` (`scripts/getting-started/generate.ts`) | WS-E (+WS-A) |
| R1 | "Trust the types, not the prose" | **Root cause = F1/F2 staleness + prose-accuracy gap** | The one live prose defect found: `data-table.meta.ts:18` wrong `rows` description | WS-A, WS-C |
| R2 | Everything is 0.x; pin exact versions | **Already addressed; minor echo** | llms.txt "Versioning & compatibility" section already says pin + `cascivo doctor --drift` + breaking-changes.json (`generate.ts:718-735`). Echo one line into GETTING-STARTED while editing it | WS-F (fold-in) |
| R3 | Theme-export ↔ `data-theme` mapping unstated; ThemeProvider/SSR hydration implication undocumented in quick start | **Confirmed** | `docs/GETTING-STARTED.md` shows only `data-theme="light"`, never the mapping; `ThemeProvider`/`themePreloadScript` SSR story lives only in `docs/THEMING.md:55-90`; count drift: THEMING says "twelve themes" (`:296`) — correct, but nowhere near the quick start is the list enumerated with its `data-theme` values | WS-F |
| R4 | TanStack Start needed `getRouter` export + a server preset — "not cascivo's fault" | **Confirmed, out of scope for the library; document at point of need** | `docs/USING-WITH-VITE-SSR.md` covers the cascivo side only | WS-H |

Priority order: **WS-A** (it explains three findings and protects every future doc fix)
→ **WS-B** (only true happy-path breakage in the library itself) → WS-C/WS-D/WS-E/WS-F
→ WS-G/WS-H.

---

## WS-A (P0) — Deployed-docs freshness: stamping, post-deploy verification, host audit

### Problem

The report's two most damaging findings (F1 "the aggregate lies", F2 "stat.md omits
`visual`") are not reproducible against repo artifacts — the deployed docs host served
content at least 4 days stale (F2 is datable: fix landed 07-14, stale copy read 07-18).
Today there is no way for a reader *or* for CI to tell what registry version a served
`.md` came from, and the deploy workflow (`.github/workflows/cf-pages.yml`) ends at
`wrangler pages deploy` with zero verification that production actually serves the new
content on **both** hosts (`cascivo.com`, `docs.cascivo.com`).

For an AI-first library this is the worst possible failure mode: the "authoritative"
machine-readable surface silently degrades into misinformation, and the report's R1
("a team that codes from the summary and skips the types will generate code that
doesn't compile") is the direct consequence.

### Spec

**1. Version-stamp every generated artifact, at the top.**

- `scripts/llms/generate.ts` `componentMarkdown()`: append a trailing line to every
  per-component md (same format the indexes already use):
  `_Generated from registry v<version> on <generatedAt>_`.
- `generateLlmsTxt()` / `generateLlmsFullTxt()`: the stamp currently exists only as the
  *last* line (`generate.ts:932`, `:969`) — an agent that truncates a 200 KB file never
  sees it. Add a second stamp near the top: immediately after the H1, one line:
  `_registry v<version> · generated <generatedAt> · staleness check: compare with https://cascivo.com/registry.json .version_`.
- `scripts/getting-started/generate.ts`: include the registry version + date in the
  existing generated-header comment block.
- Run `pnpm regen`; commit regenerated artifacts (drift gate).

**2. Post-deploy smoke verification in `cf-pages.yml`.**

Add a `verify-site` job to `.github/workflows/cf-pages.yml`, `needs: deploy-site`,
running only for `--branch=main` deploys (production). For **each** host in
`https://cascivo.com` and `https://docs.cascivo.com`:

- `curl -fsS <host>/llms.txt` → assert it contains `registry v<version>` where
  `<version>` is read from the checked-out `registry.json` (retry loop, e.g. up to
  5 min with backoff, to absorb CDN propagation).
- `curl -fsS <host>/llms/stat.md` → assert contains `` `visual` `` and the stamp
  version (a canary chosen precisely because it was the stale file in this report).
- `curl -fsS <host>/llms/chart/area-chart.md` → assert contains `` `series` ``.
- `curl -s -o /dev/null -w '%{http_code}' <host>/llms/definitely-not-a-component.md`
  → assert `404`, and assert the body of a plain `curl` of the same URL contains
  "no cascivo doc at this path" (i.e. `_redirects` 404 rules are live on this host —
  the report's "empty shell" symptom means they were not on docs.cascivo.com).
- `curl -fsS <host>/docs/getting-started.md` → assert markdown, stamp present.

Failure of any assertion fails the workflow — that is the alarm this report shows we
need. Keep the script inline in the workflow or as
`scripts/checks/deployed-freshness.sh` (implementer's choice; prefer a script so it can
be run manually against prod at any time).

**3. Host mapping audit (ops task — document, then verify).**

The repo deploys ONE Cloudflare Pages project for the unified site
(`cf-pages.yml:83-88`, project `cascade-ui-landing`); `docs.cascivo.com` is asserted to
"mirror the same tree" (`packages/cli/src/utils/config.ts:7`). The staleness evidence
says otherwise. An implementing agent cannot fix DNS/Pages bindings from this repo, so:

- Add a short `docs/internal/OPS-HOSTS.md` recording the intended mapping (both apex
  and docs subdomain → the `cascade-ui-landing` Pages project, production branch
  `main`) and the manual steps to verify/fix custom-domain bindings in the Cloudflare
  dashboard.
- The WS-A.2 smoke job is the ongoing enforcement: once bindings are fixed, a stale
  docs.cascivo.com can never again go unnoticed.

### Tests / acceptance

- `pnpm regen && git diff --exit-code` idempotent after one committed regen.
- Every file under `apps/site/public/llms/` ends with the stamp line; `llms.txt` and
  `llms-full.txt` carry the top stamp (assert in the existing llms check family —
  `scripts/checks/llms-channels.test.ts` is the natural home or a sibling).
- Workflow YAML validated (dry-run the verify script against the *local* `dist/`
  output in CI is acceptable as a pre-deploy self-test; the real curl assertions run
  post-deploy).
- After the first production deploy: both hosts pass the smoke script manually.

---

## WS-B (P0) — `setLinkComponent` importable from `@cascivo/react`

### Problem

The documented happy path for router integration (`import { setLinkComponent } from
'@cascivo/core'`) is a phantom-dependency error under pnpm's strict `node_modules` for
every Path-B adopter: `@cascivo/core` is only a transitive dep of `@cascivo/react`, and
nothing tells the adopter to install it. The report worked around it via the per-item
`render` hatch; the next adopter won't.

### Spec

1. **Re-export from `@cascivo/react`.** In `packages/react/src/index.ts`, alongside the
   existing core re-exports (`:68`):

   ```ts
   export { setLinkComponent, getLinkComponent } from '@cascivo/core'
   export type { LinkComponent } from '@cascivo/core'
   ```

   (Confirm the exact exported type name(s) in `packages/core/src/link.ts` — re-export
   whatever the public link API surface is, nothing more. No dependency cycle: same
   situation as the `:68` block, see the comment at `:151`.)
2. **Docs flip to the react import for the prebuilt path.**
   - `docs/HEADLESS.md:71-77`: show `from '@cascivo/react'` as the primary snippet;
     keep a one-liner noting copy-paste (Path A) projects import the same API from
     `@cascivo/core` (which `cascivo init` installs for them).
   - `docs/USING-WITH-VITE-SSR.md:137-141`: same flip (this is the TanStack recipe the
     adopter followed).
   - `packages/components/src/side-nav/side-nav.tsx:72` JSDoc: mention both sources.
   - `scripts/llms/generate.ts` — the "Reactivity & state" bullet list (`:690-712`):
     add one bullet: router links → `setLinkComponent` (from `@cascivo/react`; also in
     `@cascivo/core` for copied source), so agents stop guessing. `pnpm regen`.
3. **Changeset:** `@cascivo/react` **minor** (new public export).

### Tests / acceptance

- Test in `packages/react` (follow existing export-surface tests if present, else a
  small new one): `import { setLinkComponent, getLinkComponent } from '@cascivo/react'`
  resolves and is the same function identity as the core export.
- Grep gate: no doc under `docs/` teaches a bare `@cascivo/core` import for the link
  API without mentioning the react re-export (manual sweep is fine; the two files above
  are the only current hits plus HEADLESS's table row at `:25` and `:60`).
- `pnpm ready` green.

---

## WS-C (P1) — Manifest prose accuracy: fix the `rows` description, sweep, and harden the gate

### Problem

The props-parity gate catches name drift but not prose drift.
`data-table.meta.ts:18` ships "Number of visible text rows." for `rows: Row[]` — on the
library's flagship component, in exactly the surface the report says adopters must be
able to trust. This is the live instance of R1 that we *can* fix mechanically.

### Spec

1. **Fix the instance**: `packages/components/src/data-table/data-table.meta.ts:18` →
   `'The row objects to render — one table row per array element.'` `pnpm regen`.
2. **One-time sweep for copy-paste prose**: script-or-manual audit over all
   `*.meta.ts` for descriptions that repeat verbatim across components whose prop
   *types* differ (the signature of a paste error, exactly how `rows` happened: the
   Textarea `rows` description). Deliver the list in the PR description; fix what's
   wrong. A throwaway script over `registry.json` (group props by `description`,
   flag groups spanning different `type` strings) is sufficient — it does not need to
   become a permanent gate if the noise is high; decide from the sweep results.
3. **Harden Direction B of props-parity**: `scripts/checks/props-parity.test.ts`
   currently only **warns** when an own declared prop is missing from the manifest
   (the exact gap that let `Stat.visual` go undocumented until 07-14). Burn down the
   remaining warnings (the sweep above will surface them) and flip Direction B from
   WARN to ERROR, extending the existing `ALLOWLIST` (with reasons) for genuinely
   intentional omissions.

### Tests / acceptance

- `pnpm meta:check` green with Direction B as ERROR; allowlist entries all carry
  reasons and pass the existing stale-entry test.
- Regenerated `llms/data-table.md` row for `rows` reads correctly (drift gate).
- Changeset: none needed for meta-only changes unless the repo convention versions
  `@cascivo/react` for doc-surface changes — follow `packages/react/CHANGELOG.md`
  precedent (previous meta fixes shipped as patches; if so, **patch**).

---

## WS-D (P1) — `./package.json` export on every published package

### Problem

`require.resolve('@cascivo/charts/package.json')` throws
`ERR_PACKAGE_PATH_NOT_EXPORTED` — and the same for 13 other published packages; only
`@cascivo/react` exports it. Version probes, bundler plugins, and inspection tooling
break on the inconsistency.

### Spec

1. Add `"./package.json": "./package.json"` to the `exports` map of every published
   (non-private) package: `@cascivo/{ai,charts,core,editor,flow,i18n,icons,mcp,registry,storage,themes,tokens,vite-plugin}` and `cascivo` (CLI). (`@cascivo/react`
   already has it.)
2. **Guard against recurrence**: new check `scripts/checks/pkg-exports.test.ts`
   (node:test, wired into the `meta:check` script family or `release:check` —
   implementer's choice, but it must run in `pnpm ready`): for every
   `packages/*/package.json` with `private !== true` and an `exports` field, assert
   `exports['./package.json'] === './package.json'`.
3. **Changesets:** one **patch** changeset covering all 14 packages.

### Tests / acceptance

- The new check fails before the fix, passes after (verify locally by reverting one).
- In a fixture (or the repo itself via `node -e`),
  `require.resolve('@cascivo/charts/package.json')` resolves for a built/packed
  tarball — a `pnpm pack` + resolve smoke in the check is optional; the exports-map
  assertion is the required part.

---

## WS-E (P1) — Guessable markdown URLs: namespace hints, alias redirects, a real `/docs/*.md` mirror

### Problem

Three related discoverability failures: (a) the machine-readable 404 hint
(`apps/site/public/llms-404.md`) explains the `block/` namespace but not `chart/` or
`layout/` — the exact miss the adopter hit with `/llms/area-chart.md`; (b) flat guesses
of namespaced names 404 instead of redirecting when the guess is unambiguous; (c) the
adopter guessed `cascivo.com/docs/components.md` and got nothing — only
`getting-started.md` exists as fetchable markdown, while the other guides live behind
GitHub blob URLs, which is the "docs spread across three hosts" complaint.

### Spec

**1. Fix the 404 hint.** `apps/site/public/llms-404.md`: extend the final paragraph to
enumerate *all* name namespaces with one example each: `block/<name>`, `chart/<name>`
(e.g. `chart/area-chart` → `/llms/chart/area-chart.md`), `layout/<name>`. Mention that
the flat form of a namespaced name does not exist. (This file is hand-authored static
content; if any generator owns it, update the generator instead — check before editing.)

**2. Registry-driven alias redirects for unambiguous flat guesses.** Extend the regen
pipeline (natural home: a small step in `scripts/registry/` or `scripts/llms/` that
runs during `pnpm regen`) to generate a block of 301 rules into
`apps/site/public/_redirects` between clearly-marked `# BEGIN/END generated aliases`
markers:

- For every registry entry named `chart/<n>` (and `block/<n>`, `layout/<n>`): if the
  bare `<n>` does **not** collide with another registry entry's name, emit
  `/llms/<n>.md /llms/chart/<n>.md 301` and `/context/<n>.md /context/chart/<n>.md 301`.
- Collisions are skipped, not guessed — e.g. `calendar` (component) vs
  `chart/calendar`: the flat name must keep resolving to the component doc, whose
  same-name cross-link block (`scripts/llms/generate.ts:219-228`) already points to the
  sibling.
- Cloudflare Pages `_redirects` rules are exact-path (static assets win over rules),
  so real files are unaffected; keep the generated block *above* the existing splat
  404 rules so aliases win over the 404 fallthrough.
- The generator must be deterministic and idempotent (drift gate covers `_redirects`
  once it is regen-managed — verify the drift job diffs `apps/site/public/`; it does,
  via `git diff --exit-code`).

**3. Fetchable markdown mirror for the guides + a components index.** Generalize
`scripts/getting-started/generate.ts` into `scripts/docs-md/generate.ts` (keep the old
npm script name working or update `package.json`'s `regen` chain accordingly):

- Publish a curated set of `docs/*.md` guides as `apps/site/public/docs/<slug>.md`:
  `THEMING → theming.md`, `HEADLESS → headless.md`, `COMPATIBILITY → compatibility.md`,
  `TOKENS → tokens.md`, `RECIPE-DASHBOARD → recipe-dashboard.md`,
  `MIGRATING-FROM-SHADCN → migrating-from-shadcn.md`, and the `USING-WITH-*` family
  (kebab-cased). Same canonical-URL header pattern as getting-started, plus the WS-A
  stamp.
  - Rewrite intra-doc relative links (`./THEMING.md` → `/docs/theming.md`; `../apps/…`
    and other repo-relative paths → `https://github.com/cascivo/cascivo/…` blob URLs)
    so the served copies don't dead-link. Keep the rewrite conservative: only
    transform links matching the published set; leave everything else absolute to
    GitHub.
- Generate `/docs/components.md` — the index the adopter guessed: for every registry
  entry (components, charts, blocks, layouts), one line with display name,
  description, channel label (reuse `channelLabel()` logic from
  `scripts/llms/generate.ts:194-198` — extract it to a shared helper rather than
  duplicating), and its `/llms/<name>.md` URL.
- `apps/site/public/_headers`: extend the `/docs/getting-started.md` block to
  `/docs/*` md files (Pages headers support splats: a `/docs/*` rule with the CORS +
  `X-Robots-Tag` headers; content-type can rely on the `.md` extension or keep
  per-file rules — match the existing style).
- `scripts/llms/generate.ts`: in "Guides" (`:737-759`), link the cascivo.com
  `/docs/<slug>.md` URLs as primary (GitHub blob URLs can stay as "source" links or be
  dropped — implementer's judgment, but the fetchable URL must be first). Add
  `/docs/components.md` under "Machine-readable resources". `pnpm regen`.

### Tests / acceptance

- `scripts/checks/docs-routes.test.ts` (existing check) or a sibling asserts: every
  `/docs/<slug>.md` in the published set exists in `apps/site/dist` after build, and
  every guide URL emitted into llms.txt resolves to a generated file.
- Alias-redirect generator: unit test with a synthetic registry containing a collision
  (`calendar`) — asserts the collision is skipped and non-colliding aliases are
  emitted; `_redirects` round-trips idempotently under regen.
- `llms-404.md` mentions `chart/`, `block/`, `layout/`.
- Post-deploy (WS-A job): add `/llms/area-chart.md` → expect `301` → follow → assert
  final body is the area-chart doc; add `curl -fsS <host>/docs/components.md`.

---

## WS-F (P1) — Theme quick-start: single-theme path, mapping table, SSR guidance, size truth

### Problem

The quick start's "critical wiring" is `import '@cascivo/themes/all'` with
`data-theme="light"` and no map from theme exports to `data-theme` values
(`docs/GETTING-STARTED.md:143-166`), and llms.txt's Quick Setup does the same
(`scripts/llms/generate.ts:524`). A single-theme app (this adopter: `dark` only) gets
no steer to `base` + one theme, has to *infer* that `@cascivo/themes/dark` ↔
`data-theme="dark"`, and gets no warning about the persisted-theme SSR hydration
implication. Separately, the adopter's "287 kB of 15 themes" claim is wrong about the
mechanism (see verification headline) — but nothing in the docs states what CSS weight
to *expect*, which is why a merged chunk got misattributed.

### Spec

1. **Measure first, then state.** In a throwaway Vite fixture, build (a) `themes/all`
   alone, (b) `themes/base` + `themes/dark`, (c) `react/styles.css`. Record raw +
   gzip numbers in the PR description and use them in the docs below (expectation from
   source sizes: (a) ≈ 40 kB raw, (b) slightly less, (c) ≈ 273 kB — the number the
   adopter actually saw).
2. **`docs/GETTING-STARTED.md` — restructure "The critical wiring":**
   - Present two equally-blessed recipes: *"want light + dark with system default"* →
     `import '@cascivo/themes/all'`; *"shipping one theme"* →
     `import '@cascivo/themes/base'` + `import '@cascivo/themes/<theme>'` and set
     `data-theme="<theme>"`. One sentence each on what they cost (measured numbers).
   - Add the mapping table for all twelve first-party themes: export path ↔
     `data-theme` value ↔ light/dark color-scheme (source of truth:
     `packages/themes/src/*.css`; the export name IS the attribute value — say so
     explicitly, that one sentence is the whole fix for the adopter's inference). Note
     `tailwind.css` is a bridge stylesheet, not a theme, and `base` is required
     scaffolding, not a theme.
   - New subsection **"Runtime switching & SSR"**: `ThemeProvider` + `useTheme` +
     `themePreloadScript()` (point into `docs/THEMING.md:55-90` for depth) with the
     hydration caveat spelled out: a *persisted* theme choice is client state — for
     SSR either inline `themePreloadScript()` in `<head>` (it sets `data-theme` before
     paint, avoiding both FOUC and hydration mismatch) or hard-code `data-theme` on
     `<html>` when the theme is static (bless the adopter's approach by name:
     "hard-coding is correct for a fixed-theme app, not a workaround").
   - Fold in R2: one line under Path B — "All packages are 0.x: pin exact versions
     (no `^`) and watch `breaking-changes.json`" linking the llms.txt versioning
     section's advice.
3. **`scripts/llms/generate.ts` Quick Setup (`:517-533`):** show both import recipes
   (all vs base+one) with the one-line tradeoff; add the "export name = data-theme
   value" sentence and the twelve-theme list (names only, comma-separated — the full
   table lives in getting-started). `pnpm regen`.
4. **`docs/THEMING.md`:** verify the "twelve themes" enumeration (`:296`) lists all
   twelve names with their `data-theme` values; add the export↔value sentence near
   "How `data-theme` selection works" (`:29`) if absent.

### Tests / acceptance

- `pnpm regen` idempotent; md-tables check green on the new table
  (`scripts/checks/md-tables.test.ts` covers generated tables — keep the hand-authored
  table pipe-escaped consistently).
- The claims check (`scripts/checks/claims.test.ts`) — if it asserts on marketing/docs
  claims, run it and reconcile any size claims with the measured numbers; never ship
  an unmeasured size claim (that is how the adopter's 287 kB misattribution happened).
- Acceptance: a new adopter following the quick start with theme `dark` never imports
  more than `base` + `dark`, and knows exactly what attribute value to set, from one
  screen of markdown.

---

## WS-G (P2) — `Avatar` initials-from-name convenience

### Problem

`Avatar` takes `fallback` (pre-computed initials) + `alt`; every other major system
derives initials from a `name` prop, so adopters' first attempt fails (report F4a).
The `User` composite has a `name` but also doesn't derive initials for its Avatar.

### Position

Add the convenience, non-breaking; do not change existing prop semantics. `fallback`
stays the explicit override.

### Spec

1. `packages/components/src/avatar/avatar.tsx`: add `name?: string`.
   - Derivation: initials = first grapheme of the first word + first grapheme of the
     last word (single word → its first grapheme), uppercased via
     `toLocaleUpperCase()`. Use `Intl.Segmenter` for grapheme safety where available
     with a plain `[0]` fallback — keep it trivial (no library).
   - Precedence: rendered fallback text = `fallback ?? initialsFrom(name)`;
     accessible label = `alt || name || fallback` (extends the existing
     `label = alt || fallback` at `avatar.tsx:38` — a `name`-only avatar must not be
     unlabeled).
2. `packages/components/src/user/user.tsx`: when `avatarProps` provides neither
   `fallback` nor `name` nor `src`… — actually simpler and better: pass
   `name: typeof name === 'string' ? name : undefined` through to the Avatar unless
   `avatarProps` already sets `name`/`fallback`. (`UserProps.name` is `ReactNode`;
   only forward when it is a string.)
3. `avatar.meta.ts` / `user.meta.ts`: add the prop with description + an example
   (`<Avatar name="Ada Lovelace" />` → "AL"); `pnpm regen` (props-parity Direction B
   will demand the manifest update anyway once WS-C lands — do it here regardless).
4. Component tests (`avatar.test.tsx`): initials for two-word / one-word /
   multi-word names; `fallback` beats `name`; label precedence; `User` forwarding.
5. Changeset: `@cascivo/react` **minor**.

### Acceptance

- `<Avatar name="Jane Doe" />` renders "JD" with `role="img"` and accessible name
  "Jane Doe"; all existing Avatar/User tests unchanged and green; i18n check green
  (no user-visible *strings* added — initials are data, not copy).

---

## WS-H (P2) — TanStack Start integration notes at point of need

### Problem

Report R4: two non-cascivo potholes (router module must export `getRouter` on
TanStack Start ≥1.170; `vite build` emits an SSR *handler*, not a listening server —
production needs a server preset/adapter) cost the adopter time *immediately after*
following our SSR recipe. Cheap goodwill: warn where they're standing.

### Spec

`docs/USING-WITH-VITE-SSR.md`: add a short "TanStack Start specifics (not cascivo,
but you'll hit them here)" call-out box after the `noExternal` step covering exactly
those two items, dated and version-pinned ("as of TanStack Start 1.170") so it can be
retired when stale. Do not replicate TanStack docs — one sentence + link each.

### Acceptance

Doc renders; no generator involvement (this file is repo-served only — unless WS-E
publishes `using-with-vite-ssr.md`, in which case regen picks it up automatically).

---

## Explicit non-actions (decided; do not reopen without new evidence)

- **No API changes to DataTable, Button, or charts** — the reported "wrong API"
  beliefs came from a stale aggregate, and the shipped APIs + repo docs agree
  (triage F1). WS-A addresses the delivery failure.
- **No rename/alias of `Stack`** — re-affirmed from the 07-17 plan (WS6 there);
  point-of-confusion mitigations are shipped. Nothing new to do.
- **No change to `themes/all` composition** — it is already the lean light+dark
  bundle; the fix is guidance (WS-F), not packaging.
- **No self-hosted docs consolidation to a single hostname** — both hosts serve the
  same tree by design; WS-A makes that true in practice and llms.txt already
  absolute-links accordingly (`scripts/llms/generate.ts:363-370`).

## Cross-cutting requirements (all workstreams)

- Every PR passes `pnpm ready` (regen → check --fix → build → typecheck → tests) and
  commits regenerated artifacts (`registry.json`, `apps/site/public/**`) alongside
  source changes — the drift job diffs them.
- Component-source changes (WS-G) additionally respect the component checklist in
  CLAUDE.md (signals-only, i18n, `pnpm breakpoint:check` etc. — WS-G touches no CSS,
  so mostly moot, but the gate runs regardless).
- Changesets: WS-B react minor · WS-D 14-package patch · WS-C react patch (if the
  repo's precedent versions meta-only changes; check `packages/react/CHANGELOG.md`) ·
  WS-G react minor. Docs/site/workflow-only changes (WS-A, WS-E, WS-F, WS-H) need no
  changeset unless repo convention says otherwise.
- New checks (WS-D `pkg-exports`, WS-A stamp assertions) get added to the CLAUDE.md
  "reproduce individual CI steps" list per house convention.

## Suggested PR breakdown

1. **PR 1 (WS-B + WS-D)** — react link re-export + exports-map sweep + guard check.
   Small, pure-code, immediately unblocks the documented router happy path.
2. **PR 2 (WS-A)** — generator stamps + `verify-site` workflow job + OPS-HOSTS note.
   Land early so every subsequent docs PR is provably delivered.
3. **PR 3 (WS-C)** — `rows` description fix + prose sweep + Direction-B WARN→ERROR.
4. **PR 4 (WS-E)** — 404 hint namespaces + alias redirects generator + `/docs/*.md`
   mirror + `components.md` index + llms.txt link updates.
5. **PR 5 (WS-F + WS-H)** — theme quick-start restructure (with measured sizes),
   mapping table, SSR subsection, R2 pinning line, TanStack call-out.
6. **PR 6 (WS-G)** — Avatar `name` initials.

## Open questions for the implementer (defaults chosen; deviate with reason)

1. **WS-A**: gate the smoke job on `docs.cascivo.com` too, or warn-only until the
   host binding is confirmed fixed? **Default: hard-fail on both hosts** — a red
   workflow is the mechanism by which the ops mis-binding finally gets fixed; if it
   turns out the subdomain is intentionally a separate deployment, update
   OPS-HOSTS.md and the job together.
2. **WS-C**: if the Direction-B burn-down surfaces >~20 legitimate warnings, is a
   large `ALLOWLIST` acceptable? **Default: no** — fix the manifests instead; the
   allowlist is for genuine intent (compound components), not backlog.
3. **WS-E**: publish *all* of `docs/*.md` or the curated set? **Default: curated set
   listed in the spec** — internal/, plans/, and contributor docs stay repo-only.
4. **WS-G**: should `User` derive initials itself instead of forwarding `name`?
   **Default: forward** — one derivation implementation, in Avatar, keeps the
   behavior identical everywhere.
