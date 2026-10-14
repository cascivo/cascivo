# Research: from design system to app bootstrapper — blueprints, workspace, workbench

**Status: PROPOSAL, 2026-10-07.** Research and recommendation only; nothing here is built yet.
Every claim about this repository was checked against `main` at `cb47287d`. Claims about the
outside world come from npm and from the vendors' own docs on 2026-10-07; their sources are linked.

**The question asked:** cascivo's components are strong, but an AI session still spends a lot of
tokens to produce the same app shell every time. Can cascivo bootstrap a whole app or monorepo,
with an opinionated modern stack (Vite+, pnpm, …), and maybe a Storybook-like workbench? Should
we build our own Storybook?

**The short answer:**

1. The expensive part is not the components. It is the **80% of every app that is the same**:
   shell, routes, auth pages, settings, tables, theme, tooling, tests, CI and agent config. An
   agent rebuilds all of it by hand, from about 60k tokens of docs.
2. cascivo already owns almost every piece needed to stop that: 22 blocks, 14 layouts, 3
   templates, 6 starters, a 24-subpath app layer, a three-way-merge updater, a validator, a
   renderer and an MCP server. **Nothing composes them.** The composition logic that does exist
   is 12.8k lines of string templates in one file.
3. The move that changes the game: **make the app itself declarative, the way the manifest made
   the component declarative.** An agent should emit about 300 tokens of *app blueprint*, and
   cascivo should compile it into owned code.
4. **Do not build a general Storybook rival.** Do build a narrow, **manifest-driven workbench**
   for adopters. It needs no stories, because cascivo already has the data Storybook makes you
   write by hand. The template for it already ships: `@cascivo/email-preview`.

---

## §1 — What exists today (verified)

### 1.1 Scaffolding

- `npm create cascivo` is a thin wrapper (`packages/create-cascivo/bin/create-cascivo.mjs`). It
  calls `cascivo create`, which lives in `packages/cli/src/commands/create.ts`.
- **That file is 12,828 lines.** It writes every generated file as a template literal, and it
  combines features through string conditionals. The `worker/index.ts` import header alone is a
  single expression with about 20 `${feature ? … : ''}` branches (`create.ts:2071-2097`).
- **Three shapes:**
  - `react-vite`: a shell plus a section switcher. **No router.** The `--router` flag was deferred
    (ROADMAP "A routed scaffold").
  - `astro`: real page routes; only the shell hydrates.
  - `cloudflare`: file routes, a typed API, 17 `--example` add-ons, and `--auth`.
    **Auth, data, payments and integrations exist only on this shape.**
- **Always one app in one directory.** Never generated:
  - a test runner or a `test` script
  - CI
  - CLAUDE.md or `.mcp.json` (only AGENTS.md is written)
  - Vite+
  - a pnpm workspace
  - a workbench
  - a theme switcher
- `--template` drops page files into `src/pages/` and **does not wire them into routes or the
  nav.**

### 1.2 The material that composition would draw on

| Asset | Count | Where |
| --- | --- | --- |
| Page blocks | 12 | `packages/components/src/blocks` (app-shell, auth-login, dashboard-overview, settings-profile, pricing, …) |
| Layout blocks | 10 | `packages/layouts/src/blocks` (console-app, sidebar-app, dashboard-charts, users-table-page, settings-form-page, login-page, …) |
| Layouts | 14 | AppShell, DashboardLayout, SettingsLayout, AuthLayout, PageHeader, … |
| Sections | 6 | hero, cta, feature-grid, … |
| Templates | 3 | `templates/{dashboard,auth,landing}` |
| Starters | 6 | `starters/*`, all Cloudflare, generated from `create` and drift-checked |
| App layer | 24 subpaths | `@cascivo/app`: router, typed API, file routes, auth/oauth, sync, live, jobs, uploads, stripe, ses, social, flags, db, analytics, export |

### 1.3 Where an agent's tokens go today

