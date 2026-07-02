# Adoption audit — red flags, doc gaps, and missing pieces (AI-first developer perspective)

**Date:** 2026-07-02
**Method:** Fresh-eyes audit of the repo + live testing of the published npm CLI (`npx cascivo@latest`)
from a clean directory, plus four parallel deep dives (docs, CLI/distribution, AI layer,
component/site reality). Everything below was verified against files or observed behavior —
file paths included.

The lens: "This must become the most popular UI library ever, so everything around it must
just work." Findings ordered by how badly they break that promise.

---

## 1. Critical — trust-breaking claims

### 1.1 The site claims accessibility testing that never happened

`apps/site/src/marketing/pages/AccessibilityStatement.tsx:64-72` advertises
"**Representative manual AT testing across 12 components and 4 stacks** (NVDA/Chrome,
JAWS/Chrome, VoiceOver/Safari, TalkBack/Chrome)" and `WhyCascadePage.tsx:105` says the matrix
"documents tested components." The underlying data (`docs/specs/at-matrix.md`) has **48 result
cells and every single one reads "— not tested."** `docs/ROADMAP-V14.md:157` even admits it.
The README highlight also lists "an AT support matrix (NVDA / JAWS / VoiceOver)" as an earned
feature. A false accessibility claim is the single fastest way to lose enterprise adopters —
and under the EAA (which the same page cites via `docs/specs/legal-mapping.md`) it has legal
exposure. Either do the testing or reword to "matrix scaffolded, testing pending."

### 1.2 "Zero axe violations across all components in CI" — the gate covers 4 page states

`AccessibilityStatement.tsx:80` claims zero axe violations across **all components**. The
actual CI gate (`apps/bench/runner/src/a11y.ts`, wired in `.github/workflows/bench.yml:40-41`)
runs `@axe-core/playwright` on exactly four bench states (`/table`, `/table@1k`, `/form`,
`/dialog`). Not 191 components. Either sweep every component (Storybook axe run) or scope the
claim.

### 1.3 The two getting-started examples are empty shells

`apps/examples/react-vite/` and `apps/examples/react-next/` contain only `README.md`,
`package.json`, `readme.body.md`. No `src/`, no `index.html`, no `app/`. Build scripts are
`echo 'example: app source added in a later plan'`. These are the first two directories a new
adopter opens (and `docs/COMPATIBILITY.md` points at `apps/examples/react-vite` as the
"reference setup"). Meanwhile the bespoke marketing demos (`deploy`, `track`, `flow`, `pulse`)
are fully built — the showcase is polished, the on-ramp is missing.

### 1.4 `cascivo doctor` fails on cascivo itself — for two different reasons

Running the published `npx cascivo doctor` against this repo yields 7 findings:

- **4 real violations** of the library's own non-negotiable i18n rule ("never hardcoded
  English"): `combobox.tsx:242` (`aria-label="Search options"`), `data-table.tsx:557,568`
  (`"Previous page"` / `"Next page"`), `dock.tsx:20` (`"Main navigation"`),
  `steps.tsx:33` (`"Steps"`).
- **3 false positives**: the `no-react-hooks` analyzer string-matches comments —
  `log-viewer.tsx:152` and `scroll-area.tsx:31` mention `useState`/`useEffect` in comments
  and get flagged. Doctor needs to be AST-aware (or at least strip comments) before anyone
  can put it in CI.

### 1.5 Release bug: `@cascivo/flow` is published but excluded from the release build

`build:release` in the root `package.json` filters 12 packages — `@cascivo/flow` (public,
v0.1.5, has a changelog, npm badge in the README) is not among them. `pnpm release` =
`build:release && changeset publish`, so a release would publish flow with a stale or missing
`dist/`.

---

## 2. CLI / distribution — the "it just works" gaps

Live-tested against the published npm package:

1. **`cascivo <command> --help` doesn't exist**, despite the top-level help advertising it
   ("Run \"cascivo <command> --help\" for details"). `cascivo init --help` starts running
   init; `cascivo add --help` tries to install a component literally named `--help`. For the
   AI-agent audience this is lethal — agents probe `--help` first.
2. **The CLI reports version `0.0.0`.** `VERSION = '0.0.0'` is hardcoded in
   `packages/cli/src/index.ts:16` while the package is 0.2.0. `--version` lies.
3. **`add button` in a fresh project produces an unstyled component with no warning.** It
   installs `@cascivo/core` + `@cascivo/i18n` but never mentions `@cascivo/tokens`/`themes`;
   the copied `button.module.css` reads 26 un-fallbacked `--cascivo-*` custom properties.
   First-five-minutes outcome: a broken-looking button and no hint why.
4. **`init` is interactive with no documented non-interactive mode**, and its theme prompt
   offers "(light/dark/warm)" — 3 of the 12 actual themes. Agents can't drive it; humans get
   a stale list.
5. **Old codename leaks into user projects**: the lockfile written into consumer repos is
   `cascade.lock` (not `cascivo.lock`); the HTTP cache dir is `~/.cascade/cache`; the MCP bin
   is `cascade-mcp`; CF Pages projects are `cascade-ui-*`.
