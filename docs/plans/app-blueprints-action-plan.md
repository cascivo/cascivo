# Action plan: app blueprints, workspace scaffold, workbench

**Source:** [`app-blueprints-and-workbench-research.md`](app-blueprints-and-workbench-research.md)
(2026-10-07). Every finding in that document maps to at least one task below. The mapping table
is in §6.

**Status legend:** ☐ open · ◐ in progress · ☑ done (with the commit that shipped it) · ☒ decided against

**Rules for every task:**

- It ships with the guard that proves it: a regression test for a defect, or a drift or parity
  check for a list that could rot.
- It passes `pnpm ready` before it is committed.
- A task that touches a published package also runs `pnpm isolated:check` and `pnpm pack:check`.

---

## Phase 0 — Fix what's broken and put the agent surface on a diet (days)

**Shipped 2026-10-07** on `claude/app-blueprints-research`. Measured with an in-memory MCP client
against the real registry:

| Surface | Before | After |
| --- | --- | --- |
| Tool list, sent every turn | 22.9 KB | 19.9 KB (budget test: 20.5 KB) |
| `create_app` entry alone | 7.4 KB | 3.9 KB (setup notes moved into the result) |
| `get_view_grammar`, no scope | 92 KB after P0-2 (~280 KB before it: all 214 components) | 12.7 KB |
| `get_view_grammar`, 3 components | 14.1 KB | 3.6 KB |
| `get_component("data-table")` | 34.1 KB | 13.7 KB with `compact: true` |
| `get_component("button")` | 6.1 KB | 1.9 KB with `compact: true` |
| Docs pages with a working Storybook link | ~71 of 214 | 175 of 214 (the rest get no link) |

**Where implementation diverged from the spec below:**

- **P0-1 had a security half.** `generate` interpolates model-written JSON into TSX, so the new
  boundary parser admits only identifiers for component names, prop names and state keys, and
  only dotted identifier paths for refs and i18n keys. String text and attribute values containing
  JSX syntax or quotes are emitted as expressions. Before this, a quote in an attribute value
  produced invalid JSX, and `{…}` in text produced code.
- **P0-2 needed a second target.** Restricting `validate_view` to the renderable set would have
  broken the design-page skill: it validates a view and then turns it into TSX with
  `cascivo generate`, and TSX can use any copied component (`Stat`, for example). So
  `validate_view` takes `target: "render" | "tsx"`, and the skill passes `"tsx"`. The validator
  also used to reject `GridItem` and `RadioCardGroup`, which render but have no registry entry of
  their own. The renderable set fixes that.
- **P0-4 did not add a `create-app-examples` guide.** Guides are site pages, so a guide would
  have meant a new docs route for one tool's notes. Instead, each example's setup notes come back
  in `create_app`'s result, for the examples actually picked. Selection-relevant constraints, such
  as "needs runtime react" or "brings auth oauth", stay in the one-line summaries. The same split
  was applied to `auth`.
- **P0-4 also changed the design-page skill** so it no longer reads `llms.txt` first. It reads
  the scoped grammar and compact manifests for exactly the components it will use.

The goal of this phase is that the one-call paths that already exist stop failing silently. No
new architecture.

### P0-1 ☑ `cascivo generate` emits importable code

- **Findings:** research §1.4 defect 1. Also `generate.ts` binds `JSON.parse(...) as ViewConfig`,
  which breaks the CLAUDE.md "never `as` a payload you did not produce" rule.
- **Files:** `packages/cli/src/commands/generate.ts`, `generate.test.ts`, `packages/cli/cmdspec.json`.
- **Change:**
  1. Import from each component's **registry directory**, in kebab case (`DataTable` →
     `data-table`). Import through the directory's `index.ts` barrel, which re-exports
     sub-components. Sub-components whose directory is not their own kebab name (`GridItem` →
     `grid`, `RadioCardGroup` → `radio-card`) resolve through a small owner map.
  2. A `--from <package>` flag (for example `--from @cascivo/react`) emits **one** import line
     from that package, for the prebuilt path that `create` scaffolds.
  3. Replace the cast with `parseViewConfig(raw: unknown): ViewConfig`. It throws with the
     offending path on structural failure.
