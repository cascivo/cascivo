# Fix plan — "Vercel-like dashboard" adopter feedback (2026-07)

**Status:** spec / not yet implemented. Hand-off to an implementer (Sonnet).
**Source:** external adopter who built a Vercel-style console with the CLI + registry.
**Scoring context:** adopter rated the result 7/10; blocking objections are the three
red flags below. This plan is ordered so **all three red flags are closed in Step 1**;
Steps 2–3 are non-blocking polish.

---

## 0. What actually happened (verified root causes)

The three complaints trace to **two** underlying defects and one **discoverability** defect.

### RC-1 — Registry source and published npm packages can skew (the real bug)

- Registry file URLs are served from the **mutable `main` branch**:
  `scripts/registry/generate.ts:27` → `BASE_URL = raw.githubusercontent.com/cascivo/cascivo/main`.
  So `cascivo add <x>` always copies **tip-of-`main`** source.
- npm packages (`@cascivo/i18n`, `@cascivo/core`, …) publish **only** when a changeset
  merges (`.github/workflows/release.yml:12-24`). Ordinary feature merges change `main`
  source **without** publishing.
- Registry entries record peer deps as **bare names, no version** —
  `scripts/registry/generate.ts:99,175` (`dependencies: string[]`), copied from
  `meta.dependencies` (e.g. `data-table.meta.ts:194` → `['@cascivo/core','@cascivo/i18n']`).
  The CLI installs them **unpinned** (`packages/cli/src/commands/add.ts:268-270,283-285`
  → `npm install @cascivo/i18n`, i.e. `@latest`).
- **Net effect:** copied `.tsx` = tip-of-`main`; installed peer = last-published npm.
  Nothing forces agreement. The single `version` field on every entry is
  `@cascivo/react`'s version (`generate.ts:136-141`), which carries **no** information
  about the i18n/core versions the copied code needs.

**Concrete manifestation (the DataTable crash).** `data-table.tsx:3` imports
`{ builtin, t }` from `@cascivo/i18n` and, at `data-table.tsx:108-118`, resolves 8
labels **unconditionally on every render** (not gated by the pagination prop), including
`t(builtin.dataTable.previousPage)` (line 116) and `t(builtin.dataTable.nextPage)`
(line 117). Those two catalog keys were added in i18n **0.2.0**
(`packages/i18n/CHANGELOG.md:11-20`; `packages/i18n/src/builtin.ts:60-69`). The adopter's
installed `@cascivo/i18n` was the published **0.1.11**, whose `builtin.dataTable` object
**lacks those two properties**. So `builtin.dataTable.previousPage === undefined`, and
`t(undefined)` dereferences `message.key` at `packages/i18n/src/messages.ts:64` →
**`TypeError: Cannot read properties of undefined (reading 'key')`**, thrown during render →
whole page unmounts. Passing an explicit `labels` object avoids it because `??` short-
circuits before the throwing `t(...)` call (line 116-117) — the adopter's workaround.

> Note the crash is **not** a missing *translation string* (those fall back to
> `message.value` at `messages.ts:64` and never crash). It is a **missing property on the
> `builtin` object** in an older package build. This distinction drives the fix.

**Publish-lag confirmation.** The repo's `packages/i18n/package.json:3` is `0.2.1` with
CHANGELOG entries for 0.2.0/0.2.1, but npm-latest was `0.1.11` — the 0.2.x versions were
changeset-versioned locally but effectively **not on npm** when the adopter installed.
Today's `main` happens to match published only by luck of merge ordering — there is **no
lock** that guarantees it.

### RC-2 — No guard catches the drift class

- The only integrity check, `scripts/registry/deps-check.ts` + `deps-graph.ts` (run in
  `regen`/CI), validates **relative** imports resolve within a component's
  `registryDependencies` (the earlier "missing `use-popover`" bug). It does **not**
  validate npm-package symbol usage (`builtin.*` keys) against the installable version.
- `grep 'builtin\.' scripts/` hits only `backlog.json` → **no check** cross-references
  component i18n-key usage against `packages/i18n/src/builtin.ts` or the published version.
- `cascivo drift` is a **stub**: `packages/cli/src/commands/drift.ts` prints
  "not yet implemented".
- The i18n `builtin` catalog is **hand-authored**, not codegen'd
  (`scripts/catalog/generate.ts` is the *token* catalog, unrelated), so a developer can
  add a `t(builtin.x.y)` usage and forget the catalog key with nothing failing CI.

### RC-3 — Docs discoverability (the "installation 404")