The scenario: "build me an admin dashboard" through the MCP and skills path. Sizes come from
`wc -c` at about 4 chars per token. These are estimates.

| Spent on | ~Tokens |
| --- | --- |
| 26 MCP tool descriptions, sent every turn (`create_app`'s description alone is 4.6 KB) | 3.5–4k **per turn** |
| `llms.txt`, which the design-page skill says to always read | ~20k |
| `docs/RECIPE-DASHBOARD.md` | ~5k |
| Per-component `llms/*.md` for about 10 dashboard components (data-table alone is 47.6 KB) | ~27k |
| `get_view_grammar` with no scope: the grammar, a prompt that repeats it, and pretty JSON of all 214 items | ~70k |
| **Output:** hand-written pages (`apps/examples/deploy/src` is 26.5 KB of TSX) | 6–10k **output** |
| `tsc` and validate fix loops | multiplies all of the above |

**A careful run costs about 50–60k input tokens plus 6–10k output tokens.** It costs 2–3× that if
the agent pulls `llms-full.txt` (687 KB). Output tokens are the slow, expensive part, and they are
spent re-typing blocks that already exist in the registry.

### 1.4 Defects found along the way

Each of these is small and independently fixable. Each one also makes the current one-call
paths fail quietly.

1. **`cascivo generate` writes broken import paths.** `generate.ts:181` builds
   `${c.toLowerCase()}/${c.toLowerCase()}`, so `DataTable` becomes `datatable/datatable`. The
   directory is `data-table`.
2. **The validator and the renderer disagree.** `validate_view` and the grammar accept all 214
   registry names. `<CascivoView>` renders only 57 (`packages/render/src/component-names.ts`). It
   has no AppShell, PageHeader, Heading, Stat, Kpi, or charts. A "valid" dashboard view therefore
   cannot render, and a JSON dashboard cannot contain a KPI.
3. **`scaffold_view` is a keyword stub** (`packages/mcp/src/scaffold-view.ts`, 89 lines). It
   returns up to 4 components in a flat `main` region with no props. It also emits
   `layout: 'dashboard'`, which `ViewConfig` does not define.
4. **MCP parameters are narrower than the CLI's:**
   - `create_app` offers 3 of the 12 themes (`server.ts`, `.enum(['light','dark','warm'])`) and
     has no `template` parameter.
   - `add_to_project` takes one name, although `cascivo add` takes many.
5. **`llms.txt`'s MCP section leaves out the one-call paths**: `create_app`, `add_template`,
   `list_templates` and `get_view_grammar`.
6. **Most docs → Storybook links are broken.** `ComponentPage.tsx:12` links `…--primary`, but
   only 71 of 181 story files export `Primary`, and none of the generated ones do.
7. **`cascivo add` does not copy `.meta.ts`.** Adopters lose the manifest, which is exactly what
   would drive their tooling (§4).
8. **CLAUDE.md is stale.** It says "vite+ is alpha (v0.2.x)". The repo is on `vite-plus` 1.0.0,
   and npm has 1.1.0, released today. Vite+ 1.0 went stable on 2026-09-28 under MIT.

---

## §2 — What the outside world teaches (2025–2026)

**Bootstrappers converged on four ideas:**

- **Full templates plus a registry.** shadcn CLI v4 (Mar 2026) has `init` with full project
  templates, `--monorepo`, presets, and `registry:base`/`page`/`file`/`font` items carrying
  `envVars`, plus `--dry-run`/`--diff`.
  [changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
- **Pickers.** Better-T-Stack (very active) has a picker over frontend × backend × ORM × auth ×
  payments, with addons for vite-plus, mcp and skills. It also has a Claude Code plugin that
  scaffolds from plain language. [docs](https://www.better-t-stack.dev/docs)
- **Ecosystem distribution.** Vite+ 1.0's `vp create` accepts org templates: an `@org/create`
  package with a `createConfig.templates` manifest, and `--agent` writes agent files.
  [guide](https://viteplus.dev/guide/create)
- **Agent files in the template.** `nx configure-ai-agents`, MakerKit's layered AGENTS.md, and
  `vp create --agent`.

**AI app builders win by constraint, not by size:**

- Convex Chef provisions **one fixed template**, blocks writes to auth files, and runs a
  write → typecheck → fix loop. Its lessons: "make the hard decisions for the LLM", and
  configurable platforms "confuse the LLM".
  [post](https://stack.convex.dev/lessons-from-building-an-ai-app-builder)
- Replit's custom templates let its agent "skip the planning phase".
  [docs](https://docs.replit.com/teams/custom-templates)
- Lovable's generated repos all share one Vite + React + shadcn template commit.

**Context files have a cost:**

- An ETH/LogicStar study (arXiv 2602.11988, Feb 2026) found that context files **lowered success
  rates and raised inference cost by more than 20%** when they carried requirements the task did
  not need. [paper](https://arxiv.org/abs/2602.11988)
- Atlassian measured DESIGN.md-style prose at +92% tokens compared with their MCP
  (`docs/internal/market-analysis-2026-09.md`).
- Nx **deleted most of its MCP tools**: "skills for knowledge, MCP for connectivity".
  [post](https://nx.dev/blog/why-we-deleted-most-of-our-mcp-tools)
- Storybook 10.6 moved to skills plus CLI bindings.
- **The cheapest token is the one the agent never has to read or write.**

**Storybook in 2026:**

- 10.6.1 is current. 9.0 cut the install by 48% and brought Storybook Test (Vitest browser mode,
  for interaction, a11y and visual tests). 10.0 went ESM-only.
- Storybook MCP is in preview (10.3). Its vendor benchmark claims 27% fewer tokens.
- **The alternatives are weak:**
  - Ladle is slow-moving.
  - Histoire is stuck in beta.
  - Backlight shut down in June 2025.
  - React Cosmos is alive but niche.
- **How major libraries do it:** Mantine and Chakra keep Storybook as an internal dev harness and
  publish a custom docs site. shadcn has no Storybook at all. **I found no library building a
  general Storybook competitor**, and the teams that dropped Storybook ended up maintaining a
  playground of their own (Codey ADR-003).

---

## §3 — The proposal: cascivo Blueprints

### 3.1 The idea

Today the component is declarative: a manifest, then generated docs, MCP, grammar and
validation. **The app is not.** It exists only as hand-written TSX, so every agent session
re-derives it.

**A blueprint is a small, typed, validated description of an app.** cascivo compiles it into
owned code, using the blocks, templates and app layer it already ships.

```jsonc
// cascivo.app.json — what an agent emits (~300 tokens), or what `cascivo create` writes from prompts
{
  "name": "Acme Console",
  "target": "spa",                 // spa | cloudflare | astro
  "theme": "dark",
  "shell": "sidebar-app",          // a layout block, not a free-form description
  "auth": ["email", "oauth:github"],
  "pages": [
    { "path": "/",         "title": "Overview", "block": "dashboard-charts" },
    { "path": "/users",    "title": "Users",    "block": "users-table-page", "data": "fixture:users" },
    { "path": "/settings", "title": "Settings", "block": "settings-form-page" },
    { "path": "/login",    "block": "login-page", "public": true }
  ],
  "recipes": ["theme-switcher", "error-pages", "test-setup", "ci-github"]
}
```

**Three properties make this cascivo rather than yet another boilerplate:**

1. **The blueprint is an input, not a runtime.**
   - It generates owned code and then gets out of the way, the same model as `cascivo add`.
   - There is no hidden framework and no config the app reads at runtime. That keeps the
     "simplicity" and "owned code" principles.
   - The file stays in the repo as a record of intent, so later edits are additive:
     `cascivo app add page /billing --block pricing`.
2. **Closed vocabulary, validated before anything is written.**
   - `shell`, `block` and `recipes` are registry names, checked the way `validate_view` checks
     component names, with the same `parse at the boundary` rule.
   - The agent cannot hallucinate a block. A bad name fails with the list of valid ones.
   - This is the Convex lesson: make the decisions for the model and give it a closed set.
3. **Upgradable.**
   - Every generated file records its recipe and version, so `cascivo update` can use its
     existing three-way merge (base → adopter edits → upstream) on app-level files, not just
     components.
   - **No boilerplate on the market can do this.** It is the answer to the most common starter
     complaint ("a kit stuck on Next.js 14 is a migration gift").

**Token economics (estimate; §6 makes it measurable):**

| | Today | With blueprints |
| --- | --- | --- |
| Input | 50–60k (docs, llms, per-component md) | ~3–5k (the blueprint schema, plus a block catalog of one line per block) |
| Output | 6–10k TSX, plus fix loops | ~300 JSON, then 0 fix loops for generated code |
| Wall time | minutes | one tool call, plus install |

The agent's budget then goes where it belongs: the 20% of the app that is actually unique.

### 3.2 The enabling refactor: recipes instead of `create.ts`

You cannot compose 22 blocks, 17 examples, 4 auth modes and 3 targets inside string
conditionals. **The 12.8k-line generator has to become data first.**

A **recipe** is a directory of *real* template files plus a small manifest. It is deliberately
shaped like a registry item, so the registry, `add`, `update` and GitHub-as-registry all work on
it unchanged:

```
recipes/oauth/
  recipe.json        # files[], dependencies, envVars, routes[], nav[], migrations[],
                     # agentNotes (a one-paragraph AGENTS.md fragment), requires: ["auth-core"]
  files/worker/oauth.ts
  files/src/routes/login.tsx
```

- **The 17 `--example` add-ons become 17 recipes.** Auth, theme switching, error pages, test
  setup, CI and the workbench also become recipes.
- **The worker entry and the routes file stop being string-concatenated.** They become
  generated aggregations of what each recipe declares, the same technique as `routes.gen.ts`.
- **The safety net already exists.** `pnpm starters:generate` plus
  `scripts/checks/starters.test.ts` and `scaffold-contract` already pin `create`'s exact output.
  The refactor is done when the six starters regenerate **byte-identically** from recipes.
- **Recipes are the ecosystem.**
  - `@cascivo/app` is Cloudflare-only, and its kill criteria (`docs/internal/ROADMAP-V60.md`)
    rightly forbid growing it into every backend.
  - Recipes are how Postgres, Supabase, Clerk or Better-Auth arrive: as community- or
    vendor-published registry items (`cascivo add owner/repo/recipe` already resolves).
  - cascivo stays a design system and does not become a full-stack framework.
- **Make recipes shadcn-compatible where the shapes overlap** (`registry:page`,
  `registry:file`, `envVars`). Then the same item reaches v0's "Open in v0" and `shadcn add`.

### 3.3 Surfaces

The same compiler sits behind every surface:

| Surface | Change |
| --- | --- |
| `npm create cascivo` | Prompts build a blueprint, then compile it. The `--example`/`--auth` flags stay as sugar for `recipes`/`auth`. |
| `cascivo create --from cascivo.app.json` | Compiles an existing blueprint, for CI, templates, or an agent that wrote one. |
| MCP `compose_app(blueprint)` | Replaces `create_app` + `scaffold_view` + N × `add_to_project`. Returns the file tree and next steps. |
| `cascivo app add page\|recipe` | Additive edits that update the blueprint, routes and nav together. |
| `vp create @cascivo` | Publish `createConfig.templates` (Vite+ 1.0 org templates), so cascivo appears inside the toolchain it already uses. |

---

## §4 — The opinionated workspace

`npm create cascivo --workspace` is just a blueprint with `"workspace": true`. It generates a
monorepo with the stack this repo already proves out:

```
acme/
├── apps/web/                 # the blueprint's app
├── packages/ui/              # cascivo components land here via `cascivo add` (owned code)
├── packages/config/          # tsconfig + the strict host-lint config (@cascivo/eslint-config)
├── .github/workflows/ci.yml  # vp check · vp test · vp build · cascivo doctor --ci
├── AGENTS.md  CLAUDE.md      # short, layered: root + per-app, generated from recipe agentNotes
├── .mcp.json                 # cascivo MCP, pre-wired (today a separate `mcp init` step)
├── pnpm-workspace.yaml       # catalogs; approved build scripts
└── vite.config.ts            # Vite+ 1.x: fmt, lint, test, run
```

**What we decide on the adopter's behalf:**

- Vite+ and pnpm.
- React 19 or Preact.
- File routes.
- Vitest browser mode for component tests, with axe in the same run.
- Playwright for one smoke flow.
- **Few choices:** a target (`spa | cloudflare | astro`) and recipes. No ORM × auth × API matrix:
  Better-T-Stack already owns that game, and the research says the matrix hurts models.

**Agent files stay deliberately short.**

- The generated AGENTS.md is the sum of the selected recipes' one-paragraph `agentNotes`, plus a
  pointer to the MCP server. It is not a copy of this repo's CLAUDE.md.
- The ETH result is the reason: this repo's own CLAUDE.md is the style an adopter template must
  *not* copy.
- Also lock the files an agent should not rewrite. Following the Convex practice, `AGENTS.md`
  lists `packages/ui/**` (it is upgraded by `cascivo update`) and the tokens.

---

## §5 — "Should we build our own Storybook?"

### 5.1 Not a general one

A general-purpose Storybook rival means rebuilding:

- an addon ecosystem,
- framework integrations,
- a docs authoring format,
- a hosted review product (Chromatic),
- and keeping up with a funded team that ships every month.

**Every bespoke attempt in this space has stalled or died:** Backlight closed, Histoire is in
beta limbo, and Ladle has slowed. Storybook 10 has also fixed much of what people hated: it is
48% and then 29% lighter, ESM-only, and runs its tests on Vitest.

### 5.2 But a manifest-driven one, yes: `@cascivo/workbench`

**Storybook's core cost is that a human writes stories, controls and docs. cascivo already has
all three as data:**

| Storybook needs, by hand | cascivo already has, generated |
| --- | --- |
| stories | `meta.examples[]`, 446 of them, compile-checked by `scripts/stories/generate.ts` |
| controls / argTypes | `packages/render/src/prop-schemas.ts`, enums and primitives per prop |
| a11y facts | `meta.accessibility` + an axe runner (`apps/storybook/scripts/axe-sweep.mjs`) |
| theme / viewport toolbars | 12 themes via `data-theme`, `SCREEN` breakpoints, `data-platform` |
| AI context | `llms/<name>.md`, the context-prompt decorator, `render_view_as_markdown` |

**A precedent already ships to adopters.** `@cascivo/email-preview` (about 1.2k lines) is a
mini-Storybook for emails, run as `npx @cascivo/email-preview ./emails`. It has:

- a Vite plugin that turns a directory into virtual modules,
- `previewProps`,
- theme and viewport switchers,
- a conformance panel,
- HMR,
- and Playwright specs.

**The workbench is that architecture, generalised:**

- **Zero-config entries.** Every copied component with a `.meta.ts` becomes entries, one per
  example. Any `*.preview.tsx` (the `previewProps` convention) covers pages and app-specific
  components.
  - **Prerequisite:** `cascivo add` copies `.meta.ts` (defect 7).
- **Pages, not just components.** Blueprint pages render with fixtures (`data: "fixture:…"`).
  This is where Storybook is weakest ("stories go unused for complex pages") and where cascivo's
  shell blocks are strongest.
- **The panels cascivo uniquely has:**
  - the token inspector (which `--cascivo-*` tokens this component reads, and their resolved
    values),
  - the conformance validator,
  - "render as Markdown" (machine mode),
  - and **"copy as agent context"** — the scoped grammar for exactly this component.
- **Tests live in Vitest browser mode, not inside the workbench UI.**
  - `cascivo workbench test` reuses the entries for axe and `toMatchScreenshot` across example
    × theme.
  - The UI stays a thin viewer, which is how it stays small.
- **Agent loop.** An MCP tool `preview_entry(name, props)` returns validation results plus the
  Markdown render. That gives agents a self-check without screenshots.

### 5.3 What happens to the internal Storybook

Keep it for now. Its real jobs today are hosting the PR-blocking axe sweep and the nightly
NVDA/VoiceOver run, both of which need only "an iframe URL per entry plus an index". It has:

- no `play` functions,
- no Storybook Test,
- no autodocs,
- and controls in only the 81 hand-written files that use args.

**Decide later, with evidence:** once the workbench emits an `index.json` with iframe URLs, point
`axe-sweep.mjs` at it in a shadow run. Retire Storybook only if the shadow run matches for a
full release cycle.

**Separately, and cheaply:** emit a Storybook-compatible components manifest from `.meta.ts`
(already suggested in `docs/internal/market-analysis-2026-09.md`). Teams that already use
Storybook MCP or Chromatic then consume cascivo for free.

**Kill criterion for the workbench:** if it needs a per-framework integration layer, or its UI
grows past roughly 3k lines, it is becoming Storybook. Stop and fold the panels into a Storybook
addon instead.

---

## §6 — Make the claim measurable

"10× cheaper" should not be a marketing number. Before §3 ships, add an **agent benchmark**:

- the same five prompts (admin console, SaaS settings, marketing site, CRUD table, auth flow),
- run headless against (a) today's MCP and skills and (b) blueprints,
- recording input tokens, output tokens, wall time, `tsc` errors and `cascivo audit --ai`
  findings.

`docs/specs/context-impact-demo.md` already holds the method, and `apps/bench/` holds the harness.
Publish the table, the way `docs/BENCHMARKS.md` does for runtime performance. A measured result
is a launch story no competitor currently has.

---

## §7 — Plan

Phases are ordered so each one ships value alone and de-risks the next.

| Phase | Work | Verify |
| --- | --- | --- |
| **0. Fix what's broken** (days) | The 8 defects in §1.4. **Token diet:** `get_view_grammar` defaults to a scoped pack and drops the duplicated JSON; `get_component` gets a `compact` mode; `create_app`'s 4.6 KB description moves to a guide; `llms.txt` becomes an index (the market analysis already recommends this). | Regression test per defect; tool-description byte budget as a test |
| **1. Recipes** | Split `create.ts` into recipes with no behavior change. | The six starters regenerate byte-identically; `scaffold-contract` stays green |
| **2. Blueprints** | Blueprint schema and parser; `create --from`; MCP `compose_app`; `cascivo app add`; blocks wired into routes and nav; `--router` stops being an open item because routes come from the blueprint. Grow `<CascivoView>`'s map to every block-used component, and derive the validator's set from it. | Agent benchmark (§6); every block × target compiles in `framework:check` |
| **3. Workspace** | `--workspace`; Vite+ `createConfig.templates`; test, CI and agent-file recipes. | `isolated:check`-style job builds the generated monorepo from packed tarballs |
| **4. Workbench** | `@cascivo/workbench` from `email-preview`; `.meta.ts` copied on `add`; `preview_entry` MCP tool; shadow axe sweep. | Workbench entries = `meta.examples` count; shadow sweep parity |

**What not to do:**

- Don't build a general Storybook.
- Don't grow `@cascivo/app` into a multi-backend framework; recipes do that job.
- Don't ship a combinatorial stack picker.
- Don't copy this repo's CLAUDE.md style into adopter templates.
