# cascivo in the AI era: gap analysis and roadmap (2026-10-17)

**Status:** draft for owner review. Research and planning only; no product code changes.
**Scope:** what cascivo still lacks, as of October 2026, as an AI-first UI library, plus making
Astro work properly. The Astro workstream has its own implementation plan:
[`../plans/2026-10-17-astro-first-class.md`](../plans/2026-10-17-astro-first-class.md).

## 0. How this was produced

Five research agents ran in parallel. Each one wrote a full report with sources; the reports are
kept verbatim next to this spec in [`2026-10-17-research/`](./2026-10-17-research/).

| # | Report | Model | Method |
| --- | --- | --- | --- |
| 01 | Astro, hands-on | Opus | Packed tarballs installed into fresh Astro projects outside the monorepo; dev, build, browser |
| 02 | AI-native UI market | Sonnet | Web research plus a repo grep for every claim |
| 03 | Internal audit | Sonnet | Repo inventory; status of every item in `market-analysis-2026-09.md` |
| 04 | Frameworks and web platform | Sonnet | Web research, web-features 3.43.0 data, a lightningcss test, repo grep |
| 05 | Trust, evals, enterprise | Sonnet | Web research plus a review of the workflows, CLI and MCP code |

Tags used in the reports: **[V]** verified against a primary source, **[S]** secondary source,
**[I]** inference. This spec keeps the claims that matter for a decision and links back to the
report for the evidence.

### What the owner asked, and what this spec assumes

- **Asked:** a deep investigation of what is still missing for a UI library in today's AI
  landscape (and the space around it), and a fix for Astro, which "is not working properly".
- **Assumed:** the output is a ranked roadmap split into workstreams, each of which later gets its
  own spec and plan. Only the Astro workstream is planned to task level now, because the owner named it.