- **Verify:**
  - Unit tests for the kebab case, the sub-component owner, `--from` and parser rejection.
  - A guard test asserts that every name `<CascivoView>` can render resolves to an existing
    registry directory, so the owner map cannot rot.

### P0-2 ☑ Validator, grammar and renderer agree on one vocabulary

- **Findings:** research §1.4 defects 2 and 3.
- **Files:** `packages/mcp/src/{validate,grammar,prompt,scaffold-view,server}.ts`. The
  renderable set is `RENDERABLE` in `grammar.ts`, which must stay free of runtime imports
  because `scripts/context/generate.ts` loads it under Node's type stripping.
- **Change:**
  1. The MCP grammar, `validate_view`, `render_view_as_markdown` and `scaffold_view` use the
     set `<CascivoView>` can actually render. Today they use all 214 registry names. A
     non-renderable component is reported as an error that names the renderable alternatives.
  2. `scaffold_view` stops emitting `view.layout`, which is not part of `ViewConfig`.
- **Verify:**
  - A parity test (`renderable.test.ts`) keeps `RENDERABLE` equal to `packages/render/src/component-names.ts`. The
    MCP server cannot import React, which is why the list is inlined.
  - A test asserts a scaffolded view validates against the renderable set.

### P0-3 ☑ MCP tool parameters match the CLI

- **Findings:** research §1.4 defect 4.
- **Files:** `packages/mcp/src/server.ts`, `server.test.ts`.
- **Change:**
  1. `create_app.theme` accepts all 12 themes.
  2. `create_app` gets a `template` parameter, which maps to `--template`.
  3. `add_to_project` accepts `names: string[]` (one `cascivo add a b c` call) and keeps `name`
     for compatibility. Names that start with `-` are refused, so a name cannot smuggle in a
     CLI flag.
- **Verify:**
  - Unit tests on the argument builder.
  - A parity test asserts the theme enum equals the CLI's theme list.

### P0-4 ☑ Token diet on the agent surface

- **Findings:** research §1.3 and §7 Phase 0. The market analysis (§3.2) also asks for an
  index-sized `llms.txt`.
- **Files:** `packages/mcp/src/server.ts`, `grammar.ts`, `prompt.ts`, `guides.ts`.
- **Change:**
  1. `get_view_grammar` stops returning the same grammar three times: the string, inside the
     prompt, and as pretty JSON of every component. It returns `{ grammar, prompt }`, and the
     JSON component list only on `detail: true`.
  2. `get_component` gets `fields`/`compact`: props, plus one example, plus a11y.
  3. `create_app.examples`' description (4.6 KB, sent on every turn) shrinks to a one-line list.
     The per-example detail moves to a `create-app-examples` guide served by `get_guide`.
  4. A **byte budget test** on the sum of all tool descriptions, so the surface cannot regrow
     unnoticed.
- **Verify:**
  - The budget test.
  - Measured before/after byte counts recorded in this plan.

### P0-5 ☑ `llms.txt` lists every MCP tool

- **Findings:** research §1.4 defect 5.
- **Files:** `scripts/llms/generate.ts`, a new `scripts/checks/llms-mcp-tools.test.ts`, and
  regenerated `apps/site/public/llms*.txt`.
- **Change:**
  1. The tool list gains `create_app`, `add_template`, `list_templates`, `get_template`,
     `get_view_grammar`, `deploy_preview`, `create_theme`, `scaffold_flow`, `validate_component`,
     `get_variant_matrix`, `list_guides`/`get_guide`, `list_registries` and `search_components`.
  2. A guard reads the `registerTool` names from `server.ts` and fails when the **published**
     `llms.txt` omits one. The deprecated `scaffold_page` is exempt, with a reason.
- **Verify:** the guard. Adding a tool without documenting it fails CI.

### P0-6 ☑ Docs → Storybook links resolve

- **Findings:** research §1.4 defect 6.
- **Files:** `scripts/stories/generate.ts`, a generated `apps/site/src/generated/storybook-ids.json`,
  and `apps/site/src/pages/ComponentPage.tsx`.
- **Change:**
  1. The story generator, which already runs in `pnpm regen`, writes a map from component name
     to the story id of its first story. It covers hand-written and generated stories.
  2. The page links to that id, and **renders no link** for a component with no story.
- **Verify:** a drift check through `regen`, plus a test that every id in the map belongs to a
  story file on disk.

