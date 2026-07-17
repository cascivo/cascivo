# Fix plan — TanStack Start / Vite SSR adopter report (2026-07)

> **IMPLEMENTATION STATUS (2026-07-16):** Waves 1.1, 1.2, 2, 3 (except 3.1), 4, and 5
> are **implemented and verified** on this branch (`pnpm regen` idempotent, all package
> tests + CSS/meta/llms checks green, full build passes). **Deferred:**
> **Wave 1.3** (the dist per-component-CSS change) — it regresses CSS tree-shaking
> for every consumer and is a genuine product tradeoff; the SSR blocker is already
> fixed for the supported path by 1.2 + docs, so this is left as a maintainer
> decision (Option A vs B). **RESOLVED 2026-07-16 — WON'T DO:** keep the current
> per-component-CSS + `ssr.noExternal` design; both Option A (loses tree-shaking) and
> Option B (`.css.js` shims — SSR flash of unstyled content, CSP, worse client delivery)
> are net-negative versus a one-line/one-plugin config. Full rationale in
> `fix-plan-tanstack-dashboard-adopter-2026-07.md` → "Wave 6". Do not re-open without new
> evidence. **Wave 3.1** (props-parity CI gate) — deferred with a
> burn-down probe recorded in that section: it needs the TS type checker (a new
> devDep) to avoid ~60-component false-positive noise, and the reported bug was a
> false positive. Everything else in Wave 3 shipped.

**Status:** Planning artifact — the plan below is the spec; see the status banner above
for what landed. Every item carries file:line pointers, effort (S/M/L), and a gate.
**Source:** `feedback-tanstack-ssr-adopter-2026-07.md` (same directory) — an AI agent
that built a deployments dashboard on TanStack Start (Vite SSR) against the published
packages. Verdict positive ("best AI-onboarding surface I've used") with two claimed
production blockers.

**Verification:** every claim was checked against current `main` (2026-07-16) by five
independent code investigations. Headlines from triage:

- The **SSR blocker is real** — but the mechanism is a *build-injected static* bare
  `import './x.css'` in every dist chunk (not a dynamic import as reported), and the
  escape hatch (`@cascivo/react/styles.css` + `ssr.noExternal`) already exists but is
  undocumented for the Vite-SSR path.
- The **"docs contradict types" claim is a false positive** — the reporter compared two
  *different* components that share the display name `AppShell`. Each doc matches its
  own type. The real defects are (a) the naming collision itself misleads even careful
  readers, and (b) there is genuinely **no check** that `.meta.ts` props match the
  TypeScript prop interfaces — the bug class the reporter thought they hit can happen.
- The **blocks-missing-from-registry defect is real and has a single root cause**:
  `parseLegacyRegistry` reads only `registry.components` and silently drops the
  `blocks` (and `templates`) arrays, so the 12 new blocks get no `/r/*.json`, no
  `/r/shadcn/*.json`, and no `llms/*.md`.
- The **Tailwind recipe already exists** (`docs/USING-WITH-TAILWIND.md` + the
  `@cascivo/themes/tailwind.css` bridge) but is not linked from llms.txt, and its §1
  states a layer order that **contradicts** the canonical `layers.css`.
- **`llms-full.txt` already exists and is already linked from llms.txt** (lines 21 and
  29) — the owner's suggestion is shipped; only a prominence tweak remains (Wave 3.5).
- A **rocket icon exists** (`Spaceship`, keyword `rocket`) and `Dashboard` covers
  `LayoutDashboard` — but there is no alias layer, no MCP icon tool, and the entire
  git/version-control concept space (`GitBranch`/`GitCommit`/`GitMerge`) is absent.

---