6. **Everything is version `0.0.0` in the registry** (file version and all 191 entries), and
   component files are fetched from `raw.githubusercontent.com/.../main/...`. Consequences:
   `cascivo update --check` version comparison is inert, installs are a moving target with no
   pinning or rollback, and every install depends on the repo staying public on `main`.
7. **The high-traffic commands bypass the good HTTP stack.** `utils/http.ts` has caching,
   4 retries, timeouts — but `list`, `add`, and `update` use bare `fetch()`
   (`utils/registry.ts:128-134`, `commands/add.ts:20-26`). Offline or on a flaky network,
   the flagship commands fail instantly with no cached fallback.
8. **Partial installs are recorded as success**: `add.ts:251-253` swallows per-file fetch
   failures with a `console.warn` and still writes the lockfile entry.
9. **`cascivo build` is documented (`packages/cli/README.md:34`) but doesn't exist** — the
   real command is `cascivo registry build`.
10. **Templates are advertised but absent from the default registry.** `registry.json` has 0
    `type:"template"` entries; the three seed templates live only in
    `templates/cascivo-registry.json`, consumed by the marketplace generator — so
    `cascivo create --template dashboard` against the default registry fails.
11. **Three domains in play** in registry/config: `cascivo.com` (config default),
    `cascivo.dev` URLs, and `example.com` placeholders inside `registry.json` entries.
12. Undocumented commands: `tokens import` exists but appears in no help or README;
    `eject`, `generate`, `doctor --drift`, `theme add` exist only in `--help`.

---

## 3. AI layer — the core value prop, audited claim by claim

The manifests, generators, and `audit --ai` are genuinely strong. The delivery to an
*external* AI user is where it breaks:

1. **`npx -y @cascivo/mcp` ships only `registry.json`** (`packages/mcp/package.json:45`,
   `files: ["dist"]`). `get_tokens`, `get_context`, `get_variant_matrix`,
   `validate_component` need `tokens.catalog.json` / `context.json` / `tokens.variants.json`
   and fall back to fetching `cascivo.com` — network-dependent tools in an offline-capable
   protocol.
2. **`list_templates` / `get_template` silently return an empty catalog for every external
   user** — `marketplace.json` isn't bundled and `packages/mcp/src/templates.ts` has no
   network fallback. This is a straight bug, not a degradation.
3. **The context layer is blind to 66 of 191 registry entries.** `context.json` and
   `select_component`/`get_context` only cover `type:"component"` (125). Charts, layouts,
   blocks, flow, editor, section have no when-to-use intent at all.
4. **Manifest holes**: all 11 block manifests lack `intent`; 15 manifests have
   `examples: []`; 14 have `props: []`. Blocks — the highest-leverage things for agents to
   scaffold — have the thinnest machine context.
5. **12 orphaned block metas**: `packages/components/src/blocks/*` has 12 `*.meta.ts`
   (marketing-hero, pricing, auth-login, dashboard-*, …) that are **not in `registry.json`**
   — uninstallable and invisible to every AI surface. Plus `flow-canvas.meta.ts` (flow: 10
   metas on disk, 9 registered).
6. **No machine-readable versioning/breaking-change surface.** Registry versions are all
   `0.0.0`, `.meta.ts` has no version field, and changesets aren't exposed to MCP/context.
   An agent cannot detect API drift between library versions.
