# cascivo internal audit (read-only), as of 2026-10-17

Repo: /home/user/cascivo, HEAD d0f3e44f (2026-10-16). The clone is SHALLOW (50 commits, oldest 2026-09-25), so
"since 2026-09-24" is the entire visible history; work before that (e.g. the 7.1/7.2 follow-up commit) is judged from code state, not hashes.
Of the 50 commits, ~34 are bot chores ("marketplace rebuild", "merge AT sweep", "screenshots", "Version Packages").

## 1. Inventory

### 1.1 Headline numbers
| Thing | Value | Evidence |
|---|---|---|
| Registry version | 1.9.0 (market analysis saw 1.3.1) | registry.json, generatedAt 2026-10-09 |
| Registry items | 214 = 147 component + 25 chart + 14 layout + 10 flow + 10 block + 6 section + 2 editor | `registry.json` .components by type |
| Extra | 12 page blocks (`blocks`), 3 marketplace templates (dashboard, auth, landing) | registry.json `.blocks/.templates`, apps/site/public/marketplace.json |
| Packages | 33 dirs in packages/: 27 published, 6 private (components, layouts, search, theme-kit, video, workbench) | each package.json |
| Test files | ~689 `*.test.ts(x)` under packages/apps/scripts | find |
| Themes | 12 (light, dark, warm, flat, minimal, midnight, pastel, brutalist, corporate, terminal, arcade, cyberpunk) + light-dark.css, all.css, tailwind.css | packages/themes/src |
| i18n locales | 2 built in: en, de (73 de catalogs in builtin.ts) | packages/i18n/src/builtin.ts, README |
| Font | none bundled; system stack (`ui-sans-serif, system-ui, ...`; mono `ui-monospace, SF Mono...`), `--cascivo-font-display` aliases sans | packages/tokens/src/index.css:117-124 |
| CLI commands | 18: create, init, add, list, update, search, view, theme (add/create), eject, generate, doctor, audit, mcp (init), app (add/upgrade), registry (build), template (init), tokens (import), email (lint) | packages/cli/cmdspec.json |
| `create --framework` | react-vite (default), astro, cloudflare (+ `--runtime preact|react`, `--example`, `--auth`) | cmdspec / create.ts:4109 |
| MCP tools | 28 registered (README says 26): list_registries, list_components, get_component, search_components, add_to_project, lint_email, list_templates, get_template, add_template, create_app, list_blocks, compose_app, deploy_preview, create_theme, scaffold_page, validate_view, render_view_as_markdown, scaffold_view, scaffold_flow, get_view_grammar, get_tokens, search_icons, get_variant_matrix, validate_component, list_guides, get_guide, get_context, select_component | packages/mcp/src/server.ts |
| Skills | 8: cascivo-add, -add-template, -create-theme, -design-page, -email, -extend, -migrate-from-shadcn, -share-preview (+ `factory` dev skill) | skills/ |
| Examples | 17 dirs: astro-islands, chat, deploy, flow, ghost-theme, json-playground, kit, pay, pulse, react-next, react-vite, react-vite-ssr, registry-starter, stage, template-starter, track, trade | apps/examples |
| Starters | cloudflare, cloudflare-agent, cloudflare-board, cloudflare-crud, shop, stage | starters/ |
| Apps | site (Preact), storybook, live, bench/{agent,app-carbon,app-cascade,app-shadcn,runner} | apps/ |
| AI artefacts (apps/site/public) | llms.txt 80 KB (was 105 KB), llms-full.txt 688 KB, context.json 1.3 MB, tokens.catalog.json, tokens.variants.json, icons.catalog.json, specs/boundaries/exceptions/audit-contract JSON, breaking-changes.json, DESIGN.md (root + public), tokens/dtcg/{cascivo.tokens.json, cascivo.resolver.json, themes/}, 227 files in r/shadcn (shadcn-schema projection), Storybook components-manifest (apps/storybook/.storybook/main.ts:13), per-component llms/ + context/ | listing |
| Docs | 45 files in docs/ incl. 8 USING-WITH-*.md, GOVERNANCE, ENTERPRISE-READINESS, 60 ROADMAP-V*.md in docs/internal, 21 docs/plans | ls |