## 0. Triage — claim → verdict (do not re-fix the refuted rows)

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| 1 | SSR broken: `Unknown file extension ".css"` for dist per-component CSS | **CONFIRMED** (mechanism corrected: static injected import, not dynamic) | `cssImportEdges` plugin splices `import './<name>.css';` into every CSS-module shim at build time (`packages/react/vite.config.ts:39-109`, injection at `:87`; `preserveModules` `:130-131`; asset rename `:136-140`). Node/workerd ESM loaders have no `.css` loader → hard throw. No SSR guard exists anywhere. |
| 1a | llms.txt framework claims contradict experience | **CONFIRMED** | `scripts/llms/generate.ts:577` claims "React 18/19, Next.js App Router (RSC), Vite, Astro islands … verified". The "Vite ✅" row in `docs/COMPATIBILITY.md:14` points at `apps/examples/react-vite` — a **CSR-only SPA** (`ReactDOM.createRoot`). No Vite-SSR/TanStack/workerd example exists; that path was never verified. Next RSC works only because its recipe imports the aggregate `styles.css` in a server layout (`apps/examples/react-next/app/layout.tsx:4`), sidestepping per-component CSS. |
| 2 | Docs contradict types: `sideNav` doc vs `nav` type on AppShell + ShellHeader | **REFUTED as drift; CONFIRMED as naming-collision UX defect + latent gap** | Two components named `AppShell`: copy-paste layout shell has `sideNav` (`packages/layouts/src/app-shell/app-shell.tsx:10`, meta `:13`, doc `apps/site/public/llms/layout/app-shell.md:31`) — all agree. Published react AppShell has `nav` (`packages/components/src/app-shell/app-shell.tsx:20`, doc `llms/app-shell.md:33`) — all agree. ShellHeader has `nav` everywhere; no `sideNav` exists in its doc, meta, or type (`shell-header.tsx:58`, `shell-header.meta.ts:19-24`, `llms/shell-header.md:32`). The reporter crossed the two AppShells. **Latent gap is real:** props tables render the hand-authored `.meta.ts` verbatim (`scripts/llms/generate.ts:93-108,:237` via `scripts/registry/generate.ts:229-231`); no check compares `meta.props` to the `interface …Props` (`scripts/checks/manifest-completeness.test.ts` checks non-emptiness only). Note: the same-name collision was independently confirmed in `fix-plan-adopter-pair-2026-07.md` triage (row 6.1, "there are 3") — coordinate, don't duplicate. |
| 3 | Missing `.md` returns docs HTML shell, 200 OK | **CONFIRMED in substance; status code unverifiable from repo** | No SPA catch-all and no 404 rules in `apps/site/public/_redirects` (single 301 rule). Build emits `dist/404.html` — the hydrated SPA shell (`apps/site/vite.config.ts:700-708`), so the *body* is always HTML regardless of status. `stat-card.md` never existed — real names are `stat.md` and `block/stats-cards.md`; a guessed-name miss is exactly the case needing a machine-readable 404. |
| 4 | `r/shadcn/dashboard-overview.json` missing; blocks CLI-only, undocumented | **CONFIRMED — root cause found** | `parseLegacyRegistry` maps **only** `obj['components']`, ignoring `obj['blocks']` (12 blocks) and `obj['templates']` (`packages/registry/src/validate.ts:150-184`). Both `/r/` and `/r/shadcn/` emission iterate `index.items` (`scripts/registry/generate.ts:423,:455`). The shadcn projection already supports blocks (`packages/registry/src/shadcn.ts:61-75`: `block → registry:block`, `block/x → block-x`) — old layouts-blocks in the `components` array DO get JSON. READMEs promise "the same components" via shadcn with no blocks caveat (`packages/cli/README.md:54-64`, `packages/registry/README.md:50-53`). New blocks also get no `llms/*.md`. |
| 5 | Icons undocumented at name level; agents must dump `.d.mts` | **PARTLY CONFIRMED** | Catalog exists with keywords (`apps/site/public/icons.catalog.json`, 439 icons, generated by `scripts/icons/generate.mjs:293-328`) and llms.txt links it (`:36,:388`) — but no aliases field, no concept→name legend in llms.txt prose, and **no MCP icon tool at all** (`packages/mcp/src/server.ts`). |
| 5a | No Rocket icon; no LayoutDashboard/GitBranch | **PARTLY REFUTED** | `Spaceship` has keywords `[launch, rocket, ship, space]`; `Dashboard`, `Gauge`, `Gauge2` cover dashboard. **Genuinely absent:** entire git/VCS space (`git`/`branch`/`commit` = 0 keyword matches; `Fork` is a *dining* fork) and any "deploy" keyword. |
| 6 | "Never use useState/useContext/useEffect" scares off prop-driven consumers | **CONFIRMED** | Consumer-facing reactivity section says "Do NOT reach for `useState`/`useContext`/`useEffect`" with no consumer/contributor split (`scripts/llms/generate.ts:499-513`); stricter authoring phrasing at `:612-625`. Prop-only composition with zero signals is fully supported and undocumented as such. |
| 7 | No Tailwind v4 recipe | **STALE — recipe exists, discoverability + consistency defects remain** | `docs/USING-WITH-TAILWIND.md` has the copy-paste head (`:22-29`) and layer-order section (`:42-62`); bridge stylesheet `packages/themes/src/tailwind.css` shipped (v57). Defects: (a) llms.txt Guides list (`generate.ts` guides section → `llms.txt:145-153`) does not link it — only a passing mention at `llms.txt:159-160`; (b) `USING-WITH-TAILWIND.md` §1 lists `…theme < component`, contradicting canonical `tokens < component < theme` (`packages/tokens/src/layers.css:37-38`, also `llms.txt:113`). |
| 8 | Charts muddy brown/orange on dark theme | **CONFIRMED** | Series 1 is Okabe-Ito **orange** (hue 70) in every theme (`packages/tokens/src/index.css:230`, dark override `packages/themes/src/dark.css:120`). Area fill hardcodes `fillOpacity 0.25` (`packages/charts/src/charts/area-chart/area-chart.tsx:357,390,407`); 25% amber over dark surface `oklch(0.185 0.007 250)` (`dark.css:20`) = the muddy brown. Dark tokens were tuned for strokes, never for translucent fills. `chart-palette.test.ts` tests CVD separation only, not fill-over-surface contrast. |
| 9 | Card clips flex children (Badge cut off) | **CONFIRMED** | `.card { overflow: hidden }` (`packages/components/src/card/card.module.css:5`); `.header`/`.footer` are flex (`:38,:62-66`) with no `min-width: 0` anywhere → flex `min-width:auto` prevents shrink, card clips the overflow. |
| 10 | Search has no width control | **CONFIRMED** | `SearchProps` has `size` (height/font only), no width prop (`packages/components/src/search/search.tsx:9-22`); root hardwired `inline-size: 100%` (`search.module.css:6`), input too (`:51`). |
| 11 | Owner suggestion: link llms-full.txt from llms.txt | **ALREADY SHIPPED** | `apps/site/public/llms-full.txt` (421 KB) is generated (`scripts/llms/generate.ts:710-737,:762-763`) and linked from `llms.txt:21` and `:29` (emitted at `generate.ts:365,:375`). Residual: prominence only (Wave 3.5). |