### P0-7 ☑ Stale claims

- **Findings:** research §1.4 defect 8, and the agent report on `MACHINE-MODE.md:96`.
- **Change:**
  1. CLAUDE.md's dependency policy changes from "vite+ is alpha (v0.2.x)" to the 1.x stable
     line.
  2. `docs/MACHINE-MODE.md` stops saying `@cascivo/render` is unpublished: `private: false`,
     and it ships in the 1.x fixed group.
- **Verify:** `claims:check`.

---

## Phase 1 — Recipes: `create.ts` becomes data (no behavior change)

**Step 1 shipped 2026-10-08: the leaf files.** Before touching anything, the scaffolder's output
was hashed for 906 option combinations: three names (one with an apostrophe), every framework,
runtime, sign-in mode, every example alone, all examples together, and publish + export +
checkout. Measured that way, **79 of the cloudflare scaffold's files never vary**. The variation
is concentrated in about 20 aggregation files (README 344 variants, `wrangler.jsonc` 130,
`package.json` 100, `worker/index.ts` 82). Four leaf files vary only by the app's name.

- 74 files moved out of template literals into `packages/cli/recipes/<name>/`. That is 22 recipes:
  the `cloudflare` base, 17 examples, and `publish-preview`, `billing`, `accounts`, `auth-email`
  for the combinations.
- The four name-dependent files use `{{brand}}`, `{{appName}}` and `{{usageDataset}}`.
- `create.ts` went from 12,828 to 4,419 lines. Which recipes a scaffold gets is one function,
  `cloudflareRecipes()`.
- **Verified:** all 906 combinations hash identically before and after, `starters:generate` from
  the built CLI leaves no diff, and the packed tarball carries `recipes/`.
- **Diverged from the spec:**
  - `recipe.json` holds `name` and `files` only. Routes are the files under `src/routes/`.
    Everything else in P1-1's list belongs to the aggregation files, so it arrives with step 2,
    one aggregation file at a time, rather than as an unused schema now.
  - The parser lives in the CLI (`src/scaffold/recipes.ts`, using the registry's
    `isSafeRelativePath`) until P1-4 needs it for remote recipes.
  - `.gitignore` and `.prettierignore` stay in code: npm drops dotfiles from a published
    package.
  - The recipe CSS writes the app's own layer slot, so `layer-order.test.ts` now excludes
    `packages/cli/recipes/` from its library-CSS rule. `unlayered:check` still covers it.

**Step 2 started 2026-10-08 with the side nav.** `recipe.json` takes `nav` (label + app path),
and `App.tsx`'s nav is the sections followed by each recipe's entries, replacing 19
`hasExample(...)` pushes. `CLOUDFLARE_RECIPES` lists the recipes in nav order. This is the
contribution blueprints need first, because a blueprint page is a nav entry plus a route. Still
byte-identical across the 906 combinations.

**Open: the remaining aggregation files.** `worker/index.ts` (713 lines of generator), README,
`wrangler.jsonc`, `package.json`, `src/api.ts` and `.dev.vars` are not independent per-recipe
fragments. Features change each other's output: `search` types its `AI` binding as `Embedder`
only without `agent`, `social` declares `APP_URL` only without `digest`, and `EMAIL` is an
intersection over four features. A declarative contribution format that reproduces this
byte-for-byte would need conditional fragments, which is the same complexity moved into JSON.

### P1-1 ◐ The recipe format

- **Change:** a `recipe.json` schema shaped like a registry item:
  - `files[]` with `target`
  - `dependencies`, `devDependencies`
  - `envVars` (name, description, required)
  - `routes[]`, `nav[]`, `migrations[]`
  - `worker` contributions: imports, bindings, handlers
  - `agentNotes`, one paragraph
  - `requires[]`, `conflicts[]`
- **Parser:** a `parseRecipe(raw: unknown)` parser in `@cascivo/registry`, following the house
  pattern of `parseItem`, including `isSafeRelativePath` on every target.
- **Verify:** parser tests, including path-escape rejection.

### P1-2 ☐ The generator composes recipes