- Docs app is `apps/site/` (**not** `apps/docs/` — that path in README/CLAUDE.md is stale).
- **There is no `installation` route.** Install content lives at `/docs/getting-started`
  (`apps/site/src/pages/GettingStartedPage.tsx`). A guessed `/docs/installation` falls
  through `pageFor()` (`apps/site/src/DocsApp.tsx:122-141`) to
  `<ComponentPage name={undefined}>` → `getComponent('')` → renders a confusing
  `<h1>Not found</h1>` component page. `/installation` hits the marketing 404.
- `/docs/getting-started` is itself **effectively hidden from crawlers**: absent from
  `apps/site/src/seo.ts` `ROUTE_HEAD` (→ served `noindex`, title "Not found — cascivo
  docs") and absent from `scripts/sitemap/generate.ts:36-54` `DOCS_STATIC_ROUTES` (which
  also omits `/docs/api`, `/docs/editor`, `/docs/tokens`, `/docs/marketplace`,
  `/docs/playground`, `/docs/perf/data-table`).
- Component metas are **rich** (props with CI-enforced descriptions via
  `scripts/registry/docs-coverage.ts`, tokens, examples, full `intent`), but
  `ComponentPage.tsx` never renders the `intent` block, and there is no dedicated theming
  guide (`ThemePage.tsx` is a 1.4 KB stub). So the "sparse API reference" complaint is
  fixable with **rendering**, not new source data.

---

## STEP 1 — Close all three red flags (blocking)

Step 1 has three workstreams (1A/1B/1C). All must land before this is called done.
Do 1A first (it unbreaks clean installs), then 1B, then 1C.

### 1A. Version-lock the registry to published packages (Red flag #1)

Five layers: (i) immediate remediation, (ii) structural pin, (iii) runtime safety net,
(iv) CI drift guards, (v) CLI verification. (ii) is the primary structural fix; the rest
are defense-in-depth so this class can never silently ship again.

#### 1A-i. Immediate remediation — publish the lagging packages

Goal: make `cascivo add data-table` work on a clean install **today**.

1. Determine, for each Tier-1 package a registry component depends on (`@cascivo/i18n`,
   `@cascivo/core`, `@cascivo/tokens`, `@cascivo/themes`, `@cascivo/react`), the
   **latest version actually on npm** vs the workspace `package.json` version.
2. For any package whose `main` source is ahead of npm (at minimum `@cascivo/i18n`
   0.2.x with the `dataTable.previousPage/nextPage` keys), stage a changeset and let
   `release.yml` publish so npm-latest ≥ the version `main`'s registry source requires.
3. **Acceptance:** in a scratch dir, `npm init -y`, install the just-published
   `@cascivo/i18n`, and confirm `require('@cascivo/i18n').builtin.dataTable.previousPage`
   is defined. Then run the clean-room render test in 1A-iv.

#### 1A-ii. Pin registry file URLs to the released commit (primary structural fix)

The skew exists because registry URLs point at `main` (moving) while npm points at the
last release (fixed). Eliminate the skew by pointing registry file URLs at the **immutable
release commit** instead of `main`.

- Change the release pipeline so that when it regenerates `registry.json` for publish, it
  sets `REGISTRY_BASE_URL=https://raw.githubusercontent.com/cascivo/cascivo/<release-sha>`
  (the SHA being published), so the committed `registry.json` on `main` serves component
  source from the **same commit whose packages were published to npm**.
  - `scripts/registry/generate.ts:27-29` already reads `REGISTRY_BASE_URL`; no code change
    needed there beyond confirming the host allowlist (`ALLOWED_URL_HOSTS`,
    `generate.ts:278-279`) still matches `raw.githubusercontent.com/cascivo/cascivo/...`
    (it does — the regex is branch/SHA agnostic).
  - Wire the SHA into the release step in `.github/workflows/release.yml` (around the
    "Verify generated docs" step, lines 61-69, and the changesets publish step 71-80) so
    the regenerated + committed `registry.json` carries the release SHA. The `drift` gate
    on PRs (which regenerates with the default `main` base) must be reconciled — see
    "Reconciling the drift gate" below.
- **Effect:** between releases, `main`'s `registry.json` points at the last *released*
  SHA. `cascivo add` therefore always copies source that matches the published npm
  packages **by construction**. The tip-of-`main`-vs-npm skew is structurally impossible.

**Reconciling the drift gate.** The PR-time drift check (`release.yml:61-69` and the CI
`drift` job) runs `pnpm regen` and asserts no diff. If `regen` defaults `BASE_URL` to
`main` but release commits SHA-pinned URLs, the committed file will "drift" on every PR.
Resolve by making the **URL host+path stable and the ref a separate, non-diffed concern**:
recommended approach — store the pinned ref in one place (e.g. a committed
`registry.base.json` / an env the drift job also sets) so `regen` is deterministic in both
PR and release contexts. Implementer picks the mechanism; **acceptance is that
`pnpm regen && git diff --exit-code` passes in CI both on ordinary PRs and at release**,
and that a freshly published registry's file URLs resolve to the released SHA.