### 1.2 Packages (version, published?, maturity)
- `@cascivo/core` 1.9.0 pub: micro-FSM + signals hooks; 32 test files. Lockstep 1.x family.
- `@cascivo/react` 1.9.0 pub: prebuilt distribution; only 3 test files in-package (components are tested in `@cascivo/components`, 195 test files).
- `@cascivo/components` / `@cascivo/layouts` private: registry source (195 / 32 test files).
- `@cascivo/charts` 1.9.0 pub: 25 zero-dep chart types, 70 tests.
- `@cascivo/flow` 1.9.0 pub (22 tests), `@cascivo/editor` 1.9.0 pub (21 tests).
- `@cascivo/ai` 1.9.0 pub (AI conversation + new work-in-progress components AiStatus, ChainOfThought... #270). `@cascivo/text` 1.9.0 (machine mode, 3 tests). `@cascivo/render` 1.9.0 (now PUBLISHED, `private:false`; JSON ViewConfig runtime; `components={{...}}` extension point).
- `@cascivo/i18n` 1.9.0, `@cascivo/storage` 1.9.0. `@cascivo/tokens` 1.3.1, `@cascivo/themes` 1.0.3, `@cascivo/icons` 1.1.1 (~440 icons) - own version lines (1.x).
- `cascivo` CLI 1.8.0 (42 test files). `create-cascivo` 0.1.1 (NEW, 0 tests in-package; covered by `framework:check` CI job).
- `@cascivo/app` 1.9.0 (NEW since analysis; client router + typed Worker API + subpaths: api, sync, flags, jobs, uploads, export, analytics, db, guard, live, auth, oauth, social, ses, stripe, turnstile, vite; 23 test files). `@cascivo/data` 0.1.1 (SSE over fetch).
- `@cascivo/mcp` 0.10.0 (23 test files), `@cascivo/registry` 0.2.11, `@cascivo/docs` 0.2.16 (offline docs), `@cascivo/docspack` 0.3.2, `@cascivo/email` 0.6.1 (20 tests; Resend + SES senders, link checker, lint), `@cascivo/email-preview` 4.0.0, `@cascivo/eslint-config` 0.4.2 and `@cascivo/eslint-plugin` 0.3.0 (0 tests in-package), `@cascivo/vite-plugin` 0.1.11, `@cascivo/platform` 0.0.6 (0 production use signal; "orthogonal to themes").
- Private/experimental: `@cascivo/search` 0.0.1, `@cascivo/theme-kit`, `@cascivo/video` (Remotion), `@cascivo/workbench` (component workbench, first slice 2026-10-08).

### 1.3 Framework support matrix (docs/COMPATIBILITY.md + USING-WITH-*.md)
| Target | Status in docs | Verifying artefact |
|---|---|---|
| React 18/19 | Yes | whole repo |
| Next.js App Router (RSC) | Yes. `'use client'` preserved, theme CSS imported in Server Component, `react-server` export condition since 0.18.0 so no aggregate CSS (34 KB vs 384 KB page). Pages Router not mentioned. | apps/examples/react-next + test/rsc-css.mjs |
| Vite CSR | Yes (reference) | apps/examples/react-vite |
| Vite SSR / TanStack Start / "Remix" / workerd | Yes with footnote 1 (zero config since 0.10 via `node` twin; `cascivoSsr()` fallback) | apps/examples/react-vite-ssr (custom Vite SSR, NOT TanStack Start or Remix) |
| Preact 10 | CSR only (Vite + preset-vite, ~half JS); SSR "not verified"; Astro+Preact compat "known broken" (4 stacked causes, upstream bug) | none in CI for the broken case; `apps/examples/chat` + `create --framework cloudflare --runtime preact` are Preact CSR |
| Cloudflare Workers client app | Yes (CSR + Worker API) | framework:check CI job |
| Astro (React islands) | Yes, needs @cascivo/react >=1.0.1 AND `vite.resolve.noExternal` | create --framework astro; astro-islands fixture proves only half (workspace:* never externalised) |
| React Router | Only via Link wiring (`setLinkComponent` + `asChild`, USING-WITH-A-ROUTER.md) | adopter dry runs only |
| Vue / Svelte / Angular | Tokens/themes only | none |
| Ghost | Tokens/themes only (cannot mount React); real theme validated by gscan | apps/examples/ghost-theme, CI "Ghost theme canary" |
| Tailwind v4 coexistence | Yes: `@layer` order, `.dark` <-> `[data-theme]` bridge, opt-in `@cascivo/themes/tailwind.css` | docs only (no example app); USING-WITH-TAILWIND.md |
| Not mentioned anywhere | React Router 7 framework mode, Remix as such, Solid, web components, React Native, Next Pages Router, Qwik, Angular components | - |
Guard: `scripts/checks/framework-matrix.test.ts` forces each check-mark to name an existing example/CI job.

## 2. Market analysis (docs/internal/market-analysis-2026-09.md) item status

Legend: DONE / PARTIAL / OPEN. Hashes are from the shallow history; otherwise file paths.

### 2.1 Section 7.1 "claims that contradict the repo"
| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | "no runtime" copy | PARTIAL | PosterHero fixed; `apps/site/src/marketing/sections/EnterprisePitch.tsx:18` still says "No runtime black box to audit" (arguably a different sense), README says "no runtime style injection" (accurate) |
| 2 | "0.x" copy / 0.18 refs | DONE | README.md:107 describes 1.x lockstep; COMPATIBILITY.md:104; ENTERPRISE-READINESS §7 now historical |
| 3 | AT copy "pending / not tested" | PARTIAL | AccessibilityStatement.tsx now computed from at-results.json (3 pass / 21 partial, 12 comps x 2 stacks, generatedAt 2026-10-10). BUT `docs/specs/at-matrix.md` is still 100% "not tested" with old "Cascade" naming and is published via apps/site/public/context.json and specs.json (contradiction) |
| 4 | Benchmarks pre-1.0 | OPEN | docs/BENCHMARKS.md still "Date 2026-06-16", 70.18 KB full bundle vs docs/plans/1-0-0 measured 167.7 KB for react; no re-run on 1.x |
| 5 | Component counts | PARTIAL | README/ROADMAP now say "generated"; llms.txt says "22 pre-built page blocks" vs registry 10 blocks + 12 `blocks[]`. Registry is 214 items, 147 standalone |
| 6 | `cascade registry build` | DONE | docs/CONTRIBUTING-REGISTRY.md now `cascivo registry build`; `registry build` in cmdspec |
| 7 | parity.json "Queued" notes | PARTIAL | 24 -> 2 left: apps/site/public/parity.json:148 ("drawer queued (v18-t6)"), :530 ("notification, v18-t5") |
| 8 | README MCP tool count | PARTIAL | README.md:121 lists 26; server registers 28 |
| 9 | README trivia | PARTIAL | "Mirrored at" gone; astro-islands description filled; Okabe-Ito claim still README.md:52 (unchecked) |
| 10 | Old names | PARTIAL | CLAUDE.md clean. `CascadeView`, `WhyCascadePage`, `app-cascade` remain (API-surface, deliberately); `packages/cli/src/utils/config.ts` + resolve.test.ts still contain `@cascade/`-style strings |
| 11 | Roadmaps | PARTIAL | ROADMAP.md "Last updated 2026-09-24", docs/ROADMAP.md reduced to a pointer. ROADMAP "Next" still lists items already shipped/partly shipped (routed scaffold) and was not updated for @cascivo/app/blueprints work |
| 12 | `@cascivo/text` in UPGRADING | DONE | docs/UPGRADING.md:82 |

### 2.2 Section 7.2 structural presentation
| Item | Status | Evidence |
|---|---|---|
| Visual proof in README/hero | DONE | README.md:27 pulse light/dark webp; c08c8d5c "Replace hero screenshots with live interactive app frames" (HeroLiveFrames.tsx) |
| Landing 17 -> ~9 bands, jargon | DONE (not re-verified visually) | apps/site/src/marketing/poster; analysis' own status note |
| Recorded 20-sec demo video (#8) | OPEN | no video asset; `@cascivo/video` is private/experimental |
| Own-projects labelled in showcase | PARTIAL | claimed in analysis note; grep finds no "maintainer" wording in src/marketing/pages/showcase |
| Comparison pages (Base UI/RA, MUI/Mantine/Astryx) | DONE (as ONE page) | /guides/alternatives -> guides/data.ts:383-408 (headless, styled suites, Astryx, shadcn-like) |
| WhenNotToUse limits | DONE | guides/data.ts:319-348 (one maintainer, signals lint, en+de only, no Figma kit) |
| Getting started first component early | DONE per analysis note | getting-started-contract.test.ts |
| Single umbrella version | OPEN (deliberate) | tokens 1.3.1, themes 1.0.3, icons 1.1.1, CLI 1.8.0, mcp 0.10.0, email 0.6.1, email-preview 4.0.0 |
| Unmarketed wins surfaced | PARTIAL | "More than components" band, "Open in v0" only in CLI README + llms.txt line 719 |

### 2.3 Section 8 (product/process gaps)
| Item | Status | Evidence |
|---|---|---|
| 8.1 No VPAT/ACR, no external audit, JAWS untested | OPEN | docs/GOVERNANCE.md:100 "no third-party audit or VPAT/ACR yet"; AccessibilityStatement.tsx:138 JAWS pending; docs/ENTERPRISE-READINESS.md |
| 8.1 LTS/support policy | PARTIAL | docs/GOVERNANCE.md "Support windows": current major + 6 months security; no LTS, no SLA, no paid support |
| 8.1 Bus factor/governance statement | DONE (statement), OPEN (fact) | GOVERNANCE.md "Who maintains it"; "second maintainer with publish rights is a goal, not yet a fact" |
| 8.1 Provenance/SBOM | DONE | .github/workflows/release.yml:132-157 (NPM_CONFIG_PROVENANCE, CycloneDX per package); GOVERNANCE.md:63-68 |
| 8.1 Release discipline | OPEN in practice | GOVERNANCE.md promises "at most one minor every two weeks" but @cascivo/react shipped 1.4..1.9 between 2026-10-01 and 2026-10-09 (Version Packages commits 90088fa6 10-01, dddc87ed 10-02, 3306ae61 10-03, fcadb817 10-06, db01cbb3 10-07, a17e83c6 10-09): 6 minors in 9 days |
| 8.2 Validation monoculture | PARTIAL | new example apps (chat, stage, track, trade) widen shape, but feedback dir has nothing newer than 2026-08-14 and ledger covers only dashboards; no forms/CRUD, RTL, mobile, brownfield-shadcn adopter report |
| 8.3.1 React Compiler CI leg | DONE | package.json `compiler:check`; .github/workflows/ci.yml:373; apps/examples/react-vite/vite.compiler.config.ts. But `react-hooks/immutability` still must be turned off or `useSignalState` setters used (TROUBLESHOOTING #1) |
| 8.3.2 SSR/CSS packaging | DONE-ish | `react-server` + `module` + `node` conditions (COMPATIBILITY.md fn 1-2), `css-contract:check`, scaffold dropped the 273 KB aggregate; still the top historical failure area, Astro needs manual `resolve.noExternal` |
| 8.3.3 Deferred to 2.0 (details Accordion etc.) | OPEN (by decision) | docs/plans/details-disclosure-plan.md "DEFERRED to 2.0" |
| 8.3.4 Visual regression per PR | DONE | .github/workflows/visual.yml: `pull_request` on components/layouts/tokens/themes paths + sampled layout-sensitive set |
| 8.3.5 i18n beyond en/de | OPEN | only `de` catalogs in builtin.ts; WhenNotToUse admits it |
| 8.3.6 Data grid virtualisation, TanStack adapter | PARTIAL | `DataTable` has `virtualized` + `grid` keyboard mode (virtual-window.ts); no TanStack Table adapter anywhere |
| 8.3.7 Marketplace empty | OPEN | marketplace.json: 3 templates (dashboard, auth, landing) + 6 starters; catalog rebuilt daily by bot, no growth |
| 8.4.1 Measure audit loop | PARTIAL | `apps/bench/agent` harness shipped 2026-10-09 (dafb2ccd); docs/plans/app-blueprints-action-plan.md:344 "measured run is pending", needs ANTHROPIC_API_KEY; no docs/AGENT-BENCHMARKS.md |
| 8.4.2 `cascivo mcp init` + skills install | DONE | cmdspec `mcp init`; README.md:132-133 (`npx skills add cascivo/cascivo`) |
| 8.4.3 Shrink llms.txt to 5-8 KB | PARTIAL | 105 KB -> 80 KB (apps/site/public/llms.txt); target not met; llms-full 688 KB, context.json 1.3 MB; no size budget test found |
| 8.4.4a DTCG export | DONE | packages/tokens/dtcg, scripts/tokens/generate-dtcg.ts, `cascivo tokens import`, scripts/checks/dtcg-export.test.ts |
| 8.4.4b DESIGN.md | DONE | /DESIGN.md + apps/site/public/DESIGN.md (5.4 KB) |
| 8.4.4c Storybook components-manifest | DONE | apps/storybook/.storybook/main.ts:13; README.md:119 |
| 8.4.4d A2UI / json-render catalog, MCP Apps (ui://) | OPEN | zero hits outside docs/internal |
| 8.4.5 Publish @cascivo/render | DONE | packages/render/package.json `private:false`, 1.9.0, in lockstep family; streaming/partial validation and `parentId` wire format not seen |
| 8.4.6 `render_view_as_markdown` MCP tool | DONE | packages/mcp/src/view-markdown.ts, server.ts |
| 8.4.7 Builder ingestion certification (Figma Make, Lovable, Claude Design, v0) | OPEN | shadcn projection exists (apps/site/public/r/shadcn, 227 files; packages/cli/README.md:67) but no doc/badge/test for v0, Figma Make kit, Lovable, `/design-sync` |
| 8.4.8 migrate-from-shadcn agent skill | DONE | skills/cascivo-migrate-from-shadcn |

### 2.4 Section 10 prioritised list
| # | Action | Status | Evidence |
|---|---|---|---|
| 1 | Fix every 7.1 item | PARTIAL | see 2.1 (2 parity notes, README tool count, at-matrix.md, roadmap) |
| 2 | Re-run benchmarks on 1.3+ | OPEN | docs/BENCHMARKS.md dated 2026-06-16 (bench.yml exists, output unchanged) |
| 3 | README GIF + live hero | DONE | README.md:27; c08c8d5c |
| 4 | Label maintainer's showcase | PARTIAL | unverified in source |
| 5 | Audit-loop benchmark + 20 s demo | PARTIAL (harness) / OPEN (demo) | apps/bench/agent |
| 6 | `mcp init`, skills install, trim llms.txt | DONE / DONE / PARTIAL | above |
| 7 | shadcn Registry Directory, builder ingestion badges | OPEN | no submission artefact; no badges (cannot check external directory) |
| 8 | Cut landing to ~6 bands; short getting-started | DONE (9+CTA) | analysis note |
| 9 | Comparison pages | DONE (single page) | guides/data.ts |
| 10 | React Compiler CI leg | DONE | ci.yml:373 |
| 11 | Release policy (lockstep, deprecate-before-remove, stabilisation) | DONE on paper, VIOLATED in practice | GOVERNANCE.md vs 6 minors in 9 days |
| 12 | DTCG, DESIGN.md, Storybook manifest, Figma kit | DONE x3 / OPEN (Figma kit) | ROADMAP.md "Design-tool bridge" still Later |
| 13 | Publish render, A2UI/json-render adapters, MCP Apps, render_view_as_markdown | DONE (render, tool) / OPEN (adapters, MCP Apps) | |
| 14 | ACR/VPAT, external audit, JAWS | OPEN | |
| 15 | i18n locales, TanStack adapter, virtualisation, per-PR visual | OPEN / OPEN / DONE (DataTable) / DONE | |
| 16 | Broaden validation (forms, content, mobile, RTL, brownfield) | OPEN | feedback dir ends 2026-08-14 |
| 17 | Seed marketplace 10+ templates or hide | OPEN | 3 templates |

### 2.5 What actually shipped since 2026-09-24 (substantive commits)
- #255 `apps/examples/chat` (Preact, Workers AI), #257 Stage example + starter, #256 `release:bootstrap`.
- #259/#261 Stripe Checkout, SES-as-EmailSender, refunds/disputes/entitlements in `@cascivo/app`.
- #266/#271 OAuth sign-in, social posting (bluesky/mastodon/etc.), ShareMenu, threading.
- #269 email link checking, Resend sender, `lint_email` MCP tool.
- #270 AI progress components (AiStatus, ChainOfThought) + AI tokens.
- #264 theme-aware charts / multi-theme embed. #263 hero live frames.
- #268 CLI `cmdspec.json` + rendered CLI guides on docs site.
- #274 App blueprints, `--workspace` scaffold, component workbench (phases 0-4), MCP `compose_app`, `cascivo app add page`.
- #279/#281 CI unstick, docspack repo recipe.
Observation: effort went mostly to the Cloudflare "app layer" (ROADMAP-V60 decision, 2026-09-29), which is outside the analysis' top priorities (proof/distribution/compliance). ROADMAP.md (updated 2026-09-24) does not mention `@cascivo/app`/blueprints/workbench outside one bullet.

## 3. Other roadmap/plan open items

### ROADMAP-V60 (docs/internal/ROADMAP-V60.md, owner decision 2026-09-29)
- Kill criteria (all measured "six months after create-cascivo is published", i.e. ~spring 2027): (1) fewer scaffolded apps use its router than replace it with React Router/TanStack Router (needs opt-in `doctor` telemetry, which does not exist; see below), (2) needs SSR mode, (3) maintenance pushes component work out of two consecutive minors. Criterion 3 deserves watching: the post-09-24 minors are dominated by app/email/social work.
- "Not decided here": nested layouts + data loaders; offline/service worker. Still no router evidence for either.
- Decided with NO adoption data (documented trade-off).
- No opt-in telemetry implemented to measure kill criterion 1 (grep `doctor` telemetry: none found; not exhaustively verified).

### ROADMAP.md "Next/Later" (last updated 2026-09-24)
- Standing per-release conformance report (axe + APG matrix): open. AT: fix quirks, human-confirm, JAWS: open.
- Theme builder (/create) -> CLI handoff: cmdspec has `theme create`; not verified end-to-end.
- Router flag on `create` (`--router react-router|tanstack|none`): open for react-vite scaffold (only cloudflare scaffold routed).
- Later: more registries/templates, versioned docs, Figma kit, domain-state primitives (deliberately held).

### docs/plans open items
- app-blueprints-action-plan.md: P1-1 recipe format (in progress), **P1-2 generator composes recipes (not started)**, P1-3/P1-4 in progress, P2-6 agent benchmark measured run pending, P3-1/2/3 in progress, **P3-4 Vite+ org templates (not started)**, P4-2 workbench in progress (private).
- app-layer-next-use-cases-research.md: items 5-14 not built (real-account Stripe/SES smoke run, GitHub/Google OAuth (since shipped via #266), teams/orgs, inbound email, web push, bookings, downloads/licences, usage billing, merchant of record, account export/deletion); real refund/dispute/SES-with-attachment "unproven without accounts".
- details-disclosure-plan.md: Accordion on `<details>` DEFERRED to 2.0. modern-css-adoption-plan.md: items 3-6 deferred (named @position-try etc.).
- 1-0-0-readiness-analysis.md: B4 stabilisation window skipped per market analysis.
- docs/specs/cascivo-launch-checklist.md: 1 unchecked box left ("hosting config / CORS/CSP for new origin") plus verification section.
- docs/internal/feedback/RECURRENCE.md: "Open - 0" (30 closed-awaiting-release rows as of 08-14 ledger; ledger not extended since, newest report 2026-08-14).

## 4. Quality / adopter-experience gaps found

1. **Release cadence vs promise** (see 2.3). 1.4->1.9 in 9 days; @cascivo/mcp 0.10, email 0.6 also moving; GOVERNANCE.md says "at most one every two weeks". `scripts/checks/release-filter.test.ts` etc. do not enforce cadence.
2. **Stale compliance doc published as product content**: docs/specs/at-matrix.md all "not tested" + "Cascade Modal" wording, indexed in context.json/specs.json; contradicts at-results.json (3 pass/21 partial). at-results.json says JAWS tracking lives in this file.
3. **Benchmarks stale** (2026-06-16, pre-1.0, 70 KB vs 167.7 KB unreconciled); landing hero stat depends on it.
4. **AT: 21 of 24 cells "partial"**, no human confirmation, no JAWS, no VPAT/ACR - blocks federal/EU procurement; EU Accessibility Act in force.
5. **No React Router 7 framework mode / Remix / TanStack Start example**: "Vite SSR / TanStack Start" green tick is backed by a hand-rolled Vite SSR fixture (apps/examples/react-vite-ssr), not those frameworks; Remix is named in USING-WITH-VITE-SSR.md and TROUBLESHOOTING without any artefact. 13 adopter reports on TanStack Start were AI dry runs.
6. **Astro**: needs BOTH @cascivo/react>=1.0.1 AND `vite.resolve.noExternal`; the in-repo fixture can't catch the second (workspace:* never externalised); Preact-under-Astro "known broken" and not reproduced in CI (USING-WITH-ASTRO.md "Verification status"). Preact SSR unverified.
7. **Signals/React lint friction is permanent**: `react-hooks/immutability` forbids documented `signal.value =` writes (TROUBLESHOOTING #1). Mitigated by `useSignalState` setters + `@cascivo/eslint-config` + CI compiler leg, but adopters must still turn a rule off or use setters. Silent failure mode ("handlers fire, UI never updates") needs `useSignals()` in app code (TROUBLESHOOTING "Handlers fire...").
8. **No Tailwind example/CI**: USING-WITH-TAILWIND.md is doc-only (no app in apps/examples, no framework:check leg), though Tailwind is the dominant LLM default.
9. **llms.txt still 80 KB** vs analysis' 5-8 KB target; three overlapping agent channels (llms.txt, llms-full 688 KB, context.json 1.3 MB) plus docspack and @cascivo/docs. README says 26 MCP tools, llms.txt says "22 pre-built page blocks", registry says 10+12: three counts again.
10. **Only en + de** in i18n; no RTL adopter validation beyond CSS-logical-property guard; React Aria bar is 30+ locales.
11. **No Figma kit**; no DTCG-to-Figma round trip test; WhenNotToUse admits it.
12. **Unmeasured AI claim**: audit loop benchmark harness exists but never run (needs API key); no `docs/AGENT-BENCHMARKS.md`.
13. **`@cascivo/render` published but CascadeView name/file names retained**: legacy `Cascade*` identifiers in public API (api-surface.json) and `@cascade/`-style strings in packages/cli/src/utils/config.ts.
14. **Packages with 0 or ~1 in-package tests**: create-cascivo (0), eslint-config (0), eslint-plugin (0), tokens (1), themes (2), react (3), docs (1), docspack (1), platform (1), icons (2), storage (1). Some are covered by repo-level scripts/checks, but `create-cascivo` and the ESLint packages ship to adopters' toolchains.
15. **Strategic drift**: `@cascivo/app` now carries OAuth, Bluesky/Mastodon posting, Stripe, SES, Turnstile, jobs, live/sync - a mini full-stack framework inside a design system, under 1.x semver lockstep with core (any breaking change anywhere forces a major of everything). CLAUDE.md's "no runtime dependency" rule is respected but the surface is large for a single maintainer.
16. **Marketplace/registry ecosystem**: 3 first-party templates; no external registries in directory; 1 star / ~1.1k monthly downloads at analysis time (cannot re-verify without network).
17. **Phase/plan hygiene**: docs/plans still has 4 research docs without status headers (app-layer-next-use-cases has one at the end; css-layering-architecture-review, platform-spike-research, social-oauth-providers-research, stripe-and-ses-integration-research have none) despite the feedback README "status hygiene is binding".

## 5. Framework support summary (for the caller)
- **Next.js (App Router/RSC)**: solid. Server Component theme import, `react-server` condition, example + CSS assertion test. Gaps: Pages Router undocumented; Server Components cannot pass handlers (documented); no `create --framework next`; Turbopack mentioned only in passing.
- **Vite SSR / TanStack Start**: documented zero-config since 0.10 (CSS-free `node` twin) and 0.18 (no aggregate CSS); verified by a custom SSR fixture only. No actual TanStack Start app in repo; `createRouter()` name collision documented (VITE-SSR.md:168).
- **React Router**: guide covers `setLinkComponent`, `asChild`, URL-driven tabs, the `HydrateFallback` warning; no framework-mode (v7 SSR) coverage, no example, no `--router` scaffold flag.
- **Preact**: CSR only verified; SSR/prerender unverified; Astro+Preact broken. The docs site and `chat` example themselves run on Preact.
- **Astro**: React islands work with 2 required config items; scaffold emits them; only one hydrated island per page (shell).
- **Ghost**: tokens + themes only, real gscan-validated theme in CI.
- **Tailwind**: coexists; bridge CSS; doc-only.
- **Vue / Svelte / Angular / Solid / web components / React Native**: tokens only for Vue/Svelte/Angular; others not mentioned. Market analysis suggests marketing `clientJs:'none'` components as framework-agnostic HTML+CSS recipes; not done, although registry.json marks 79 of 214 entries `clientJs: none` (70 enhancement, 65 required), so the raw material exists.