- **Change:**
  1. A `composeScaffold(target, recipes[], options)` function concatenates the recipes' files.
  2. It generates the aggregation files from what the recipes declare: the worker entry
     imports and handlers, `routes.gen.ts`, nav, `wrangler.jsonc` bindings, `.dev.vars.example`
     and AGENTS.md. Today those files are string-concatenated inside `create.ts`.
  3. Conflicts and missing `requires` fail before anything is written.

### P1-3 ◐ Port the scaffolds, one target at a time

- **Change:**
  1. Port in this order: `react-vite` → `astro` → `cloudflare` base → each of the 17 examples
     and 4 auth modes, one at a time.
  2. Template literals move into real files under `packages/cli/recipes/**`, so they can be
     formatted, linted and type-checked as code.
  3. `create.ts` shrinks to argument parsing plus a call to `composeScaffold`.
- **Verify, at every step:**
  - `pnpm starters:generate && git diff --exit-code starters/` (byte-identical output).
  - `scaffold-contract`, `scaffold-lint`, `framework-install` and `create.test.ts` stay green.

### P1-4 ◐ Recipes are installable registry items

- **Change:**
  1. `cascivo add recipe:<name>` (and `owner/repo/recipe`) applies a recipe to an existing app.
  2. Recipe items also publish under shadcn-compatible types where the shapes overlap
     (`registry:page`, `registry:file`, `envVars`).
- **Verify:** an integration test applies `recipe:crud` to a fresh scaffold and builds it.

---

## Phase 2 — Blueprints

**First slice shipped 2026-10-08** (after the user chose blueprints over finishing the Phase 1
aggregation files):

- **The blueprint is `create`'s flags plus a block per page.** `cascivo.app.json` takes `name`,
  `framework`, `theme`, `runtime`, `examples`, `auth` and `pages: [{ title, block? }]`, the
  vocabulary the CLI already teaches. Pages are today's sections, so routes and nav come for
  free on both `react-vite` and `cloudflare`.
- **The parser is strict:**
  - unknown fields fail;
  - an unknown block fails with the full list of blocks;
  - `name` must be one plain directory segment, so a model cannot write outside the working
    directory;
  - blocks need `react-vite` or `cloudflare`.
- The flag combination rules moved into one `optionsError()` that both paths use.
- **Blocks became generated recipes.** `scripts/recipes/blocks.ts`, which runs in `pnpm regen`,
  rewrites each block's relative and `@cascivo/core` imports to `@cascivo/react` and writes
  `recipes/block-<name>/`. That covers 15 blocks. It skips the rest with a printed reason:
  - three are app shells;
  - `dashboard-charts` needs `@cascivo/charts`;
  - `empty-dashboard`, `login-page` and `settings-form-page` need `DashboardLayout`,
    `AuthLayout` and `SettingsLayout`, which `@cascivo/react` does not export.
- **Surfaces:** `cascivo create --from cascivo.app.json` on the CLI, and MCP `compose_app` plus
  `list_blocks`. `list_blocks` reads a catalog the same generator writes, so the two cannot
  disagree. The tool-list budget went to 22.5 KB, with the reason recorded in the test.
- **Verified:**
  - Every block lints clean under the scaffold's own ESLint
    (`scaffold-blueprint-lint.test.ts`, in `scaffold:check`).
  - A React + Vite app with all 15 blocks installs from packed tarballs, passes `tsc`, builds,
    and passes its own `format:check` (`framework:check`).
  - That run found and fixed a latent bug: a long `--sections` list produced a
    `type Section = …` line over Prettier's width, failing the app's own format check.
  - Apps without blocks are byte-identical across the 906 golden combinations.

**Second slice shipped 2026-10-08:**

- **Layouts exported.** `DashboardLayout`, `AuthLayout` and `SettingsLayout` are now exported
  from `@cascivo/react`, as a minor API addition with the snapshot updated. They have the same
  dependency profile as `PageHeader`.
- **Blocks can bring a package.** A block recipe declares `dependencies`, and the scaffold adds
  them at the CLI's pinned versions, only when a page uses that block.
- **Result: all 19 page blocks are blueprint-ready.** Only the three app shells are left out.
  `framework:check` now packs `@cascivo/charts` too, and builds a React + Vite app with all 19
  blocks from tarballs: `tsc`, `vite build` and Prettier all pass.