---

## Wave 1 — SSR: no more bare `.css` in the server-loadable module graph (P0)

The one would-block-in-production defect. Three-step plan: document the working recipe
now (S), automate it via the existing vite plugin (S), then decide + land the
config-free dist fix (M/L). A CI smoke test codifies the contract whichever option
lands.

### 1.1 SSR recipe + honest compatibility matrix — S

- **New doc** `docs/USING-WITH-VITE-SSR.md` (covers TanStack Start, vite-ssr, Remix on
  Vite, workerd/Cloudflare): the two required lines —
  `import '@cascivo/react/styles.css'` once in the root route/layout, and
  `ssr: { noExternal: ['@cascivo/react'] }` (plus `@cascivo/charts`/`editor`/`flow` if
  used) in `vite.config.ts` so Vite processes the package's CSS imports instead of Node
  evaluating them raw. Explain *why* (dist chunks carry static `.css` side-effect
  imports; bundlers resolve them, bare Node/workerd loaders throw).
- **`docs/COMPATIBILITY.md:14`**: split the "Vite + React" row into "Vite + React
  (CSR)" (current example) and "Vite SSR / TanStack Start" with the `noExternal`
  requirement stated in the Notes column. Until 1.3 lands, do not claim zero-config SSR.
- **`scripts/llms/generate.ts:574-585`**: amend the framework-support line — add
  "Vite SSR / TanStack Start (requires `ssr.noExternal`, see guide)" and link the new
  doc from the Guides section. Run `pnpm regen`; commit regenerated `llms.txt`.
