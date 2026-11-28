# Proposal: cascivo as a rich-client framework

Status: draft for decision. Inputs: [01-inventory.md](01-inventory.md) (what we have) and
[02-landscape.md](02-landscape.md) (competitors, pains, differentiators). Paths are repo-relative.
This is a plan. Nothing here is implemented.

## 1. Verdict

- **Possible:** yes. Most of the parts exist. `@cascivo/app` has a signal router, typed API contract and realtime sync. `components` has about 150 owned React components (147 in `registry.json`) and a signal `createForm` with Standard Schema.
- **Worth it as "a React replacement":** no. A new renderer or language falls into the killer pattern in 02 §3: a better engine, no ecosystem. React teams will not leave React for 20% better DX.
- **Worth it as "the opinionated way to build React apps that agents get right":** maybe. It is worth it only if we prove one number: agents build correct rich-client apps with cascivo for clearly less cost and failure than with React + shadcn + TanStack.
- **No, unless X:** X = a pre-registered Phase 0 bake-off shows that cascivo is clearly cheaper per passing app (90% CI at least 15% better) with no lower pass rate, **against a React arm that gets equal grounding**. Without that, stop, and keep cascivo a design system.
- So the framework is **on React, not instead of React**. The renderer stays React; everything above it is ours and opinionated.

## 2. Thesis

React's weak points (02 §1) are not rendering. They are effects (top pain, 37%), assembling a
stack from five libraries, the server/client boundary (RSC, CVE-2025-55182), and, new in 2026,
what agents produce. We attack those four, and nothing else.

### A1. Agents ship correct apps at lower cost (the headline, must be measured)

One closed, documented vocabulary for the whole app (routes, data, forms, UI) that the registry,
MCP server and skills describe exactly. It is checked by gates that agents can run. An agent
picks fewer libraries, invents fewer APIs (02 §3, hallucination row) and makes smaller diffs. We
already ship most of the grounding (`registry.json`, `packages/mcp`, `skills/`, `llms`) and a
harness that measures it (`apps/bench/agent`, arms `cascivo` / `cascivo-bare` / `shadcn`). But
`apps/site/public/evals.json` has `latest: null`: **we have never published a number**. A1 is a
hypothesis until Phase 0.

### A2. No `useEffect` in application code, enforced (supporting, through A1)

Components read signals. Data comes from route loaders and a keyed query cache. Forms are signal
stores. DOM side effects go in `useSignalEffect`. App code has no `useState`, `useEffect` or
dependency arrays, and a lint rule rejects them. Library code already follows this rule
(`CLAUDE.md`). Be honest about the size: TanStack Query plus router loaders already remove most
fetch-in-effect, and a lint ban is a consistency rule, not a capability. A2 matters because one
shape per job makes agents and reviewers cheaper (A1). It is not an advantage on its own.

### A3. Owned, gated UI wired to the data layer (supporting)

Router, data, forms, auth, realtime, i18n, theming, about 150 accessible components, test helpers and
devtools, versioned together. A bundle alone is copyable: TanStack Start already ships router,
query, form and server functions together. The part TanStack does not have is the owned, gated UI
(WCAG 2.2, RTL, strict TS) bound to the data and form layers by props, plus the agent grounding. A React team today assembles React Router or TanStack Router,
TanStack Query, react-hook-form, zod, a UI kit, an i18n library and a test setup, and each one has
its own upgrade cycle (02 §1 row 6).

### A4. No wire protocol between server and client (supporting proof, not headline)

Rich clients are SPAs that call a typed JSON API (`defineApi` in `packages/app/src/contract.ts`).
There is no RSC, no Flight and no server-side deserialisation of component trees. This is a
security line for buyers in regulated sectors, and it makes the mental model smaller. Per 02 D8 it
is easy to copy, so it supports A1-A3 and is not a reason on its own.

### What we explicitly will NOT do