- **`cascivo app add page "<title>" [--block <name>]`.** The scaffold is generated from the
  blueprint before and after, and each touched file is merged three ways:
  - an untouched file is replaced;
  - an edited one keeps its edits;
  - a clash gets conflict markers and the command exits non-zero.
  The blueprint is updated. This is P2-3's mechanism, applied to the first edit an agent needs.
- **A bug fixed on the way: `utils/merge.ts`, which `cascivo update` uses, dropped lines.**
  - After a pure insertion it advanced past the next base line, so that line vanished from the
    result.
  - The misalignment could then lose the other side's later edits.
  - Its tests only covered single-line replacements. It is now a standard diff3 (hunks grouped
    by overlap, with same-point insertions treated as overlapping), with regression tests.

**Third slice shipped 2026-10-08:**

- **Every scaffold is a blueprint app.** `cascivo create` writes `cascivo.app.json` whether it ran
  from flags, prompts or `--from`. The file is normalized, and stamped with `"cascivo":
  "<version>"` from a new `CLI_VERSION` in the generated version table. This is the "prompts
  produce a blueprint" item: the prompts' answers are recorded rather than a second prompt flow
  being built. The five cloudflare starters gained the file, and apart from it all 906 golden
  combinations are byte-identical.
- **`cascivo app add example <name>`** adds a cloudflare example to an existing app. It goes
  through the same rules as `--example`, so the same combinations are refused. This supersedes
  P1-4's `cascivo add recipe:<name>` for first-party recipes.
- **Versioned merge base, instead of the planned `cascivo.lock`.** The merge base is now what the
  app's own CLI version generated, rebuilt with `npx cascivo@<recorded version>`. If that cannot
  run, it falls back to this CLI's output with a warning. The stamp in the blueprint was enough
  to do this; no lockfile was needed.
- **`cascivo app upgrade`** regenerates the app with this CLI's templates, keeping your edits.

**P2-5, partly shipped 2026-10-08.** `<CascivoView>` renders 74 components, up from 56. The 18
added are the ones a page is built from and whose props are JSON: `PageHeader`, `Heading`,
`Text`, `Stat`, `Status`, `Progress`, `Steps`, `Timeline`, `AvatarGroup`, `Image`, `Code`,
`Blockquote`, `List`/`ListItem`, and the `Card` parts. The MCP vocabulary follows through its
parity test.

**Two things deliberately not done:**

- **Charts are a decision for the maintainer.** Rendering `Kpi`, `LineChart` and the rest would
  make `@cascivo/render`, a published package in the fixed 1.x group, depend on
  `@cascivo/charts`, and every view-runtime consumer would pay for it. The cheaper alternative is
  an extension point: a host passes its own `components` to `<CascivoView>` (and the validator).
  That keeps the dependency where it is used.
- **Slot layouts** (`DashboardLayout`, `SettingsLayout`, `AuthLayout`) take `ReactNode` props,
  which a ViewConfig cannot express. They stay TSX-only.

**Open:** P2-6. The agent benchmark needs real model runs, which this environment cannot make.

### P2-1 ☑ Blueprint schema and parser

- **Change:**
  1. The `cascivo.app.json` schema (JSON Schema plus a `parseBlueprint(raw: unknown)` parser)
     has these fields: `name`, `target` (`spa|cloudflare|astro`), `theme`, `shell` (a layout
     block), `auth[]`, `pages[]` (`path`, `title`, `block|template`, `data`, `public`),
     `recipes[]` and `workspace`.
  2. Validation runs against the registry's closed vocabulary. An unknown block fails with the
     list of valid ones.

### P2-2 ☑ Compile a blueprint

- **Change:**
  1. `cascivo create --from cascivo.app.json` compiles a blueprint.
  2. The prompts of `npm create cascivo` produce a blueprint, which the same compiler consumes.
  3. Blocks are **wired** into routes and nav. They are not just dropped into `src/pages`.
  4. This closes the ROADMAP's `--router` item: routes come from the blueprint on every target.

### P2-3 ☑ `cascivo app add page|recipe`

- **Change:** additive edits that update the blueprint, routes and nav together.
- **Upgrades:** each generated file records `recipe@version` in `cascivo.lock`, so
  `cascivo update` three-way merges app-level files.

### P2-4 ☑ MCP `compose_app(blueprint)`