- **Verify:** `pnpm regen && git diff` shows the new guidance in
  `apps/site/public/llms.txt`; drift check green.

### 1.2 Make `@cascivo/vite-plugin` set `ssr.noExternal` automatically — S

- `packages/vite-plugin` already exists. Add a `config()` hook that merges
  `ssr.noExternal: [/^@cascivo\//]` (respect user-provided values; do not clobber
  arrays). This makes TanStack Start work with zero extra config for anyone already
  using the plugin, and gives the docs a one-liner alternative.
- Add a unit test asserting the merged config shape; document in the plugin README and
  in `USING-WITH-VITE-SSR.md`.
- **Verify:** plugin test green; `pnpm ready`.

### 1.3 Config-free dist fix — decision + implementation — M/L

Present the tradeoff to the maintainer in the PR description; recommended default is
**Option A**.

- **Option A (recommended): drop the injected per-component CSS edges from the npm
  dist.** Delete/disable the `cssImportEdges` splice (`packages/react/vite.config.ts:87`)
  so no chunk contains a bare `.css` specifier; the aggregate
  `@cascivo/react/styles.css` (already emitted at `vite.config.ts:94-98`, exported at
  `package.json:39`) becomes the single sanctioned CSS entry, exactly as the Next.js
  recipe already does. Keep emitting per-component `.css` assets in dist (they remain
  available for advanced manual imports and for the copy-paste channel, which is
  unaffected — source `.module.css` imports stay as-is).
  - **Breaking consequence to handle:** CSR Vite consumers who never imported
    `styles.css` (e.g. `apps/examples/react-vite/src/main.tsx`, which today relies on
    injected CSS) render unstyled. Update that example to import
    `@cascivo/react/styles.css`, add a changeset marked **breaking/minor-with-loud-note**,
    and add a "Styles not appearing?" entry to `docs/TROUBLESHOOTING.md`. Audit
    `sideEffects` (`packages/react/package.json:29-31`) — with no JS→CSS edges it can
    likely become `false`, improving tree-shaking; verify nothing else relies on it.
- **Option B (keep zero-config CSR): emit `.css.js` injection shims.** Replace the
  injected `import './x.css'` with `import './x.css.js'`, where the shim no-ops when
  `typeof document === 'undefined'` and otherwise injects a `<link>`/constructable
  stylesheet once (dedupe against the aggregate stylesheet via a
  `data-cascivo-css` marker). Preserves today's CSR behavior, but adds SSR-FOUC (styles
  arrive only on hydration), double-load dedup complexity, and CSP `style-src`
  implications. Only choose if zero-config CSR is deemed contractual.
- **Either way — regression test (do this even before the option lands):** new
  `scripts/checks/ssr-import.test.ts` (wired into `pnpm ready` after build): for every
  emitted chunk in `packages/react/dist`, assert the module source contains no bare
  `import './*.css'` specifier (Option A), or dynamically `import()` a representative
  set of chunks under plain Node with react externals stubbed and assert no
  `ERR_UNKNOWN_FILE_EXTENSION` (works for both options). Today this test fails —
  that is the point.
- **Example app:** add `apps/examples/react-tanstack` (or minimal `react-vite-ssr`)
  exercising real server rendering, wired into CI build like the other examples
  (remember the workspace-alias rule from CLAUDE.md if it builds without a prior full
  build). This is the living proof for the COMPATIBILITY row.
- **Verify:** new check green; TanStack/SSR example builds and server-renders in CI;
  `pnpm ready:ci` green (build-order rule).

---

## Wave 2 — Registry truth: blocks on every machine surface + real 404s (P0)

### 2.1 Fold `blocks` (and `templates`) into the registry projection — M

- **Root cause fix:** `packages/registry/src/validate.ts:150-184` — extend
  `parseLegacyRegistry` to map `obj['blocks']` into `items` with `type: 'block'`
  (and decide `templates` while there; recommended yes for `/r/`, optional for shadcn).
  Downstream already handles blocks: `buildRegistry` (`packages/registry/src/build.ts:16-38`)
  and `writeShadcnRegistry` (`shadcn.ts:61-75,116-153` — maps to `registry:block`,
  flattens `block/x → block-x`).