- **Assumed:** Cascivo Sans ([cascivo/cascivo#282](https://github.com/cascivo/cascivo/pull/282))
  is in flight and is not a gap. Only its integration follow-ups appear here (W9).

## 1. Executive summary

cascivo's AI layer is ahead of the market on **context**: manifests, `llms.txt`, MCP, `audit --ai`,
DESIGN.md, DTCG and a shadcn-schema projection. It is behind on four things:

1. **Reach into the places where AI users now see UI.** MCP Apps (Claude, ChatGPT, VS Code), A2UI
   and json-render catalogs, and streaming generative UI. cascivo's CSS-variable tokens fit the MCP
   Apps host-theme model better than any Tailwind kit does, and that advantage is not used yet. (W2)
2. **AI product surfaces.** Prompt input with attachments and mentions, streaming-safe markdown,
   agent plan/queue/approval (human-in-the-loop) components. shadcn shipped these in October 2026,
   and Vercel retires AI Elements at the end of November 2026, so the slot is open now. (W3)
3. **Proof.** There is no published number for "how often does an LLM write correct cascivo code".
   Benchmarks are from June. There is no ACR/VPAT, and `at-matrix.md` contradicts `at-results.json`.
   The thesis is unmeasured in public. (W6)
4. **Framework edges.** Astro needs a config line that nothing warns about, Preact under Astro is
   broken, and module-scope signals (the i18n locale) are shared across SSR requests. Next 16 Cache
   Components, TanStack Start 1.0 and React Router 8 have no CI leg. (W1, W8)

Since the September analysis, almost all substantive commits went to the app layer
(`@cascivo/app`: OAuth, Stripe, SES, blueprints). The September "Now" list (proof, compliance,
distribution) is mostly still open (report 03, §2). This roadmap deliberately weights those items.

## 2. What is already strong (do not redo)

These are verified in the repo, and several are claimed as gaps in older documents:

- Supply chain: OIDC trusted publishing, npm provenance, a CycloneDX SBOM per package
  (`.github/workflows/release.yml`, pinned by `scripts/checks/provenance.test.ts`).
- Quality CI: per-PR sampled visual regression (`visual.yml`), blocking axe over about 660 stories
  (`axe.yml`), nightly NVDA and VoiceOver runs (`a11y-at.yml`), a React Compiler leg (`ci.yml`).
- AI context: DTCG 2025.10 export plus resolver, a DESIGN.md generator, the Storybook components
  manifest, `cascivo mcp init`, the `render_view_as_markdown` MCP tool, the migrate-from-shadcn
  skill, and a published `@cascivo/render`.
- Registry safety: `isSafeRelativePath` at parse time, `assertInside` at write time, `fileHashes`,
  `cascivo.lock`, a three-way-merge `update`, `doctor --drift`.
- Platform CSS: anchor positioning, `@starting-style`, relative colour, `contrast-color()`,
  `field-sizing`, `text-box` and scroll-state queries are already in use, with fallbacks.

## 3. Workstreams

Each workstream lists its items, evidence, impact (H/M/L) and effort (S/M/L), and a success
criterion that can be checked. Items are ordered by impact within each workstream.

### W1. Astro: first-class, zero-config (owner priority)

Evidence and plan: report 01 and
[`../plans/2026-10-17-astro-first-class.md`](../plans/2026-10-17-astro-first-class.md).

**What was tested.** Astro 7.4.0 (Vite 8/Rolldown) with `@astrojs/react` 7.1.0. cascivo was
installed from packed tarballs into fresh projects outside the monorepo, and every result was
checked in `astro dev`, `astro build`/`preview` and Chromium via Playwright.

| Area | Result today |
| --- | --- |
| SSR'd islands (`load`/`visible`/`idle`/none) with a plain config | ❌ unstyled after build; unstyled until hydration in dev |
| Same, with `resolve.noExternal` | ✅ dev, build, server islands, MDX |
| `client:only="react"`, the `cascivo create --framework astro` scaffold, `cascivo add` into Astro | ✅ (the scaffold pins `@astrojs/react ^5` with `astro ^7`, which gives two Vite majors and 21 warnings) |
| Theme with the preload script | ✅ no flash. ❌ resets to light after a `<ClientRouter/>` navigation |
| `useTheme()` in an SSR'd island | ❌ React #418 hydration error |
| On-demand SSR (node adapter) | ❌ a controlled theme leaks into the next request |
| Compound components (Tabs) written in `.astro` | ❌ disappear silently; hydrating a `@cascivo/react` export directly ships 326 KB JS + 331 KB CSS |
| Modal or popover in a `transition:persist` island, without `moveBefore` | ❌ the dialog stops being modal and Escape does nothing (simulated; Safari and Firefox untested) |
| Signals shared across islands, view transitions, Starlight | ✅ |
| MDX | ✅ in build. ❌ wrong layer order in dev |
| Preact | `client:only` ✅ (the doc says it crashes; that is stale). Server-rendered ❌ (upstream compat) |

**Root causes.**
1. Astro externalizes `@cascivo/react` in its server build, so the CSS graph is never walked. Adding
   the `astro-component` keyword makes Astro inline it, and a plain config then works. This was
   verified with a repacked tarball.
2. Astro renders `.astro` children separately, so React context cannot cross them, and Tabs fails
   without a sound.
3. The theme runtime assumes one document and one request.
4. Layer order depends on which stylesheet arrives first.
5. Server-rendered Preact islands are an upstream `@astrojs/preact` problem.

**Fix design.**
- **Zero config by package metadata:** the `astro-component` keyword on every package that ships
  CSS. This is guarded in `css-contract`.
- **A theme runtime that is hydration- and request-safe:** `useSyncExternalStore` with a server
  snapshot, no store writes on the server, and `themePreloadScript({ reapplyOn })`.
- **Loud compound parts,** plus overlay re-sync after re-insertion.
- **A new `@cascivo/astro` integration** for what no package export can do: inject the layer
  order, the theme CSS and the view-transition-safe theme script.
- **A naive-adopter CI arm with browser assertions,** plus a weekly `astro@latest` run.

The plan has 10 tasks.

**Success:** a plain `astro add react && pnpm add @cascivo/react` app renders styled in dev and
build, with no hydration errors, and the theme persists across soft navigation. All of this is
proven by `pnpm framework:check` on tarballs, with negative arms.

### W2. Generative-UI reach

| Item | Evidence | Impact | Effort |
| --- | --- | --- | --- |
| **MCP Apps wrapper plus host-theme bridge.** Bundle a `ViewConfig` or block into a `ui://` resource and map the host's CSS variables (`--color-background-primary`, `--border-radius-md`, `--font-sans` …) onto `--cascivo-*` at `ui/initialize`. | SEP-1865 has been stable since 2026-01-26. Claude, ChatGPT, VS Code and Goose render `ui://`, and OpenAI points new apps at it [V] (02 §1). There is no `ui://` in the repo. | H | M |
| **Streaming, partial `ViewConfig` rendering with a flat, id-based wire format.** | A2UI, json-render SpecStream and OpenUI all lead with this, and MCP Apps sends `tool-input-partial` [V]. cascivo has deferred it (`ROADMAP-V40.md:71`) and uses nested `children`. | H | M |
| **Catalog emitters generated from `.meta.ts`:** json-render (Zod `defineCatalog`) first, then A2UI v1.0 (JSON Schema plus `instructions`) once it leaves release candidate. | Formats are converging on "schema per component plus instructions", and `packages/render/src/prop-schemas.ts` already holds that data [I]. A2UI v1.0 removed `theme` from catalogs, so the host design system owns styling [V]. | M-H | S-M / M |
| **Recipes for AG-UI and the AI SDK 6 UI** (tool parts → `ToolCall`/`Reasoning`/`Sources`, interrupts → approval). | The `ToolCall` states already mirror the AI SDK tool-part states (02 §1). The only chat example runs on Workers AI. | M | S |

Not pursued: Tambo (its cloud service shuts down 2026-10-31), the RSC `streamUI` (experimental, and
Vercel discourages it), and full AI Elements parity.

**Success:** a cascivo view renders inside Claude and ChatGPT through MCP Apps and takes on the
host's theme; a partial `ViewConfig` streams without layout jumps; `cascivo catalog --format
json-render` produces a module that json-render's React renderer accepts.

### W3. AI product components

| Item | Evidence | Impact | Effort |
| --- | --- | --- | --- |
| **`PromptInput`**: attachments, @-mentions, slash commands, model picker, submit/stop states. | shadcn AI Elements (October 2026); `AiChat` currently has a plain textarea (02 §2). | H | M |
| **Streaming-safe markdown** that tolerates unterminated fences and partial tables, with no trusted-HTML path. | `StreamingText` handles plain text only and `Prose` takes trusted HTML only. Streamdown is the reference [S]. | H | M |
| **Agent task and human-in-the-loop surfaces:** Plan, Task/Queue, Confirmation (approve/edit/reject), Questionnaire, Checkpoint. | shadcn Questionnaire and HITL (August 2026), AI SDK 6 `needsApproval`, AG-UI interrupts [V]. cascivo has `ToolCall`, `ChainOfThought`, `Steps`, `Timeline` and `AiStatus`. | M-H | M |
| **Schema-to-form renderer** (JSON Schema → cascivo form). Serves MCP elicitation and A2UI forms. | MCP elicitation form mode [S]. | M | M |
| Code block with diff, plus voice input. | AI Elements; low priority unless cascivo targets coding-agent UIs. | L-M | M |

These go through the `factory` backlog (`scripts/factory/backlog.json`) under the normal authoring
rules (signals, layered CSS, i18n, a11y).

**Success:** `apps/examples/chat` runs a full AI SDK 6 agent loop with approvals using only
cascivo components, and passes the 320–414 px overflow and touch-target sweep.

### W4. Agent-operable UIs (UIs that agents use)

| Item | Evidence | Impact | Effort |
| --- | --- | --- | --- |
| **WebMCP-ready forms:** pass `toolname`/`tooldescription`/`toolautosubmit` through Form, style `:tool-form-active`/`:tool-submit-active` in `@layer cascivo.component`, add a `useWebMcpTool` hook, and expose machine mode as a read tool. | Chrome's declarative API is in origin trial; the spec draft is dated 2026-10-16. No design system supports it yet [V]. The repo has zero references. | M (H if it ships) | S-M |

Note: the entry point is `document.modelContext`, and `navigator.modelContext` is reportedly
deprecated [S]. Build behind feature detection.

### W5. Agent context and MCP maturity

| Item | Evidence | Impact | Effort |
| --- | --- | --- | --- |
| **`llms.txt` diet:** 80 KB down to a 5–8 KB index, with one canonical entry channel instead of four. | Target set in September and still open (03 §2.3). | M | S |
| **MCP server maturity:** serve the 8 skills over MCP (SEP-2640 `skill://`, Final), resources (tokens, per-component docs), prompts, tool annotations, `outputSchema`. | `server.ts` registers only tools (29) [V]. | M | S-M |
| **Generated counts everywhere.** README says 26 MCP tools (actual 28–29); `llms.txt` says 22 blocks (actual 10 + 12). | Report 03 §2.1. Generate the numbers and test them, as the README component index already does. | M (trust) | S |
| **Builder ingestion proof:** a verified import into Claude Design, Figma Make, v0 and Lovable; Code Connect mappings generated from `.meta.ts`. | Projection exists but is unverified (02 §3, 04 §4). | M | S (test) / M (Code Connect) |
| Per-theme DESIGN.md and `cascivo manifest --json`. | Astryx `manifest --json` [S]. | L-M | S |

### W6. Proof (make the thesis a number)

| Item | Evidence | Impact | Effort |
| --- | --- | --- | --- |
| **Published, reproducible LLM × cascivo eval.** Finish `apps/bench/agent`: add a no-context arm and a shadcn + Tailwind control arm, pass@k, a model matrix and multi-turn edit episodes; publish JSON plus `/evals`, and re-run for each model release. | Harness exists; `docs/AGENT-BENCHMARKS.md` was never written. Vercel's `next-evals-oss` is the template. No design system publishes such an eval, so the position is uncontested (05 §2, 02 §5). | H | M |
| **ACR/VPAT 2.5:** self-authored first, then a third-party audit; add JAWS; make `at-matrix.md` generated from `at-results.json`. | The EAA has applied since 2025-06-28 [V]. `at-matrix.md` says "not tested" while results show 21 partial and 3 pass (03 §2.1). | H (enterprise) | M / L |
| **Refresh `docs/BENCHMARKS.md`** on 1.x and print the date on `/performance`. | Dated 2026-06-16; the 70 KB and 167.7 KB figures are unreconciled. | M | S |

### W7. Trust and supply chain

| Item | Evidence | Impact | Effort |
| --- | --- | --- | --- |
| **Release hardening after the TanStack incident:** SHA-pin actions, remove `cache: pnpm` from the job that holds `id-token: write`, remove `npm install -g npm@latest`, adopt `npm stage publish` with a stage-only trusted publisher, and add zizmor/Scorecard/CodeQL, CODEOWNERS and dependabot. | On 2026-05-11, 84 TanStack versions shipped with valid provenance through cache poisoning and OIDC token extraction [V]. `release.yml:52` has the same shape (05 §1). | H | S |
| **Signed registry:** sign `registry.json`/`r/*.json`, verify in the CLI, verify `fileHashes` during `add` (today only during `update`), and pin the hashes in the lock. | `packages/cli/src/commands/update.ts:225`; shadcn has no signing story, so this is a niche cascivo can own. | M-H | M |
| **MCP content trust:** label third-party registry text as untrusted, cap its size, and require a human confirmation before an agent installs from a registry outside the directory. | The `add_template`/`add_to_project` MCP tools; Snyk rates registry metadata injection as MEDIUM [S]. | M | S-M |
| **Trust pack:** a CRA stewardship statement, end-of-life dates per release line, a longer LTS, a licence report. | CRA dates are disputed (2026-09 vs 2027-12) [S]; LTS today is 6 months of security fixes. | M | S |

### W8. Frameworks and web platform

| Item | Evidence | Impact | Effort |
| --- | --- | --- | --- |
| **SSR request isolation for module-scope signals.** `packages/i18n/src/locale.ts` keeps `activeLocale` in a module-level `signal`, so the locale is shared by every request in a process. Also check `catalogVersion` and `@cascivo/storage`. | 04 §1.5 [I]. The same class of bug was reproduced for the theme store in 01 (fixed in W1, Task 3); the locale needs its own design (per-request scope without a new runtime dependency). | H | S-M |
| **CI legs:** Next 16.4 with `cacheComponents` and `reactCompiler`; TanStack Start 1.0; React Router 8 framework mode. Add COMPATIBILITY rows for Waku, RedwoodSDK, Remix 3 (tokens and themes only) and Expo (out of scope), and state a React-floor policy. | `apps/examples/react-next/next.config.ts` is empty; TanStack Start 1.0 went stable 2026-10-13 [V]. | M-H | M |
| **Adopt now** (Baseline in 2026): `command`/`commandfor` for dialog, drawer and popover triggers; `@scope`; `:open`; `sibling-index()`; `view-transition-class`; container style queries. **Progressive:** `popover="hint"`, `<dialog closedby>`, `grid-lanes`, cross-document view transitions. | Full table in 04 §3. | M | M |
| **Firefox and WebKit CI legs** for the progressive CSS fallbacks. | Visual baselines are Chromium only, and `fallback:check` reads source only. | M | M |
| **Fix stale claims:** "lightningcss drops `@function`" (it preserves it in 1.33.0), Chrome version numbers for `if()` and `@function`, Firefox `field-sizing` (152, not 121), `commandfor`/`@scope` described as used when they are not. | 04 §1.3. | M (trust) | S |
| **Beyond React: no ports.** Ship HTML + CSS recipes for the 56 `clientJs: 'none'` components, then publish the machine configs as an interaction contract. Skip Lit, Mitosis and Zag. | 04 §2. | M | M |

### W9. Ecosystem and insight

| Item | Evidence | Impact | Effort |
| --- | --- | --- | --- |
| **Cascivo Sans integration** after #282 merges: a `--cascivo-font-sans` default (or opt-in) in tokens and themes, a self-hosting recipe per framework (Astro Fonts API, `next/font/local`, Vite), and `font-display`/subsetting guidance. | #282 ships the font and the `/cascivo-sans` page; the themes still use a system stack (03 §1.1). | M | S-M |
| **Seed the ecosystem:** 10+ templates, 5+ external registries, shadcn Directory listing, and a submission bot that runs `audit` and pins the reviewed commit. | Mechanics exist; content is 1 directory entry and 3 templates (05 §5). | M-H | M |
| **`cascivo report`:** combine lock and drift into JSON per repo or org, plus a react-scanner preset. Optional opt-in telemetry. | ROADMAP-V60's kill criteria have no data behind them (03 §3). | M | M |
| **Locales beyond en and de**, starting with the EU languages the EAA covers. | 03 §1.1. | M | M |
| **Figma bridge:** Code Connect generation, plus a Tokens Studio / Penpot import recipe for `dtcg/`, with Terrazzo building the DTCG output in CI. | 04 §4. | M | M |

### W10. Process

- **Release cadence breaks the written policy.** `GOVERNANCE.md` says at most one minor every two
  weeks, but `@cascivo/react` went from 1.4 to 1.9 between 10-01 and 10-09 (03 §2.3). Either change
  the policy or batch the releases; the gap costs enterprise trust.
- **Scope check against ROADMAP-V60's kill criterion 3** (app-layer maintenance displacing component
  work): the last three weeks of commits match it. This roadmap is the counterweight.

## 4. Sequencing

Dependencies: W2 streaming and the MCP Apps wrapper go together. W6's eval needs W5's diet first,
or it measures the old entry files. W3 components feed W2's catalogs.

| Horizon | Items |
| --- | --- |
| **Now (1–2 weeks)** | W1 Astro plan; W8 SSR signal isolation (inside W1); W7 release hardening; W5 generated counts and `llms.txt` diet; W6 `at-matrix` fix and benchmark refresh; W8 stale-claim fixes; W10 cadence decision |
| **Next (3–6 weeks)** | W6 published eval; W2 MCP Apps plus host-theme bridge; W2 streaming `ViewConfig`; W3 `PromptInput` and streaming markdown; W5 MCP resources and skills; W4 WebMCP forms; W8 CI legs for Next 16, TanStack Start 1.0 and RR8 |
| **Later (quarter)** | W3 agent-task and HITL components; W2 json-render then A2UI catalogs; W6 ACR and an external audit; W7 signed registry; W9 ecosystem seeding, `cascivo report`, locales, Figma bridge; W8 platform features and HTML+CSS recipes |

## 5. Non-goals

- Framework ports of the components (Vue, Svelte, Solid, Lit, web components). W8 limits this to
  CSS recipes and published machine contracts.
- Preact under Astro, unless report 01 shows a fix on the cascivo side; otherwise document it as
  an upstream limitation (see the plan).
- Chasing every generative-UI runtime; json-render, A2UI and MCP Apps cover the declarative and
  open-ended bands.
- Hosted services (SOC 2 matters only if one is added).

## 6. Open questions for the owner

1. **Cascivo Sans as the default theme font,** or opt-in? A default changes every theme's metrics and
   the visual baselines.
2. **Release cadence:** change the governance policy, or batch the releases?
3. **Eval budget:** the published eval needs API keys and a recurring spend per model release. Is
   that acceptable, and which models?
4. **ACR:** is a self-authored ACR enough for now, or should a third-party audit be budgeted?
5. **Next workstream to spec** after Astro: the recommendation is W6 (the eval) because it turns the
   main claim into a number, then W2 (MCP Apps).