- **Change:**
  1. `compose_app` replaces `create_app` + `scaffold_view` + N × `add_to_project` for new apps.
     `create_app` stays as sugar.
  2. A `list_blocks` tool returns a one-line catalog of blocks, which is the only context an
     agent needs to write a blueprint.

### P2-5 ◐ The renderer covers what the blocks use

- **Finding:** research §1.4 defect 2, the root fix.
- **Change:**
  1. `<CascivoView>`'s `componentMap` grows to every component used by a block or template:
     AppShell, PageHeader, Heading, Text, Stat, CardHeader/CardTitle, and Kpi plus the charts
     through `@cascivo/charts`.
  2. Make `componentMap` generated rather than hand-maintained.

### P2-6 ☐ Agent benchmark

- **Finding:** research §6.
- **Change:**
  1. Run five fixed prompts headless against (a) today's surface and (b) blueprints.
  2. Record input and output tokens, wall time, `tsc` errors and `audit --ai` findings.
  3. Publish the results in `docs/BENCHMARKS.md`.
- **Verify:** the benchmark is repeatable from `apps/bench/`.

---

## Phase 3 — The opinionated workspace

**First slice shipped 2026-10-08:**

- **`cascivo create --workspace`** (P3-1) writes the ordinary scaffold into `apps/web`, adds
  `packages/ui` (`@<name>/ui`, already a dependency of the app) as the place to `cascivo add`
  into, and runs every package's scripts through Vite+ `vp run -r`. `cascivo app` keeps working
  from `apps/web`, because the app inside is unchanged. It needs `react-vite` or `cloudflare`;
  astro is refused with a message. MCP `create_app` and `compose_app` take `workspace: true`.
- **Quality and CI** (part of P3-2): a GitHub Actions workflow runs typecheck, lint, test and
  build. A React + Vite app gets Vitest with jsdom and a smoke test that renders the shell. The
  cloudflare app keeps the tests its Worker already has.
- **Agent files** (P3-3): every scaffold, workspace or not, ships `CLAUDE.md` (`@AGENTS.md`) and
  a `.mcp.json` that registers `@cascivo/mcp`. The workspace adds a short root `AGENTS.md` that
  points into the app's. A test holds the largest scaffold's `AGENTS.md` under 6 KB.
- **Verified:** `framework:check` creates a workspace for both frameworks with the built CLI,
  installs it from packed tarballs, and runs its typecheck, lint, build, test and `format:check`.

**Not done, and why:**

- **`packages/config` and a pnpm catalog** (P3-1). The app already carries its own ESLint,
  Prettier and tsconfig. Moving them into a shared package is only worth it with a second app,
  and a catalog only with a second package that pins the same dependencies.
- **Vitest browser mode, axe, Playwright, `theme-switcher`, `error-pages`** (P3-2). Each needs a
  browser download in CI or design work on a new page. They are separate recipes to add later.
- **AGENTS.md generated from recipes' `agentNotes`** (P3-3). The recipes do not carry
  `agentNotes` yet (P1-1 is still open), so the agent files stay hand-written templates.
- **P3-4** needs a new published package, `@cascivo/create`, because `vp create @cascivo` looks
  up `@cascivo/create` on npm. Publishing a new package is the maintainer's call.

### P3-1 ◐ `--workspace`

- **Change:** generates a monorepo with:
  - `apps/web`
  - `packages/ui` (the target for `cascivo add`)
  - `packages/config`
  - Vite+ 1.x and a pnpm catalog
- **Verify:** an `isolated:check`-style job builds the generated monorepo from packed tarballs.

### P3-2 ◐ Recipes for quality and CI

- **Change:**
  - `test-setup`: Vitest browser mode plus axe.
  - `e2e-smoke`: Playwright.
  - `ci-github`: `vp check`, `vp test`, `vp build` and `cascivo doctor --ci`.
  - `theme-switcher`.
  - `error-pages`.

### P3-3 ◐ Agent files

- **Change:**
  1. AGENTS.md is generated from the selected recipes' `agentNotes`, layered at the root and in
     each app.
  2. A two-line CLAUDE.md `@`-includes it.
  3. `.mcp.json` is pre-wired.
  4. A size budget test keeps these files short. This follows the ETH study cited in the
     research: context files that carry unneeded requirements cost tokens.