- Confirm block `files[]` URLs pass the allowlisted-host check
  (`scripts/registry/generate.ts:363-387`) and that inlined-content resolution
  (`:440-453`) reads block sources from `packages/components/src/blocks/*`.
- **Naming reconciliation:** shadcn slug is `block-dashboard-overview` while CLI/site
  say `block/dashboard-overview`. Document the mapping in both READMEs (2.3) and emit
  both names in the shadcn item's `description` or `meta` so guessed URLs are
  greppable.
- **Verify:** after `pnpm regen`, `apps/site/public/r/shadcn/block-dashboard-overview.json`
  and `/r/<…>` exist for all 12 blocks; `npx shadcn add` against a local file resolves
  dependencies transitively (existing registry tests extended with a block fixture);
  drift check green.

### 2.2 llms `.md` coverage for the new blocks — S

- `scripts/llms/generate.ts` currently emits docs only for `registry.components`
  (+ old layout-blocks under `llms/block/`). Extend the entry loop (`:745-753`) to
  include `registry.blocks`, emitting `llms/block/<name>.md` consistently, and add them
  to the llms.txt component index section. Also include them in `llms-full.txt`
  (`generateLlmsFullTxt`, `:710-737`) — it concatenates per-entry docs, so this may be
  automatic once the loop is extended; verify.
- **Verify:** `llms/block/dashboard-overview.md` exists post-regen; index lists it;
  `pnpm llms:check` green.

### 2.3 Document the channel split until/alongside 2.1 — S