> If SHA-pinning the drift gate proves too invasive for this step, ship 1A-iii + 1A-iv +
> 1A-v (which fully neutralize the *symptom* and catch the class in CI) and track the
> URL-pin as the first item of Step 2. Do **not** drop 1A-iii/iv/v in favor of only the pin.

#### 1A-iii. Runtime safety net — `t()` must never white-screen on drift

Even with perfect release hygiene, a user can upgrade one package and not another. A
missing catalog key must **degrade**, not crash the page.

- `packages/i18n/src/messages.ts:61-74` `t()`: guard against an `undefined`/malformed
  `message`. If `message` is nullish (or has no `key`), return an empty string (or the
  namespace-less key if available) instead of dereferencing `message.key`.
  - Keep the existing signal subscription (`void catalogVersion.value`) intact.
  - Do **not** change the happy path or the plural/interpolation logic.
- Rationale: an aria-label silently becoming `''` is a minor a11y degradation; a
  `TypeError` during render is a full page crash. Prefer the former as a last resort.
- **Acceptance:** a unit test in `packages/i18n/src/messages.test.ts` asserting
  `t(undefined as never)` returns a string and does not throw; existing tests still pass.

#### 1A-iv. CI drift guards — catch the class before merge

Add two checks, wired into `regen`/`meta:check`/`ready` and CI:

1. **i18n key-coverage check** — new `scripts/checks/i18n-keys.test.ts` (node:test, run via
   a new `pnpm i18n:check`, added to the `regen`/`ready` chain and CI `drift`/`meta:check`).
   - Statically scan every registry-shipped source root (start with
     `packages/components/src`; extend to `packages/layouts/src`, `packages/charts/src`,
     `packages/editor/src`, `packages/flow/src` — the roots in `generate.ts:42-86`) for
     `builtin.<ns>.<key>` member expressions (and `t(builtin.<ns>.<key>...)`).
   - Assert every referenced `<ns>.<key>` exists in `packages/i18n/src/builtin.ts`'s
     `builtin` object. Fail (exit 1) listing any missing key, with the file:line of the
     usage. This makes "component references a catalog key the package lacks" a **red CI**,
     not a runtime crash.
   - This passes today (source is in sync) — it's a **regression fence**.

2. **Clean-room render smoke** — extend the standalone smoke concept
   (`scripts/registry/standalone-smoke.ts`, `SUBJECTS` at line 31 already includes
   `data-table`) with a runtime check: in a throwaway install using the **published**
   `@cascivo/i18n`, render `DataTable` (and other i18n-consuming subjects) with **no
   `labels` prop** and assert no throw. Can be a Vitest/JSDOM test in
   `packages/components` or a CI job step. This is the exact scenario the adopter hit.
   - **Acceptance:** the test reproduces a red result when pointed at i18n 0.1.11 and green
     against the version published in 1A-i.