### P3-4 ☐ Vite+ org templates

- **Change:** publish `createConfig.templates`, so `vp create @cascivo` lists the cascivo
  templates.

---

## Phase 4 — Workbench

**First slice shipped 2026-10-08:**

- **P4-1 ☑** The registry's `files` list ends with each copied component's `<name>.meta.ts`,
  hashed. `cascivo add` copies it, and `cascivo update` writes it into components added
  before (a file new upstream is written, not merged). `init` installs `@cascivo/core`, which
  provides the manifest's `ComponentMeta` type, and the host lint gates already lint
  `.meta.ts`. `manifest-shipped.test.ts` (in `meta:check`) keeps it that way.
- **P4-2 ◐** `packages/workbench` (`@cascivo/workbench`, private for now) generalises
  `@cascivo/email-preview`'s bin and Vite plugin:
  - Entries are every `meta.examples[]` entry of every copied manifest, plus `*.preview.tsx`
    files with `previewProps`. Each entry has a URL (`#component/<path>/<n>`), which is what
    P4-3 and P4-5 need.
  - Each example compiles in a generated module per manifest. An example that is a snippet
    rather than one JSX expression is shown as code, so it cannot break its siblings. One that
    uses host state fails inside its own error boundary and names the tags no copied
    component exports.
  - Panels: theme × width, Code, Props, Tokens (resolved on the stage in the current theme),
    and copy-as-agent-context.
  - **Measured** against the repo's own `packages/components/src` (159 manifests, 358
    examples): 255 render, 6 are snippets, and 97 need host state or placeholder components
    (`isOpen`, `rows`, `<Slide1 />`). It found one real registry clash: `input-group` and
    `button-group` both export `ButtonGroup`. The workbench resolves each example's names
    from its own component first, so the clash no longer breaks those examples.
  - About 1.2k lines including tests and CSS, against the 3k kill criterion.
- **P4-6 ☑ (already shipped)** `apps/storybook/.storybook/main.ts` sets
  `features: { componentsManifest: true }`. Storybook builds `manifests/components.json` from
  the stories itself, and its schema is explicitly not public API, so cascivo does not emit a
  second copy.

**Second slice shipped 2026-10-08 (finishing the phase):**

- **P4-2 ☑** The remaining panels: **Controls** (from each prop's manifest type: string-literal
  unions, `boolean`, `string`, `number`, applied to the element the example returns) and
  **Markdown** (the stage through `@cascivo/text`'s `elementToMarkdown`, resolved from the
  project because `@cascivo/text` releases in lockstep with core). Every entry renders alone at
  `/?embed&theme=<name>#…`, and `/index.json` lists them: the "iframe URL per entry plus an
  index" §5.3 asked for.
- **P4-3 ☑** `cascivo-workbench test [dir]` checks every renderable entry × theme (default
  light and dark, `--themes all`) with axe's WCAG 2.x A/AA tags, over the whole embed document
  so overlays in portals count. `--screenshots <dir>` compares each entry's picture with a
  saved one; `--update` rewrites them. Entries that need host code are skipped and listed; any
  other render error fails.
  - **Diverged from the spec:** a Playwright loop over the index instead of Vitest browser
    mode. Browser mode would ask the project for a Vitest browser config, a provider package
    and test files; the loop needs only `playwright` and `axe-core`, and has the shape of the
    Storybook sweep it has to be compared with (P4-5). Screenshots compare bytes, not pixels,
    so baselines belong to one machine image, the same caveat as the repo's visual baselines.
  - **Measured** on the repo's 159 manifests, light + dark: 510 checks,
    103 entries skipped as needing host code, 13 failures. All 13 are real, and the Storybook
    sweep cannot see them:
    - light: `native-select` example 0 has no accessible name (`select-name`): the manifest
      example agents copy is inaccessible. `calendar` with a `defaultValue` puts an
      unsupported ARIA attribute on the selected day (`aria-allowed-attr`).
    - dark (Storybook checks light only): `color-contrast` in Button destructive, Link ×3,
      LogViewer ×2, Card in Stack and Indicator, FileUploader. Button destructive's cause:
      `--cascivo-color-text-on-destructive`'s static fallback is white, and only browsers
      with `contrast-color()` pick a dark text over the light-red dark-theme background.