- `packages/cli/README.md:54-64`, `packages/registry/README.md:50-53`, and
  `readme.body.md:32-43`: state exactly what the shadcn surface contains (post-2.1:
  everything, with the `block-` slug convention; if 2.1 is deferred: "blocks install
  via `npx cascivo add block/<name>` only"). Run `pnpm regen` (readme assembly).

### 2.4 Real, machine-readable 404s for machine paths — S

- `apps/site/public/_redirects` — add path-scoped rules (static assets always win over
  `_redirects`, so existing files keep serving 200):
  ```
  /llms/*     /llms-404.md     404
  /context/*  /llms-404.md     404
  /r/*        /r-404.json      404
  ```
- Add the two tiny static bodies to `apps/site/public/`: `llms-404.md` ("No doc at this
  path. Valid names: see /llms.txt index or /registry.json.") and `r-404.json`
  (`{"error":"not_found","hint":"see /registry.json for valid names; blocks use the block- prefix"}`).
  This guarantees a non-HTML body **and** a 404 status regardless of any dashboard-side
  SPA setting on the Pages project.
- Mention the 404 contract in llms.txt ("a wrong name returns HTTP 404 with a hint
  body") — one line in `scripts/llms/generate.ts` near the machine-readable-resources
  section.
- **Post-deploy verify (manual or smoke script):** `curl -i` a missing and an existing
  path under `/llms/` and `/r/` on the deployed site; assert 404+hint vs 200.

---

## Wave 3 — AI-docs truth hardening (P1)

### 3.1 Props-parity check: `.meta.ts` vs TypeScript interface — M

> **STATUS (2026-07-16): DEFERRED — implemented investigation, not the gate.** A
> source-heuristic version was probed against the repo and is unshippable: the
> "interface member missing from meta" direction flags **60/150** components (nearly
> all legitimate — `className`/`children` passthrough, and internal sub-component
> `*Props` interfaces in the same file), and the reverse "meta prop absent from
> source" direction still flags **20** (all HTML-attribute passthrough via
> `...ComponentProps<'button'>` spreads — `onClick`, `checked`, `href`, …). A reliable
> check genuinely requires the TS **type checker** to resolve inherited/spread members,
> which is not importable from `scripts/` today (neither `typescript` nor `ts-morph`
> resolves — the repo type-checks via bundled `vp`/tsc). Since the reported bug was a
> false positive and the same-name confusion is fully addressed by **3.2** (shipped),
> a noisy or toothless gate is net-negative. Revisit as its own PR: add `ts-morph` as a
> devDep, diff only *own* interface members, seed an allowlist for the passthrough
> cases above. Burn-down evidence saved during the implementation session.

The reporter's bug was a false positive, but nothing prevents the real thing. New
`scripts/checks/props-parity.test.ts`, wired into `pnpm meta:check` (package.json:36):

- Using the TS compiler API or `ts-morph` (dev-dep), for each registry entry resolve
  `<name>.tsx` next to its `.meta.ts` (the same directory walk as
  `scripts/registry/generate.ts:228-231`) and locate the exported
  `interface/type <Pascal>Props`.
- Diff declared members against `meta.props[].name`; report (a) type members missing
  from the manifest, (b) manifest props absent from the type. Optionally compare
  `required` vs `?` optionality (warn-level first).
- **Must handle:** HTML-attribute spreads (`extends ComponentProps<'div'>` — diff only
  *own* declared members, not inherited), intentionally undocumented internals (an
  `ALLOWLIST` with reasons, mirroring `primitive-docs.test.ts`), and same-display-name
  components (key by directory path — `layout/app-shell` vs `app-shell` — precisely the
  axis the reporter crossed).
- Expect a burn-down: first run will surface existing mismatches; fix manifests (then
  `pnpm regen`) or allowlist with reasons before enabling as a hard gate.
- **Verify:** seeded mutation test — rename a prop in a scratch fixture and assert the
  check fails; `pnpm meta:check` green on the repo.

### 3.2 Defuse the AppShell/same-name collision in generated docs — S

- In `scripts/llms/generate.ts` (`componentMarkdown`), when two registry entries share
  a display name, auto-emit a disambiguation callout at the top of **each** doc:
  "⚠ Two components are named AppShell. This page is the copy-paste layout shell
  (`sideNav` prop). The npm `@cascivo/react` AppShell uses `nav` — see /llms/app-shell.md."
  Generate it from the registry (group by `meta.name`), never hand-write it.
  Do the same in the llms.txt component index (channel + suffix, e.g.
  "app-shell (npm)" vs "layout/app-shell (copy-paste)").
- Coordinate with `fix-plan-adopter-pair-2026-07.md` (triage row 6.1 and its Wave 0/2
  items) — if that plan's channel-marker work has landed, extend it; don't duplicate.
- **Verify:** post-regen, both `llms/app-shell.md` and `llms/layout/app-shell.md`
  carry the cross-link; `llms/stack.md` / `llms/layout/stack.md` too (same collision).

### 3.3 Reword the reactivity section: consumers vs authors — S

- `scripts/llms/generate.ts:499-513` (consumer-facing "Reactivity & state"): lead with
  the reporter's own suggested framing —
  "**Consuming components requires no signals.** Pass plain props, `useState` in *your*
  code is fine, and you never need `useSignals()` unless your component body reads
  `signal.value`. Signals are how cascivo components work *internally* and what you use
  when you opt into cascivo's reactive state (`useSignal` from `@cascivo/core`); don't
  mirror a signal into `useState` or vice-versa — pick one owner per piece of state."
  Keep the existing `useSignals()` footgun warning, scoped to "if you read
  `signal.value` in render".
- `:612-625` (authoring rules): keep the strict list but retitle so it's unambiguous it
  applies to **authoring cascivo components / copy-paste sources**, not consumer app
  code.
- Mirror the same consumer/author split in `docs/AI-RULES.md` if it repeats the strict
  phrasing (check while editing). `pnpm regen` after.
- **Verify:** regenerated `llms.txt` reads correctly; `primitive-docs`/`llms:check`
  green.

### 3.4 Tailwind v4 discoverability + layer-order consistency — S

- Add `USING-WITH-TAILWIND.md` to the Guides list in `scripts/llms/generate.ts`
  (renders into `llms.txt:145-153`), with the five-line copy-paste import head from
  `USING-WITH-TAILWIND.md:22-29` inlined directly in llms.txt (agents shouldn't need a
  second fetch for five lines).
- Fix the contradiction: `docs/USING-WITH-TAILWIND.md:42-62` lists
  `…cascivo.theme < cascivo.component`; canonical order is
  `…component < theme…` (`packages/tokens/src/layers.css:37-38`, matching
  `llms.txt:113`). Correct the doc to the canonical order and add a comment pointing at
  `layers.css` as the single source of truth.
- **Verify:** grep both files for the order string and confirm they match `layers.css`;
  `pnpm regen` drift-clean.

### 3.5 llms-full.txt prominence — XS

- Already generated and linked (triage row 11). Single tweak: in
  `scripts/llms/generate.ts` "Start here" section (emitted around `llms.txt:21`), make
  the line explicit and first: "**Single-fetch option:** `GET /llms-full.txt` — the
  entire doc set (this file + every per-component page, ~420 KB) in one request; prefer
  it when you'll need more than a couple of components." No structural change.

### 3.6 Honest framework claims (ties to 1.1) — folded into Wave 1.1

Tracked there; listed here so Wave 3 reviewers don't re-add it.

---

## Wave 4 — Icons: intent-resolvable names (P1)

### 4.1 Aliases in the catalog + foreign-name synonyms — S/M

- Extend `scripts/icons/generate.mjs`: add an `aliases: string[]` field per catalog
  entry (schema comment `:294-301`, emit `:302-328`), sourced from a new checked-in
  `packages/icons/svg/aliases.json` (or extend `metadata.json`) mapping Lucide/Radix/
  Feather names to canonical exports — seed at minimum: `Rocket → Spaceship`,
  `LayoutDashboard → Dashboard`, `Gauge → Gauge`, `Settings2 → Settings`, plus a pass
  over the top ~50 Lucide names diffed against the catalog. Fold aliases into
  `buildKeywords` (`:206-217`) so existing keyword search paths pick them up.
- Update the gallery search to include aliases (`apps/site/src/pages/IconsPage.tsx:83-91`)
  — free if aliases are folded into `keywords`, explicit otherwise.
- **Verify:** `pnpm icons:generate && pnpm regen` drift-clean; catalog entry for
  `spaceship` contains `rocket` in aliases; gallery search "rocket" hits Spaceship.

### 4.2 Fill the git/deploy content gap — M (content work)

- Add normalized `viewBox="0 0 24 24"` SVGs to `packages/icons/svg/`:
  `git-branch`, `git-commit`, `git-merge`, `git-pull-request`, `rocket` (a true rocket
  glyph if Spaceship's style doesn't fit; otherwise alias only), `deploy`/`ship`
  concepts via metadata keywords on existing/new icons. Add `metadata.json` entries
  with keywords (`branch`, `version control`, `deploy`, `release`, `ship`).
  Style-match the existing 1.5px-stroke set; the generator strips presentation attrs
  (`generate.mjs:99-109`) and rejects wrong viewBoxes (`:136-139`).
- **Verify:** regen; catalog keyword search for `git`, `branch`, `deploy` each return
  ≥1 icon; icons render in the gallery at sm/md/lg.

### 4.3 MCP `search_icons` tool — S

- `packages/mcp/src/server.ts`: add a `search_icons` tool (query → matching
  `{pascalName, name, keywords, aliases, category}`, no `svg` payload by default; and
  an optional `list_icons` returning names only). Back it with the same catalog JSON
  the site serves (read from the packaged copy or fetch — match how other MCP tools
  source `registry.json`). Update the MCP README tool list.
- **Verify:** MCP package tests cover a `rocket` query resolving to `Spaceship`.

### 4.4 Concept legend in llms.txt Icons section — XS

- `scripts/llms/generate.ts:394-401`: after the count/link lines, emit a short static
  legend: "Names differ from Lucide — resolve intent via `/icons.catalog.json`
  (`keywords` + `aliases` fields). Common mappings: Rocket→Spaceship,
  LayoutDashboard→Dashboard, Gear→Settings, GitBranch→GitBranch (added v…)." Generate
  the mapping list from `aliases.json` (top N), don't hand-maintain.

---

## Wave 5 — Component polish (P2)

### 5.1 Chart dark-theme fills — M

Two changes, one decision:

- **Fill-opacity token (do):** replace the hardcoded `fillOpacity 0.25`
  (`packages/charts/src/charts/area-chart/area-chart.tsx:357,390,407`) with
  `var(--cascivo-chart-fill-opacity, 0.25)` (or read via the existing COLORS-style
  indirection), then set a higher value + slightly recoordinated chart tokens in
  `packages/themes/src/dark.css:120-130` so translucent fills stay chromatic over the
  L≈0.185 surface. Check other chart types for the same hardcoded pattern (bar hover
  fills, radar, sparkline fills) while in there.
- **Lead-color decision (ask maintainer in PR):** series 1 is Okabe-Ito orange in every
  theme (`packages/tokens/src/index.css:230`). Reordering to lead with the sky blue
  (`chart-2`) reads better on dark but is a **visual breaking change** for every
  existing single-series chart. Recommendation: keep order, fix dark values + fill
  opacity first; revisit ordering only with a changeset + updated visual baselines.
- **Regression guard:** extend `packages/themes/src/chart-palette.test.ts` with a
  fill-over-surface check: composite each `--cascivo-chart-N` at the theme's fill
  opacity over the theme's `--cascivo-color-surface` and assert a minimum
  chroma/contrast delta (define thresholds from the dataviz guidance; deterministic
  math, no snapshots).
- **Verify:** palette tests green; nightly visual suite re-baselined only for
  intentionally-changed charts.

### 5.2 Card flex-overflow — S

- `packages/components/src/card/card.module.css`: add `min-width: 0` (logical:
  `min-inline-size: 0`) to `.header` and `.footer` flex containers, and to any flex
  row inside `.content` the card owns. Do **not** remove `overflow: hidden` (it clips
  for `border-radius`); the surgical fix is letting flex children shrink.
- Add a note to the card doc/meta ("children in your own flex rows may need
  `min-inline-size: 0`") and, ideally, a regression: a component test asserting a
  long-label + badge footer doesn't exceed the card's client width.
- **Verify:** `vp run @cascivo/components#test`; visual suite unchanged except the
  fixed case.

### 5.3 Search width control — S

- Non-breaking: introduce `--cascivo-search-width` read by `.root`
  (`packages/components/src/search/search.module.css:6` →
  `inline-size: var(--cascivo-search-width, 100%)`). Document the token in
  `search.meta.ts` `tokens` array (then `pnpm regen`). Optionally also accept a
  `width?: string` prop mapped to the custom property inline style — decide by matching
  how sibling components expose sizing (check `input.meta.ts` first; stay consistent).
- **Verify:** component test: setting the property constrains the root; meta/doc regen
  drift-clean.

---

## Suggested PR grouping & order

1. **PR 1 (Wave 1.1 + 1.2 + the failing-then-skipped SSR check):** docs + vite-plugin
   `noExternal` + `scripts/checks/ssr-import.test.ts` landed as `todo`/warn. Unblocks
   adopters immediately, zero risk.
2. **PR 2 (Wave 2):** registry blocks + 404 rules + README channel docs. Self-contained
   generator/infra change; biggest AI-surface payoff after SSR.
3. **PR 3 (Wave 3):** props-parity check + same-name callouts + reactivity rewording +
   Tailwind consistency + llms-full prominence. All doc/generator; one `pnpm regen`.
4. **PR 4 (Wave 1.3):** the dist CSS decision (Option A recommended) + TanStack example
   + flip the SSR check to a hard gate. Carries the changeset/breaking note.
5. **PR 5 (Wave 4):** icons aliases + new SVGs + MCP tool + legend.
6. **PR 6 (Wave 5):** charts fill token + card `min-inline-size` + search width.

Every PR: `pnpm ready` green (regen → check --fix → build → typecheck → tests), commit
regenerated artifacts, `pnpm ready:ci` before push on PRs 1/4 (build-graph changes).

## Explicit non-goals (from triage — do not "fix")

- No `.meta.ts → .md` regeneration change is needed for the reported "drift" — none
  exists; the pipeline's manifest→markdown fidelity is already CI-enforced. The
  reporter's suggestion to "generate docs from `.d.ts`" is **not** adopted wholesale:
  manifests carry curated descriptions/examples that types can't express. Wave 3.1's
  parity *check* achieves the safety without losing curation.
- Do not remove `Spaceship` or rename icons to Lucide names — aliases only (renames
  break every existing consumer for zero functional gain).
- Do not add an SPA catch-all rewrite to `_redirects` — the 404.html + path-scoped
  rules are the correct Pages-native mechanism.
- Re-litigating the signals architecture is out of scope (also declined in
  `fix-plan-adopter-pair-2026-07.md`); Wave 3.3 is wording only.