| Not doing | Why |
|---|---|
| Our own renderer, VDOM or compiler for the web client | Killer pattern. React is the interop and hiring story |
| A new client language (`.cv` with handlers for web apps) | `.cv` stays static (`docs/USING-CASCIVO-HTML.md`). Interactivity in `.cv` is `cascivo-blitz` (desktop), not this track |
| SSR or streaming for app routes (proposed; your decision, §7.2) | Right for the recommended wedge (tools behind a login): public pages use `cascivo-web` or a static shell, and hydration stops being a problem. Wrong for general SaaS (SEO'd app pages, first paint on slow devices, share previews), so it depends on the wedge |
| A sync engine | 02 D6: suicide. We keep `app/sync` rooms. Third-party engine adapters come later, only on pilot demand |
| Angular interop or Angular components | Angular teams migrate by rewrite. `@cascivo/elements` is the only bridge |
| Making Solid, htmx or Rust part of this framework's pitch | Those stay separate products (hypermedia track). Five targets in one pitch is the breadth risk in 02 §5 |
| Spec-first app generation (02 D7) now | No evidence that it beats code-first. Revisit after Phase 2 data |
| React Native or mobile | Out of scope |

## 3. Opinionated architecture

One package grows: `@cascivo/app` (`packages/app`). New subpaths: `./query`, `./form`,
`./testing`, `./devtools`. `@cascivo/core` keeps its rule of no runtime dependency beyond
`@preact/signals-react` and gets only primitives that every layer needs.

### 3.1 Rendering model

React 19 renders. It is client-only (`createRoot`); app routes have no SSR (if §7.2 picks the tools wedge). Fine-grained updates
come from `@preact/signals-react`. A component that reads `signal.value` calls `useSignals()`, the
convention already used in `apps/examples/*` (`CLAUDE.md`, "React apps"). We do not use a Babel
signals transform: it is one more toolchain part, and the explicit call is greppable and
lint-checkable. React Compiler is allowed and not required. Local state uses `useSignalState`.
The cost: a component that forgets `useSignals()` silently stops updating, which is the kind of
footgun A1 claims to remove. The lint rule `signals-require-use-signals` (3.8) is therefore
mandatory, and P0 includes a spike under React 19.2 plus the Compiler (§5).

### 3.2 Reactivity: signals for state, FSM for flows

- Signals are the only state primitive: `signal/computed/batch` (`packages/core/src/signals.ts`).
- Shared state is a module-level signal or a `createScope` scope (`packages/core/src/scope.ts`).
  There is no global store library and no Context for state.
- Multi-step flows (checkout, wizard, upload, auth) use `createMachine` (`packages/core/src/machine.ts`).
  Transitions are pure `transition` from `@cascivo/core/pure`, so they are unit-tested without React.
- Rule for agents: if a state has more than two booleans that can conflict, it is a machine.
- New core primitive: `resource(fetcher)` returns signals `{ data, error, status }` with
  cancellation through `AbortSignal`. The query layer is built on it. It is catalogued in
  `docs/HEADLESS.md` (enforced).

### 3.3 Components

- The components in `packages/components` stay the UI. They are owned code from `cascivo add`,
  and no component is forked for the framework.
- Binding is by props, not by new component flavours. `form.field('email')` returns props to
  spread onto `<Input>`. `query.bind()` returns `{ items, loading, error }` for `DataTable`,
  `Combobox` and charts.
- The `cv-*` contract (`docs/CONTRACT.md`) stays the styling seam. Here it is an escape hatch
  ("no restyle if you leave"), not a selling point.
- Blocks and layouts (`app-shell`, `dashboard`, `settings`) become the default route shells.

### 3.4 Routing

Extend `packages/app/src/router.tsx`. Do not replace it.

- **Nested layouts:** a route has `children` and a layout renders `<Outlet />`. File routes
  (`packages/app/src/vite.ts`) map `_layout.tsx` to the layout.
- **Loaders:** `loader({ params, search, signal })` runs before render, in parallel down the tree,
  and returns query handles, not raw data. Navigation waits for loaders, with a `pending` signal
  for the transition UI. This replaces fetch-in-effect.
- **Typed search params:** a Standard Schema per route. `search` is a parsed, typed signal.
- **Guards:** `beforeLoad` can redirect (auth, feature flags from `app/flags`).
- **Prefetch on intent:** `<Link>` runs the loader on hover or focus.
- View transitions stay as they are (`router.tsx`).

### 3.5 Data and sync: `@cascivo/app/query`

- A keyed cache on top of `resource`. Keys derive from the `defineApi` endpoint and its input, so
  agents never invent cache keys.
- `query(endpoint, input)` dedupes, revalidates in the background, has a stale time per endpoint
  and retries with backoff. It returns signals.
- `mutation(endpoint, { optimistic, invalidates })`: an optimistic patch is a pure function on the
  cached value, and it rolls back on error. `invalidates` lists endpoints, not string keys.
- Realtime: `app/sync` (`connectRoom`) and `app/live` can push into the cache, so the UI reads one
  source.
- Offline (Phase 3, opt-in): the cache persists through `@cascivo/storage` (`indexedDBDriver`,
  `packages/storage/src/indexed-db.ts`). Queued mutations replay on reconnect. This is
  single-writer data only (drafts, own settings). Shared records need version-checked
  mutations: the server answers 409 and the UI shows a `conflict` signal. Never last-write-wins on
  shared data, which silently loses edits. No CRDTs.
- Non-cascivo backends: `defineApi` can describe any REST API on the client side only, so the
  cache works without our Worker.

### 3.6 Forms: `@cascivo/app/form`

- Do not invent a second form store. Promote `createForm` from `packages/components/src/form/form.tsx`.
  It already has signals, `touched`, Standard Schema (`standard-schema.ts`) and
  `validateOnChange`. Move it to `@cascivo/app/form` and keep the old path as a re-export.
- Add `dirty`, field arrays, and submit through a `mutation` (pending state, optimistic update,
  invalidation for free).
- One error shape across stacks. Today they differ: `cascivo-server` has per-field lists of
  i18n key plus args (`Msg`, `FormErrors` in `crates/cascivo-server/src/forms.rs`), and
  `@cascivo/solid` has plain message strings (`FieldErrors` in `packages/solid/src/form.ts`).
  Adopt the Rust shape (key plus args, per field, plus form-level) as the 422 body in the API
  contract, and map it onto `createForm` errors. Solid moves to it later.

### 3.7 Server integration

- **Default backend:** a Cloudflare Worker in TypeScript, `createHandler` from `@cascivo/app/api`,
  with the existing `db` (D1), `auth`, `jobs`, `uploads`, `flags` and `guard`. One contract, types
  end to end, and no codegen.
- **`cascivo-server` / `cascivo-worker` (Rust):** not in the default path. They remain the
  hypermedia track. Phase 4 (only on demand): export the `defineApi` contract as JSON Schema
  so that an axum backend can be checked against it in a conformance test, like
  `check_fragment`. We do not generate Rust code.
- **Any other backend:** a client-only contract (see 3.5).

### 3.8 Build and toolchain

- Vite only. One preset, `cascivoApp()`, puts together the existing plugins: file routes
  (`@cascivo/app/vite`), CSS scoped names (`@cascivo/css/vite`) and `@cascivo/vite-plugin`. No
  bundler of our own.
- `npx cascivo create my-app --framework cloudflare` already exists. It becomes the framework
  scaffold, with lint, tests and devtools wired.
- Adopter lint: add rules to `@cascivo/eslint-plugin` (today it has only `prop-vocabulary` and
  `token-values`): `no-react-state-hooks` in app code, `signals-require-use-signals`, and
  `no-fetch-in-component`. These rules are the enforcement for A2, and agents get the same errors
  as people.

### 3.9 Testing and devtools

- `@cascivo/app/testing`: `renderRoute(path, { api })` with a memory router; `fakeApi(contract)`
  builds typed fakes from `defineApi`; query and form helpers to wait for idle. Machines are tested
  with pure `transition` and no DOM.
- E2E: Playwright, the same way as `apps/bench/agent` `EVAL.ts`. We document the setup; we do not
  build a new runner.
- `@cascivo/app/devtools`: an in-page panel (dev only) for the route tree, loader timing, the cache
  (keys, staleness, in-flight), forms and the signal graph of a component.
- **The same data through MCP.** The dev server exposes a read-only local endpoint, and the
  `cascivo` MCP server gets an `app_inspect` tool. An agent can see "this query errored with 422",
  and does not have to guess from a screenshot. `packages/render/src/a2ui/webmcp.ts` is a precedent.

### 3.10 AI-first story (concrete, measurable)

1. **Closed vocabulary.** Every app-level API (route options, query, mutation, form, machine) has
   a `.meta`-style manifest. `pnpm regen` turns it into `registry.json`, llms files and schemas,
   the same pipeline as components. An agent reads it through MCP, so it does not depend on
   training data. This targets the cold-start handicap in 02 §3.
2. **Skill:** `skills/rich-client/SKILL.md` covers how to add a route, a loader, a mutation and a
   form, with the exact files to touch. Today there is no rich-client skill (01 §2).
3. **Gates as tools:** MCP `app_check` runs typecheck, the adopter lint rules and tests, and
   returns structured errors. The agent loop is "edit, `app_check`, fix", not "run and look".
4. **Recipes, not freedom:** extend `cascivo generate` (today it renders a JSON view,
   `packages/cli/src/commands/generate.ts`) with `route`, `resource` and `form` recipes that write the canonical shape.
   Less invention means fewer tokens and fewer bugs.
5. **Measured:** every phase ends in the `apps/bench/agent` eval with a rich-client task set. We
   publish the result even when it is bad.

## 4. React interop and migration

Incremental adoption is mandatory. Each step can ship on its own and be reverted on its own.

| Step | What the team does | Works inside |
|---|---|---|
| 1. UI | `cascivo add` components, themes and tokens | Any React app (Next, Vite, Remix) |
| 2. Forms | `@cascivo/app/form` with their existing schema (zod, valibot: Standard Schema) | Any React tree, no router needed |
| 3. Data | Describe existing REST endpoints with client-only `defineApi`; use `query`/`mutation` on new screens | Any React tree. It runs next to TanStack Query and does not share its cache, so one endpoint must live in one cache only (lint-checked by endpoint) or reads go stale |
| 4. Routes | Mount `<CascivoRoutes base="/new">` under a catch-all route of React Router, TanStack Router or a Next client page. The host owns history; our router reads it through an adapter and never pushes on its own | A subtree of the host router. This is the riskiest step (two link systems, two caches) |
| 5. Shell | Move the app root to the cascivo router and the `cascivoApp()` preset; the old routes become legacy subtrees | Full adoption |
| 6. Backend (optional) | Move endpoints into a Worker `createHandler` behind the same contract | When the team wants it |

Rules for interop:

- `@cascivo/core` signals work in any React 18 or 19 tree (`useSignals()`). No provider is needed
  at the root, except `ThemeProvider` for theming.
- The link seam (`packages/core/src/link.ts`) lets cascivo components use the host router's
  `<Link>` during steps 1-4.
- Codemods (Phase 3): `useState` to `useSignalState`, react-hook-form to `createForm`, and
  TanStack `useQuery` to `query` for the common shapes. The skill `skills/cascivo-migrate-from-shadcn`
  is the template.
- Proof of migration: an external, effect-heavy React app (an open-source admin app picked by the
  outside reviewer), converted step by step, one PR per step, each with green CI. Our own
  examples do not count: `apps/examples/track` and `track-lite` already have zero
  `useState`/`useEffect`.

## 5. Phased roadmap

Sizing assumes 1-2 engineers plus agents, while the design system is kept up. "w" = weeks.

P0 rules (pre-registered: tasks, thresholds and analysis are committed before any run):

- At least 10 attempts per task, arm and model; Sonnet and Haiku plus one non-Anthropic model
  (the harness runs Claude only today, `apps/bench/agent/src/models.ts`, so this is harness work).
- Metric: median cost per passing app with a bootstrap 90% CI. Pass: the CI upper bound is at
  least 15% cheaper than the best React arm, and pass@1 is not lower at the 90% level.
- Equal grounding: the `react-tanstack` arm gets Context7 plus TanStack's llms.txt, with a context
  budget equal to cascivo's 21 MCP tools and `AGENTS.md`.
- Time box 4 weeks and a fixed token budget (set in §7.3). Over budget means stop.

| Phase | Deliverables | Proof that ends the phase | Size |
|---|---|---|---|
| **P0a Grounding test** | Pre-registration; harness changes (attempts, third model, CI analysis); 3 rich-client tasks (master-detail, optimistic edit, multi-step form); a `react-tanstack` arm (TanStack Router/Query + react-hook-form + shadcn) with equal grounding. Run on today's surfaces, no prototype. Spike: `@preact/signals-react` under React 19.2 plus the Compiler | Published `evals.json`. Tells whether grounding alone wins. Spike: no lost updates in the eval apps | 3-4w |
| **P0b Framework test** | The smallest prototype of query + loaders, frozen; then the outside reviewer writes 3 held-out tasks | **Gate** (P0 rules above) on the held-out tasks. Else stop (§6) | 2-3w |
| **P1 Core layers** | `resource` in core; `app/query`; `app/form` (promoted `createForm` plus `dirty`, arrays and mutation submit); nested layouts, loaders, typed search, guards and prefetch in the router; the 3 adopter lint rules | Rewrite the 3 P0 tasks' best `react-tanstack` solutions in P1: fewer non-blank LOC (as counted in `docs/COMPARE-REACT-VS-HTMX-SOLID.md`) and at most 1 effect escape per 1k LOC. Bundle delta ≤ +15 kB gzip vs a plain `@cascivo/app` scaffold | 8-10w |
| **P2 Agent loop** | `skills/rich-client`; app API manifests in `pnpm regen`; MCP `app_check` and `app_inspect`; `@cascivo/app/testing`; devtools panel; the `cascivoApp()` preset; `cascivo generate` recipes | Eval v2 on 8+ tasks. cascivo is at least 30% cheaper per pass than `react-tanstack`, with pass@1 equal or higher, on 3 models, same P0 rules. Human check: 3 developers new to cascivo each build the `admin-console` task in under 1 day | 8-10w |
| **P3 Migration and offline** | `<CascivoRoutes>` subtree mount; codemods; persisted cache plus mutation queue; migration guide | The external app from §4 migrated in shippable PRs; a test shows no duplicate fetch and no stale read across the host/cascivo boundary. One external pilot team runs a real screen in production for 4 weeks. Codemods only for shapes the pilot asks for | 10-12w |
| **P4 On demand** | JSON Schema contract export with axum conformance; one sync-engine adapter | Only if 2 or more pilots ask | open |

Total to a credible v1 (P0-P3): 9-12 months. P0 alone is about 6-7 weeks and decides the rest.

## 6. Risks and kill criteria

### Risks

| Risk | Mitigation |
|---|---|
| A1 is false: grounding does not beat React's training-data lead | P0 is first and cheap. The kill criterion is a number |
| Benchmark gaming: tasks written to suit us | Tasks reviewed by someone outside the project. Use the existing hidden-EVAL design. Include a `react-tanstack` arm built by its own idioms. Publish losses |
| `@preact/signals-react` breaks with React 19.x or React Compiler, or forgotten `useSignals()` loses updates | P0a spike; lint rule; test against React canary in CI. Fallback is `useSyncExternalStore` bindings in `core` with the same API. Kill criterion 6 |
| Scope creep into SSR, sync and Rust | The "will NOT" table is the policy. A change to it needs a written decision |
| Small team, wide surface (02 §5) | Freeze new targets (Solid, elements, `.cv`, TUI, Blitz) at maintenance while this runs |
| Ecosystem and hiring: "nobody knows cascivo" | It is React. Hiring is React hiring; the opinions are learned in a day, or by the agent from MCP |
| TanStack Start is the default competitor, not a hypothetical one: it already bundles router, query, form and server functions | Our edge is owned, gated UI plus agent grounding, not any layer. The `react-tanstack` arm is the baseline in every gate |

### Kill criteria (any one stops the framework track)

1. P0b: the gate fails (90% CI upper bound less than 15% cheaper than `react-tanstack` with equal
   grounding, or pass@1 lower).
2. P0: over the 4-week time box per sub-phase or over the token budget.
3. P2: the advantage falls below the P0 gate on the larger task set.
4. P1: the rewrites are not smaller, or need more than 1 effect escape per 1k LOC.
5. P3: no external pilot after 8 weeks of trying.
6. P0a spike: signals lose updates under the Compiler, and the `useSyncExternalStore` fallback is
   measurably slower in the eval apps (threshold set in pre-registration).
7. Any time: framework work stops the design-system releases for more than one cycle.

If the track is killed, keep `query`, `form` and the lint rules as ordinary `@cascivo/app`
features. They help existing adopters anyway.

## 7. Open decisions for you

1. **Accept "on React, not instead of React"?** This proposal depends on it. The alternative is a
   new renderer, and the proposal argues against it.
2. **Wedge segment and SSR:** internal tools, dashboards and admin apps built with agents, with no
   SSR (recommended), or general SaaS frontends, which then need an SSR story?
3. **The P0 gate and budget:** is "90% CI at least 15% cheaper" the right bar, what is the token
   budget, which non-Anthropic model, and who is the outside task reviewer?
4. **Freeze the other targets** (Solid, elements, `.cv`, TUI, Blitz) at maintenance during P1-P3?
5. **Cloudflare as the default backend**, or backend-neutral from day one (more work in P1)?
6. **Naming:** keep `@cascivo/app`, or a new framework name for marketing?