3. **Release lockstep gate** — in `release.yml` (or a `pnpm release:check` extension,
   `scripts/checks/release-filter.test.ts`), assert that for every Tier-1 package a
   registry component depends on, the version the registry serves (post-1A-ii, the release
   SHA's `package.json` version) is **≤ the version being published**. Equivalent
   invariant: the registry never advertises source requiring an unpublished package
   version. Fail the release otherwise.

#### 1A-v. Registry version-floor metadata + CLI verify (defense in depth)

Independent of the URL pin, record and enforce minimum peer versions.

- **Registry generator** (`scripts/registry/generate.ts`): for each entry, resolve
  `meta.dependencies` package names to a concrete floor by reading each workspace
  `package.json` version, and emit a new field, e.g.
  `peerVersions?: Record<string, string>` (`{ "@cascivo/i18n": ">=0.2.0", ... }`).
  - Extend the `RegistryComponent` interface (`generate.ts:88-105`) and the buildEntry
    logic (`generate.ts:166-177`). Keep `dependencies: string[]` for back-compat; add the
    map alongside it.
  - No change to `ComponentMeta` (`packages/core/src/types.ts:99`) is required — the floor
    is derived at generation time from workspace versions, not hand-authored. (If a
    component needs a *higher* floor than the current workspace version, that's a separate,
    rare case; skip unless needed.)
- **CLI** (`packages/cli/src/utils/registry.ts` `RegistryComponent`/`parseRegistry`
  lines ~16, 48-101): carry `peerVersions` through parsing (currently dropped).
- **CLI `add`** (`packages/cli/src/commands/add.ts:268-285`): after copying files, when
  installing peers, pass the floor to the install (`@cascivo/i18n@>=0.2.0`) and/or, after
  install, read the installed version and **warn/error** if it doesn't satisfy the floor,
  with an actionable message ("data-table needs @cascivo/i18n ≥ 0.2.0; found 0.1.11 — run
  `npm i @cascivo/i18n@latest`"). Prefer a hard error to a silent broken install.
  - `installCommand` (`packages/cli/src/utils/config.ts:108-111`) takes bare names today;
    thread version specifiers through.
- **`cascivo drift`** (`packages/cli/src/commands/drift.ts` — currently the stub): implement
  it to compare installed peer versions against the lockfile/registry floors and copied
  file hashes (`fileHashes` already recorded, `add.ts:265,272-277`) against registry
  hashes, reporting any mismatch. This gives adopters a self-serve diagnosis for exactly
  this failure.

**1A acceptance (all must hold):**
- Clean-room `cascivo add data-table` on an empty project → renders with **no `labels`
  prop** and no crash, against whatever the CLI installs.
- `pnpm i18n:check` green; deliberately deleting a `builtin.dataTable` key turns it red.
- `pnpm regen && git diff --exit-code` green in PR and release contexts.
- `cascivo drift` reports clean on a correct install and flags a forced version mismatch.

### 1B. Docs maturity — installation + discoverability (Red flag #2)

1. **Add the installation route.** Add `/docs/installation` to `DOCS_ROUTES`
   (`apps/site/src/DocsApp.tsx:57-83`). Either (a) a new `InstallationPage.tsx` focused on
   `cascivo init` / `cascivo add` / peer setup, or (b) an alias/redirect to a
   restructured getting-started. **Recommended:** split the current `GettingStartedPage`
   into a focused **Installation** page (init, add, required peer packages incl. the i18n
   note) + a **Getting Started** walkthrough; add an "Installation" item to the docs
   sidebar `exploreItems` (`DocsApp.tsx:85-109`, currently only "Getting Started" at :86).
2. **Redirect the guessed URLs.** `/installation` (marketing) → 301/redirect to
   `/docs/installation`; ensure `/docs/installation` is a real page, not a fall-through.
3. **Fix the 404 fall-through.** `pageFor()` (`DocsApp.tsx:122-141`) currently returns
   `<ComponentPage>` with an undefined name for any unmatched `/docs/*`. Make unmatched
   docs routes render a proper **NotFound** (reuse `marketing/pages/NotFound.tsx` or a docs
   equivalent) with correct noindex + a helpful "did you mean getting-started/installation"
   link — not a confusing component page.
4. **Fix SEO + sitemap indexing.** Add `/docs/getting-started`, `/docs/installation`,
   `/docs/api`, `/docs/editor`, `/docs/tokens`, `/docs/marketplace`, `/docs/playground`,
   `/docs/perf/data-table` to:
   - `apps/site/src/seo.ts` `ROUTE_HEAD` (:21-121) so they get real titles/descriptions
     and are indexable (not the `noindex` unknown-route branch, :234-252).
   - `scripts/sitemap/generate.ts` `DOCS_STATIC_ROUTES` (:36-54).
5. **Add an indexing guard.** New check (fold into `pnpm links:check` /
   `scripts/quality/landing-links.ts` or a small node:test): assert **every** `DOCS_ROUTES`
   key has a `ROUTE_HEAD` entry **and** a sitemap entry. This prevents a route from ever
   again shipping as a hidden `noindex` page. Wire into CI.
6. **Richer API reference (addresses "sparse API reference").** Render the `intent` block
   (`whenToUse`/`whenNotToUse`/`antiPatterns`/`related`/`flexibility`) on
   `ComponentPage.tsx` — the data already exists in every meta and is only shown on
   `/docs/context`. Add a dedicated **Theming** guide (flesh out the `ThemePage.tsx` stub
   or add `/docs/theming`) covering `data-theme`, token override layers, and mapping custom
   fonts (the adopter praised this — make it discoverable).

**1B acceptance:**
- `/docs/installation` renders real content; `/installation` redirects to it.
- Guessing any bad `/docs/*` URL shows a helpful NotFound, not a component-not-found page.
- New route-indexing guard green; getting-started/api/installation appear in the sitemap
  and are served indexable (not "Not found — cascivo docs").
- ComponentPage shows intent/anti-patterns; a theming guide is linked from the sidebar.

### 1C. Version-story / trust hygiene (Red flag #3)

Being 0.1.x is inherent and not "fixable", but the trust erosion came from the drift
(closed by 1A) and from stale/confusing repo signals. Actionable items:

1. **Publish a stability & versioning statement** in docs (e.g. a section on the
   Installation/Getting Started page or FAQ): semver policy, that registry source is pinned
   to released packages (post-1A-ii), and how to pin/upgrade. Turns "low version numbers"
   from an unknown risk into a documented posture.
2. **Fix stale repo references** that undermine credibility during evaluation:
   - README/CLAUDE.md reference `apps/docs/` — it doesn't exist (it's `apps/site/`).
     Correct these (CLAUDE.md monorepo-structure section and the AI-layer table row
     "`apps/site/` (docs routes)" is right; the top structure block still says
     `apps/docs/`).
   - CLAUDE.md:~315 claims docs are "Markdown … generated from manifests" — inaccurate;
     doc pages are hand-authored TSX rendering `registry.json` at runtime. Correct the
     wording.
3. **(Optional, recommended) Align the versioning surface** so the registry's advertised
   `version` (currently `@cascivo/react`'s) is documented as "library version" and the
   per-entry `peerVersions` (1A-v) is the compatibility truth — so a low number on one
   package no longer implies the whole system is behind.

**1C acceptance:** docs state the versioning/stability policy; no repo doc references a
nonexistent `apps/docs/` or claims markdown doc-page generation.

---

## STEP 2 — Non-blocking hardening (post-red-flag)

From "what didn't go well" residue and the existing internal audit
(`docs/internal/feedback/audit-ai-first-adopter-2026-07.md:170-199`):

1. If 1A-ii's URL-pin was deferred, do it here (the highest-leverage structural fix).
2. **In-repo onboarding markdown.** Add `getting-started`/`installation` markdown to the
   repo (not only the site page) so agents and GitHub readers find it. Thin package
   READMEs (`@cascivo/i18n`, `@cascivo/core`, `@cascivo/cli`) get real quick-starts.
3. **Troubleshooting + framework guides.** A troubleshooting page (lead with the i18n
   version-mismatch symptom + `cascivo drift`), and a Next.js/RSC + SSR setup guide.
4. **Broaden drift coverage.** Extend the 1A-iv i18n-key check and clean-room render smoke
   to layouts/charts/editor/flow roots and more `SUBJECTS`.

---

## STEP 3 — Optional polish

1. Per-prop deep content beyond meta descriptions where warranted.
2. Consider generating static per-component MDX/HTML at build for SEO (today pages render
   registry JSON at runtime) — only if crawlability of component pages proves insufficient.

---

## Files touched (index)

**Step 1A**
- `.github/workflows/release.yml` (SHA-pinned registry regen; lockstep gate) — 1A-ii/iv
- `scripts/registry/generate.ts` (BASE_URL ref handling; `peerVersions` emit) — 1A-ii/v
- `packages/i18n/src/messages.ts` (+ `messages.test.ts`) — 1A-iii
- `scripts/checks/i18n-keys.test.ts` (new) + `package.json` `i18n:check`/`regen`/`ready` — 1A-iv
- `scripts/registry/standalone-smoke.ts` (or new render smoke) — 1A-iv
- `scripts/checks/release-filter.test.ts` (lockstep) — 1A-iv
- `packages/cli/src/utils/registry.ts`, `packages/cli/src/commands/add.ts`,
  `packages/cli/src/utils/config.ts`, `packages/cli/src/commands/drift.ts` — 1A-v

**Step 1B**
- `apps/site/src/DocsApp.tsx` (route, sidebar, fall-through)
- `apps/site/src/pages/InstallationPage.tsx` (new) + `GettingStartedPage.tsx` (split)
- `apps/site/src/pages/ComponentPage.tsx` (render `intent`)
- `apps/site/src/pages/ThemePage.tsx` (or new `/docs/theming`)
- `apps/site/src/seo.ts` (`ROUTE_HEAD`), `scripts/sitemap/generate.ts` (`DOCS_STATIC_ROUTES`)
- marketing redirect for `/installation`; new route-indexing guard

**Step 1C**
- `README.md`, `CLAUDE.md` (stale `apps/docs/`; docs-generation wording)
- docs stability/versioning section

---

## Gate before done (per CLAUDE.md)

Run `pnpm ready` (regen → `vp check --fix` → brand/claims/release/meta checks → build →
type check → tests) plus the new `pnpm i18n:check` and route-indexing guard. For build-
ordering safety after registry/CLI changes, run `pnpm ready:ci`. All must exit 0, and
`pnpm regen && git diff --exit-code` must be clean.