- **P4-5 ☑ (running)** `.github/workflows/axe.yml` gains a non-blocking `workbench-shadow` job:
  the workbench sweep over `packages/components/src`, light theme only to match Storybook.
  Retire Storybook's sweep only if this one matches it for a full release cycle; the two light
  findings above are the first differences to resolve.
- **P4-4 ☒ not built.** `render_view_as_markdown` already validates and renders
  `{ component, props }`, and the tool list sits at 22,340 of its 22,500-byte budget, so a
  second tool for the same job would raise the budget for nothing. Revisit only if agents are
  seen wrapping single components in view configs often enough to matter.

**Still open:** blueprint pages rendered with fixtures (they need P2-5's renderer coverage),
and publishing `@cascivo/workbench` (the maintainer's call: it is `private` until then).

### P4-1 ☑ `cascivo add` copies `.meta.ts`

- **Finding:** research §1.4 defect 7.
- **Change:**
  1. The registry `files` list gains the manifest.
  2. `add` writes it next to the component.
  3. `update` merges it like any other file.

### P4-2 ☑ `@cascivo/workbench`

- **Change:** generalise `@cascivo/email-preview`'s Vite plugin and bin. Entries come from:
  - `meta.examples[]`,
  - `*.preview.tsx` files,
  - and blueprint pages rendered with fixtures.
- **Controls** come from prop schemas.
- **Panels:** theme × viewport × platform, the token inspector, the conformance validator,
  render-as-Markdown, and copy-as-agent-context.

### P4-3 ☑ `cascivo workbench test`

- **Change:** Vitest browser mode runs axe and `toMatchScreenshot` over the entries.

### P4-4 ☒ MCP `preview_entry(name, props)` (not built, see above)

- **Change:** returns validation results plus the Markdown render.

### P4-5 ☑ Shadow axe sweep

- **Change:** point `axe-sweep.mjs` at the workbench index alongside Storybook for one release
  cycle.
- **Decide:** retire Storybook only on parity.

### P4-6 ☑ Storybook components manifest

- **Change:** emit a Storybook-compatible components manifest from `.meta.ts`, for Storybook MCP
  and Chromatic users.
- **Kill criterion:** the workbench UI stays under roughly 3k lines with no per-framework
  integrations, or it folds into a Storybook addon.

---

## §6 — Finding → task map

| Research finding | Task |
| --- | --- |
| §1.1 single app; no tests, CI, CLAUDE.md, `.mcp.json`, Vite+, workspace or workbench | P3-1, P3-2, P3-3, P4-2 |
| §1.1 `--template` not wired into routes or nav | P2-2 |
| §1.1 react-vite has no router (ROADMAP item) | P2-2 |
| §1.1 auth, data and payments are Cloudflare-only | P1-4 (community recipes), P2-1 |
| §1.2 blocks, templates and app layer not composable | P1-2, P2-2 |
| §1.3 ~50–60k input and 6–10k output tokens per dashboard | P0-4, P2-4, P2-6 |
| §1.4.1 `generate` import paths (plus the `as ViewConfig` cast) | P0-1 |
| §1.4.2 validator ≠ renderer | P0-2 (vocabulary), P2-5 (root fix) |
| §1.4.3 `scaffold_view` stub with an invalid `layout` | P0-2, P2-4 |
| §1.4.4 `create_app` themes and template; `add_to_project` takes one name | P0-3 |
| §1.4.5 `llms.txt` MCP list incomplete | P0-5 |
| §1.4.6 broken Storybook links | P0-6 |
| §1.4.7 `.meta.ts` not copied | P4-1 |
| §1.4.8 stale Vite+ claim | P0-7 |
| §3.2 `create.ts` is 12.8k lines of string templates | P1-1 … P1-3 |
| §3.2 recipes as the ecosystem; shadcn compatibility | P1-4 |
| §3.3 surfaces (`--from`, `compose_app`, `app add`, `vp create`) | P2-2, P2-3, P2-4, P3-4 |
| §4 opinionated workspace; short agent files | P3-1 … P3-3 |
| §5.2 manifest-driven workbench | P4-1 … P4-4 |
| §5.3 internal Storybook decision; components manifest | P4-5, P4-6 |
| §6 make the claim measurable | P2-6 |