7. **README says every component ships `component.meta.ts`** — the actual filename is
   `<name>.meta.ts`. Zero files named `component.meta.ts` exist; an agent grepping for the
   documented name finds nothing. (CLAUDE.md's schema section has the same stale name.)
8. **Two skills point at a path that doesn't exist**: `skills/cascivo-design-page/SKILL.md:30`
   and `skills/cascivo-extend/SKILL.md:18` tell agents to read `apps/docs/public/llms.txt` —
   there is no `apps/docs`; it's `apps/site/public/llms.txt`.
9. **README's repo tree mislabels `packages/ai`** as "AI context layer — context.json, token
   catalog, audit." It's actually AI-*UI* components (`StreamingText`, `AiChat`, `Terminal`) —
   and it's `private: true` / `0.0.0`, so the advertised AI-native components aren't
   installable at all.
10. Prop types in manifests are raw TS-union strings (`"'sm' | 'md'"`), re-parsed by
    `grammar.ts` — no structured JSON schema for tools that can't run that parser.
11. Code fetches `cascivo.com/...` while docs advertise `docs.cascivo.com/llms/...` — two
    hostnames hard-coded in different places for the same artifacts.
12. Underselling (fix the docs, not the code): the MCP server actually implements **20
    tools**, not the 7 the README lists.

---

## 4. Documentation — self-contradictions and gaps

### Numbers that disagree with each other

| Claim | Where | Reality |
| --- | --- | --- |
| "165 components … 16 charts" | `readme.body.md:9` → README Highlights | 191 registry items, 25 charts |
| "191 components" | README badge + component table (generated) | correct (aggregate of 5 packages; `packages/components` itself = 125) |
| "14 themes" | README badge + highlights | **12** real themes; the site injects **13** (`vite.config.ts:30-37` counts `tailwind.css`); `ChartShowcase.tsx:92` hardcodes "All 12 themes." Four sources, three numbers, none say 14. |
| Repo tree lists `apps/docs/`, `apps/landing/` | README:133-142 | Neither exists (consolidated into `apps/site`); the Apps table later in the same README is correct |
| Storybook "stories generated from every component manifest" | README:261 | 119 committed stories ≈ 60% of registry items |

The lesson: hand-written `readme.body.md` prose sits next to generated numbers with no drift
check. Add the counts to `regen` (or a CI assertion) so prose can't rot.

### Missing docs a serious adopter looks for

- No root `CHANGELOG.md` (per-package changelogs exist, but no aggregate release history).
- No in-repo getting-started/installation markdown — only the site page
  (`apps/site/src/pages/GettingStartedPage.tsx`). Agents and GitHub readers can't find it.
- No written Next.js/RSC/SSR guide (one FAQ entry in `guides/data.ts` is all there is).
- No FAQ/troubleshooting markdown, no TypeScript-setup doc, no consumer testing guide
  (how do I test components that use signals? jsdom quirks? `useSignals`?).
- No upgrade guides except one orphaned `docs/v37-CONSUMER-CHANGES.md`.
- No `docs/README.md` index — and the docs tree needs one badly, because…

### The docs tree is polluted with internal artifacts

`docs/` mixes adopter guides with **58 `ROADMAP-V*.md` files**, `docs/superpowers/plans/`
(100+ internal tranche plans), `docs/specs/` mobile audits, `docs/feedback/*` migration
notes, `merge-plan.md`, and `t4-color-audit.txt`. `docs/ROADMAP.md` still claims to be "the
ground truth" while being superseded by 58 later files and still titled "# cascade".
Move internal planning out of `docs/` (or into `docs/internal/`) and leave a curated,
indexed set of adopter docs.

### Stale / wrong content

- `docs/RELEASING.md`: "All ten package names are unpublished" — all are live on npm.
- `FEATURES.md` (repo root): internal Carbon-cloning blueprint with raw LaTeX (`$0\text{ms}$`),
  npm commands in a pnpm repo, and a reference to `scripts/factory-supervisor.sh` which
  doesn't exist. Shouldn't greet visitors at the root.
- Old "cascade" branding survives in `BENCHMARKS.md` (title + `apps/bench/app-cascade`),
  `docs/ROADMAP.md`, `docs/THEMING.md`, `docs/MIGRATING-FROM-SHADCN.md`.
- `packages/search/README.md` is a 21-line empty stub (only package with no
  `readme.body.md`); `ai` (33), `themes` (35), `layouts` (39) are thin.
- npm READMEs reference `CSS-LAYERS-PITFALL.md` / `TOKENS.md` as bare filenames — dead ends
  on npmjs.com.

---

## 5. Library completeness

- `packages/search`: 2 source files — near-stub, yet listed alongside finished packages.
- `packages/video`: 26 source files, **1 test file** — effectively untested.
- CI gaps: `ci.yml` runs on `pull_request` only (push-to-main verify commented out);
  `visual.yml.disabled` — visual regression exists but is off; the registry-count guard
  asserts only `>= 49` (current: 191 — a mass-deletion regression to 50 would pass).

## 6. What's genuinely strong (for calibration)

Not everything is a red flag — several claims survived hostile verification:

- All four public domains (`cascivo.com`, `docs.cascivo.com`, `storybook.cascivo.com`,
  `llms.txt`) are live; all 13 advertised packages are on npm; changesets + npm trusted
  publishing (OIDC provenance) are wired.
- **All 125 components have tests; zero skipped tests** anywhere in components/charts.
- `cascivo add button` from a cold directory resolves dependencies (spinner), installs npm
  deps, writes a hash lockfile — genuinely frictionless.
- `cascivo audit --ai` is real and useful (hardcoded-value/unknown-prop/missing-prop/raw-string,
  `--fix`, `--json`).
- Generated artifacts (`llms.txt`, `context.json`, `tokens.catalog.json`) are in sync
  (same `generatedAt`, one `regen` chain).
- The landing page dogfoods the library and avoids fake social proof.

## 7. Suggested priority order

1. Fix the AT-matrix and axe claims on the site (§1.1, §1.2) — honesty first.
2. Ship the react-vite and react-next examples (§1.3) — the on-ramp.
3. Fix the four hardcoded aria-labels + make doctor AST-aware (§1.4).
4. Add `@cascivo/flow` to `build:release` (§1.5).
5. CLI polish wave: per-command `--help`, real `--version`, theme hint after `add`,
   non-interactive `init`, `cascivo.lock` rename (§2.1-2.5).
6. Bundle MCP data files or add the missing network fallback (§3.1-3.2).
7. Version the registry (real versions, tagged raw URLs) (§2.6).
8. One drift-checked source for all counts; clean the docs tree; add the missing guides (§4).
