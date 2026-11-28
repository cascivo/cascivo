# Proposal: livo, the cascivo client framework

Status: draft for decision, revision 2. Inputs: [01-inventory.md](01-inventory.md) (what we have)
and [02-landscape.md](02-landscape.md) (competitors, pains, differentiators). Paths are
repo-relative. This is a plan. Nothing here is implemented.

Revision 2 applies your answers to the first draft: livo is its own client framework, not a layer
on React (answer 1). The wedge is internal tools, dashboards and admin apps built with agents, with
no SSR (2). The P0 gate stands (3). Solid, elements, `.cv`, TUI and Blitz are not frozen (4).
Cloudflare is the default backend (5). The name is in §3.1 (6).

## 1. Verdict

- **Possible:** yes. The parts that are hard to copy exist already: 214 registry items
  (147 components, 25 charts, 14 layouts, 10 blocks, 10 flow, 6 sections, 2 editors), a framework-neutral markup and CSS contract
  (`docs/CONTRACT.md`), pure state machines (`@cascivo/core/pure`), a Cloudflare backend in
  `@cascivo/app` (D1, Durable Object sync, auth, Access, uploads, jobs) and agent grounding
  (`registry.json`, `packages/mcp`, `skills/`).
- **The honest critique still holds:** a new framework is the killer pattern in 02 §3, a better
  engine without an ecosystem. A faster renderer is worth 20% at best, and nobody switches for
  that. Solid, Svelte and Vue Vapor already have the fine-grained engine.
- **So the engine is not the product.** livo borrows a proven compile model, and its own value is
  in three things no React stack has together: (B1) one checked app graph, from D1 schema to
  screen; (B2) every query is live by default on Durable Objects; (B3) agents get the whole
  framework as a closed, verifiable vocabulary. §2 says why each is more than 20%.
- **It wins without a big ecosystem by renting one:** registry components, `cv-*` markup,
  elements, any React component (in both directions), and agents that port what is missing (§4).
- **No, unless X:** X = the pre-registered P0 bake-off (§5): a 90% CI at least 15% cheaper per
  passing app than React + TanStack + shadcn, pass@1 not lower, equal grounding. If not, stop.
  The React design system goes on as before.

## 2. Thesis: fundamentally better for one job

The job: an agent, with a person reviewing, builds and changes an internal tool. For example, an
issue tracker, a back-office CRUD app, an ops dashboard, an approval flow. These apps are
login-only (no SEO, no SSR), mostly forms and tables over a database, multi-user, and changed
often. Today the agent assembles React, a router, TanStack Query, react-hook-form, zod, shadcn, an
API layer, migrations and a realtime layer, and writes the glue between them. Most agent tokens
and most review bugs are in that glue. livo removes the glue.

### B1. One app graph, checked end to end (the 10x claim)

A **resource** is one TypeScript file: a Standard Schema, permissions and the default views.

```ts
export const issues = resource('issues', {
  schema: v.object({ title: v.string(), status: v.picklist(['todo', 'done']), due: v.date() }),
  access: { read: 'member', write: 'member', delete: 'admin' },
  views: { list: ['title', 'status', 'due'], detail: 'all' },
})
```

From it, `livo generate` writes owned code (not runtime magic): the D1 migration, typed API
endpoints, a live query, a form, the `DataTable` columns and the routes. `livo check` then checks
the whole graph: route links, API calls, form fields, permissions, i18n keys and component props.
It returns errors with "did you mean" hints, the same design as the `.cv` catalog
(`crates/cascivo-html/src/catalog.rs`), scaled from one page to one app. "Add a `priority`
field" is one edit plus `generate`. In the React stack it touches the migration, the API, the
query, the form schema, the form UI and the table, which is six files.

Caveat: part of this win is codegen, and codegen is not unique to livo. P0 therefore runs a
livo arm without `generate` as well, and gives the baseline a scaffolder (§5). The framework only
counts as better if the no-generate arm also wins.

Precedents are honest warnings: Rails scaffolds and Django admin (generation works, but is not
typed end to end), Wasp (a full-stack DSL, small adoption: a new language), Refine and React-admin
(CRUD on React, no backend), TanStack Start plus TanStack DB (live collections and optimistic
updates on React), Retool (the real competitor in this wedge: low-code, not owned code).
livo keeps TypeScript, so there is no new language, and the output is code the team owns.

### B2. Live by default on Cloudflare

Each resource has one Durable Object room per tenant. Every write goes through the room,
including jobs and migrations (they call the room, not D1). The room validates, checks the record
version, writes D1 and broadcasts a patch. The client cache subscribes, so every list and detail
view is live. There are no cache keys, no invalidation lists and no polling. A write that bypasses
the room is not live; `livo check` flags direct D1 writes to a resource table.

This is mostly **new work**. Today's `SyncRoom` (`packages/app/src/sync-server.ts`) is a
key/value and presence room in Durable Object storage. It has no schema, no versions, no D1 write
path and no conflicts. What we reuse is the transport (`connectRoom`, `defineLive`), `db.ts` and
the `*-server` subpaths. One room is single-threaded, so one tenant's resource has a write ceiling.
Internal tools write rarely, but P0a measures the ceiling and the cost, and a hot resource can
shard rooms by record range later. Convex sells the same reactive backend and is self-hostable,
but it is its own database and runtime. Here it is the team's D1 on their Cloudflare account.

### B3. Agents get a closed, verifiable framework

Every public API (resource, route, query, form, machine, component) has a manifest in the
`.meta.ts` style. `pnpm regen` turns the manifests into the registry, llms files and schemas,
the same pipeline as components. The MCP server gains `app_check` (structured errors from
`livo check`, typecheck and tests) and `app_inspect` (the live route tree, queries, forms and
machines of the running dev app). The agent loop is "edit, `app_check`, fix", not "run and look".
This is the only answer to the cold-start problem in 02 §3: a new framework is not in training
data, so it must be cheaper to learn from its own grounding than React is to remember.
`apps/site/public/evals.json` still has `latest: null`, so B3 is a hypothesis until P0.

### B4. No re-render model, no effects (supporting)

Components run once. Reading a signal in JSX binds that DOM node only. App code has no effect
hook, no dependency array and no stale closure, because the API does not have them (DOM side
effects go in `onMount` or bindings). This removes React's top pain (effects, 37%, 02 §1) by
construction, not by lint. Solid and Svelte already do this, so B4 supports B1-B3 and does not
sell on its own.

### How livo beats the killer pattern

| Survivor trait (02 §3) | How livo gets it |
|---|---|
| Distribution | Agents are the channel: MCP plus skills make livo the stack an agent picks when told "internal tool on Cloudflare". Also a Workers deploy template |
| Easy on-ramp | `npm create` to a deployed, Access-protected app with one resource |
| One acute pain, 10x | Glue code in agent-built CRUD apps (B1, B2), measured in P0 |
| Ecosystem | Rented (§4): registry, `cv-*`, elements, React islands, agent ports |
| No rewrites | Interop both ways (§4). A livo screen mounts in a React app, and React components mount in livo |

### What we explicitly will NOT do

| Not doing | Why |
|---|---|
| Write our own JSX compiler or DOM diffing | Borrow the dom-expressions compile model (§3.2). The engine is not the moat |
| A new client language (`.cv` with handlers) | Cold start with LLMs (02 §3) and the Elm lesson. TSX stays the source |
| SSR, streaming, hydration | Not needed for login-only tools (your answer 2). The shell is static HTML |
| Our own sync engine or CRDTs | 02 D6. Durable Object rooms with server authority are enough for this wedge |
| WebAssembly in the browser | Bundle size and JS interop cost. Rust stays on the server and in tooling (§3.9) |
| General SaaS, mobile, Angular interop | Out of the wedge. Revisit after pilots |

## 3. Architecture

### 3.1 Name and packages

Recommended name: **livo** (`@cascivo/livo`). Reasons and the other candidates are in §3.12.

| Package | Contents |
|---|---|
| `@cascivo/livo` | Runtime: `render`, control flow (`<Show>`, `<For>`, `<Switch>`), `onMount`, `onCleanup`, router, query, form, resource client |
| `@cascivo/livo/vite` | Vite preset: JSX compile, file routes, scoped CSS names (`@cascivo/css/vite`) |
| `@cascivo/livo/server` | Worker side: resource handlers and the resource Durable Object, built on `@cascivo/app` server subpaths |
| `@cascivo/livo/testing` | `renderRoute`, `fakeResource`, wait-for-idle helpers |
| `@cascivo/livo-ui` (registry target) | The ported components, distributed by `cascivo add --target livo` |

`@cascivo/app` keeps its React client (router, `createClient`) for React adopters. Its server
parts become livo's backend unchanged.

### 3.2 Rendering: compiled, fine-grained, no VDOM

- TSX compiles to template cloning plus per-node bindings with `babel-plugin-jsx-dom-expressions`.
  This is the compiler behind Solid. Its `moduleName` option points the emitted helpers at any
  runtime module. That module is a real runtime, not a thin adapter: it must export `template`,
  `insert`, `spread`, `createComponent`, `delegateEvents` and the attribute helpers, plus root,
  effect and memo with ownership and cleanup.
- Components are plain functions that run once. Props are reactive getters. Lists use keyed
  `<For>`; conditionals use `<Show>`. There is no VDOM and no reconciliation.
- **Own runtime or Solid's?** The runtime surface is large: root and owner tree, `onCleanup`
  disposal, context, error boundaries, `untrack`, `batch`, and disposal inside `<For>` and
  `<Show>`. `@preact/signals-core` has effect disposal but no owner tree, so an own runtime is most
  of Solid rebuilt. Its one gain is a single signal graph with `@cascivo/core` (through
  `@preact/signals-react`) and `@cascivo/elements` (directly), and only if the package manager
  dedupes `@preact/signals-core` to one copy. Solid's runtime plus the existing `fromSignal` bridge
  (`packages/solid/src/signals.ts`) gets most of that interop. P0a spikes both for one week each
  and picks by a fixed rule: leak test passes, island interop works, bundle in budget, then the
  smaller maintained surface. Either way the public API is livo's, so the engine can be swapped.
- Bundle budget: runtime plus router plus query at most 15 kB gzip (measured in P0, kill
  criterion 8).
- Reactivity rules in `livo check`, like eslint-plugin-solid's `reactivity` rule: no destructured
  props, no signal read outside a tracked scope, no `useState`, `useEffect` or `className`. These
  React habits type-check, so the rules are the main defence against cold start.

### 3.3 Reactivity: signals for state, FSM for flows

- Signals are the only state primitive: `signal`, `computed`, `batch`, `effect` (library code
  only) from `@preact/signals-core`, the graph that `packages/core/src/signals.ts` reaches through
  `@preact/signals-react`.
- Shared state is a module-level signal or a scope (the `createScope` idea from
  `packages/core/src/scope.ts`, without React context).
- Multi-step flows use `createMachine` and pure `transition` from `@cascivo/core/pure`. The
  machines are React-free already, and `@cascivo/elements` uses them today
  (`packages/elements/src/base.ts`). Rule for agents: more than two booleans that can conflict
  means a machine.
- New neutral primitive `resource(fetcher)`: signals `{ data, error, status }`, cancellation by
  `AbortSignal`. It goes in `@cascivo/core/pure` and is catalogued in `docs/HEADLESS.md`.

### 3.4 Language and toolchain

- **Source:** TypeScript and TSX, strict, the same config as the repo. Agents know TSX. The
  differences from React (`class` not `className`, no hooks, props are not destructured) are in
  the manifests and checked by `livo check`.
- **Build:** Vite and Rolldown through vite+ (`vp`). P0 uses the Babel plugin. If build time
  matters later, port the transform to an Oxc plugin in Rust (P4, only with evidence).
- **`livo check`:** TypeScript first, as a `tsc`-backed program plus graph rules. It runs in the
  CLI, in `pnpm ready`-style gates and through MCP.
- **Rust:** server (optional `cascivo-worker` backend, §3.8) and tooling only. No Rust in the
  client.

### 3.5 The 147 components: neutral contract plus agent port

Decision: **port with agents behind a conformance gate; no general React-to-livo compiler.**

- A compiler is not credible. Our components are written in a strict subset (signals, no
  `useState`/`useEffect`), but they still use React-only patterns: `useRef` in 46 files,
  `forwardRef` in 22, `useId` in 29, and `Children`, `cloneElement`, `isValidElement` or
  `createContext` in 15 (non-test files in `packages/components/src`). They also assume run-per-render, so a mechanical compile would be wrong
  in the subtle places.
- Most of a component is already neutral: the `.meta.ts` API, the CSS module and the `cv-*`
  markup, the i18n keys (`builtin.<component>`) and, for 11 components, a pure machine. Only the
  view is per target. We make that explicit: a component directory holds the neutral parts plus
  one view per target (`button.tsx`, `button.livo.tsx`).
- **Conformance gate:** for every fixture in the component's tests, the React view and the livo
  view render the same `cv-*` DOM (classes, `data-*` state, ARIA). Static DOM does not prove
  behaviour, so each component also gets shared interaction scripts (keyboard, focus, roving,
  typeahead, `showModal`, popover dismissal) that run unchanged against both views. The gate runs
  in `pnpm ready`. It is what makes an agent port safe to merge.
- **Order:** 10 in P0b, then about 20 wedge components in P1 (inputs, select, combobox, checkbox, dialog, menu,
  tabs, toast, data-table, pagination, app-shell, dashboard and settings layouts, 6 charts).
  The factory (`scripts/factory/backlog.json`) ports the rest on demand. Until a port exists, the
  React component runs as an island (§4.2).
- **Authoring:** React first until the P2 eval passes. Only then do new components get both views
  from day one. Two views are permanent double maintenance, so the flagship is not taxed before
  the framework has earned it (kill criterion 5 tracks the drift).

### 3.6 Routing

- A new router in the livo runtime. It reuses typed path params (`packages/app/src/path.ts`) and
  the file-route idea (`packages/app/src/vite.ts`): `_layout.tsx` for nested layouts, `<Outlet>`.
- `loader({ params, search, signal })` runs before render, in parallel down the tree, and returns
  query handles. A `pending` signal drives transition UI. Search params are typed by a Standard
  Schema per route.
- `beforeLoad` guards redirect (session, role, flags from `@cascivo/app/flags`). `<Link>` is
  typed against the route tree and prefetches on hover or focus. View transitions as today.
- Resource routes (`/issues`, `/issues/:id`, `/issues/:id/edit`) are generated by B1 and are
  ordinary files after that.

### 3.7 Data, forms and live updates

- `query(resource.list, input)` and `query(endpoint, input)` return signals. Keys derive from the
  contract, so no code names a cache key. Dedupe, stale time per endpoint, retry with backoff.
- On a resource, the query subscribes to its room (B2). Patches update the cache in place.
  Optimistic `mutation` patches are pure functions, confirmed or rolled back by the room's answer.
  The room serialises writes, so there is no last-write-wins.
- An open form holds a snapshot with the record version. Live patches never rewrite it; they set a
  `changedRemotely` signal per field. On submit, a stale version gets a 409 with the current
  record, and the form shows a field diff (keep mine, take theirs). Whole-record versions in v1;
  per-field merge only if pilots need it.
- Plain endpoints (`defineApi`, `packages/app/src/contract.ts`) get the same query without
  live updates, with `invalidates` listing endpoints. A non-Cloudflare REST API works the same
  way, described on the client only.
- Forms: one neutral form store in `@cascivo/core/pure`, from today's `createForm`
  (`packages/components/src/form/form.tsx`: signals, `touched`, Standard Schema,
  `validateOnChange`) plus `dirty`, field arrays and submit through a mutation. The React and
  livo bindings are thin. The 422 body is the `cascivo-server` shape (per-field i18n key plus
  args, `crates/cascivo-server/src/forms.rs`), so the Rust backend and `@cascivo/solid`
  (`packages/solid/src/form.ts`, plain strings today) can converge on it.
- Offline (P4, opt-in): persisted cache with `indexedDBDriver` (`packages/storage`) and a queue
  for single-writer data only.

### 3.8 Backend: Cloudflare by default

| Need | Cloudflare part | Existing code |
|---|---|---|
| API and static shell | Worker (assets plus handler) | `@cascivo/app/api` `createHandler` |
| Records | D1 | `@cascivo/app/db` (`defineTable`, `migrate`) |
| Live resources, write order | Durable Objects | `@cascivo/app/sync-server`, `live-server` |
| Sessions, flags | KV | `@cascivo/app/auth-server`, `flags`; `cascivo-worker` `kv.rs` |
| Files | R2 | `@cascivo/app/uploads-server`; `cascivo-worker` `r2.rs` |
| Auth for internal tools | Cloudflare Access | `requireAccess` (`packages/app/src/guard.ts`) |
| Background work | Queues, cron | `@cascivo/app/jobs-server` |

- **One contract, two implementations.** Resources export JSON Schema plus an endpoint list. The
  TypeScript Worker (`@cascivo/livo/server`) is the recommended default: types flow from the
  resource file to the screen with no codegen, and agents write one language. `cascivo-worker`
  (Rust) implements the same contract for teams that want Rust, checked by a conformance suite
  like `check_fragment`. It needs a Durable Object abstraction first (01 §3). Which one is the
  default is open (§7.2).
- No SSR: the Worker serves a static HTML shell and the bundle. The shell, login and error pages
  can be generated by `cascivo-html` from `.cv`.

### 3.9 Testing, devtools, agent loop

- `@cascivo/livo/testing`: `renderRoute(path, { resources })` with a memory router and an
  in-memory fake of the resource rooms, so tests need no Worker. Machines are tested with pure
  `transition`.
- E2E: Playwright with Wrangler's local runtime, the pattern of `apps/bench/agent` `EVAL.ts`.
- Devtools: an in-page panel (dev only) for the route tree, loader timing, the query cache, room
  connections, forms and the signal graph. The same data goes to MCP `app_inspect` through a
  read-only dev endpoint (precedent: `packages/render/src/a2ui/webmcp.ts`).
- Skill `skills/livo/SKILL.md`: add a resource, a route, a custom screen, a machine. `cascivo
  generate` gets `resource`, `route` and `form` recipes.

### 3.10 Relation to the other targets (none frozen)

| Target | Role next to livo |
|---|---|
| `@cascivo/react` and `packages/components` | Stays the flagship design system for React teams. Shares the neutral half of every component (§3.5) |
| `@cascivo/elements` | Works inside livo as is (light DOM, same signals). Later, livo views can be exported as custom elements, so elements and livo converge on one source |
| `@cascivo/solid` | Islands for the htmx track. Same compile model. If livo exports islands with `defineIsland`-style mounting, its 8 components can be generated from livo views (P3 option) |
| `.cv` / `cascivo-html` | Static pages: the livo shell, login, docs, status pages. Not a client language |
| `cascivo-server` / `cascivo-worker` | Server-first hypermedia track, and the Rust implementation of the resource contract |
| `cascivo-web` | Marketing and docs sites next to a livo app |
| `cascivo-blitz` | Native desktop for `.cv`. It shares tokens and `cv-*`; no JS runtime, so no livo apps in it |
| `cascivo-tui` | Shares themes. A TUI view of a resource is a later experiment, not planned |

Breadth rule instead of a freeze: a target gets work only if it consumes a shared contract
(tokens, `cv-*`, machines, the resource contract). No target may need hand-written per-component
code that the others do not.

### 3.11 Security line

No RSC-style wire protocol: the client calls a typed JSON API. Payloads are parsed at the boundary
(the repo's `as` rule in `CLAUDE.md`). Access JWTs are verified in the Worker. Strict CSP, because
there is no inline script. This is proof for regulated buyers, not a headline (02 D8).

### 3.12 Name

Checked on 2026-11-28: `registry.npmjs.org/<name>` status for the unscoped name, plus one web
search for clashes. The scoped `@cascivo/<name>` is always ours.

| Name | npm | Clash | Fit |
|---|---|---|---|
| **livo** | 404 (free) | Small unrelated firms (property SaaS, nurse staffing, an IPTV player). No dev tool | Ends like cascivo, says "live" (B2), 4 letters, LEE-vo |
| cascia | 404 | Italian town; no software clash | Closest to the brand, but reads as a variant of cascivo, not a product |
| cavo | 404 | Italian "cable"; none found | Short, weak brand link |
| livio | 404 | Common first name; hard to search | "Alive", but a name |
| cova | 404 | Milan pastry shop | Short, no meaning for us |
| fonte | 404 | Italian "source" | Water theme fits "cascade"; three syllables in some languages |
| scivo | 404 | None found | Ambiguous: SKEE-vo or SIGH-vo |
| civi | 404 | Near Civo (cloud provider) | Clash risk |

Taken and rejected: vivo (also a phone brand), vivace, civa, civ, rivo (active TypeScript
library), casca, vela, riva.

Recommendation: **livo**. It shares the `-ivo` ending, so `@cascivo/livo` sounds like part of the
family. It names the main runtime promise (everything is live). It is short, has one
pronunciation in English and the Romance languages, and the unscoped npm name is free, so we can
reserve it as an alias.

## 4. Ecosystem, interop and migration

### 4.1 What livo reuses on day one

| Asset | How |
|---|---|
| Registry and CLI | `registry.json` gains a `targets` field; `cascivo add --target livo` copies the livo view plus the neutral files |
| Themes, tokens, icons, i18n | Already framework-neutral CSS and TS |
| `cv-*` contract | Same markup, so the same CSS and the same tests |
| Elements | Usable directly in livo JSX |
| Agent grounding | MCP, skills, llms files, `audit-ai` |

### 4.2 React interop, both ways

- **React in livo:** `<ReactIsland component={MapView} props={...} />` mounts a React root,
  loaded lazily, so React costs nothing until a screen needs it. A signal passed in updates the
  React tree through `useSignals()`, directly on one graph or through `fromSignal` on Solid's. This
  covers the long tail: rich text editors, maps, vendor SDKs and unported registry components.
- **livo in React:** `toReact(Screen)` returns a React component that mounts a livo root into a
  ref and forwards props as signals. A React team can ship one livo screen inside an existing
  app. A custom-element export covers non-React hosts.
- Rules: one router owns history (the host); the guest reads it through an adapter. One cache
  per endpoint. Both are lint-checked.

### 4.3 Agents as the ecosystem

The missing library is usually a component or an integration. The factory ports a registry
component to livo behind the conformance gate, and a skill teaches an agent to wrap a vendor SDK
as a resource or an island. A small team cannot write an ecosystem. It can keep the gates that
make agent-written parts safe to merge.

### 4.4 Migration

The wedge is mostly greenfield. For existing React tools: step 1, `toReact` one new screen;
step 2, move the backend to resources behind the same API; step 3, flip the shell to livo and host
the old React screens as islands. Each step ships and reverts on its own. Proof (P3): an external
open-source React admin app, migrated in PRs with green CI.

## 5. Phased roadmap

Sizing: 1-2 engineers plus agents, while the design system is kept up. "w" = weeks.

P0 rules (accepted, pre-registered: tasks, thresholds and analysis committed before any run):

- At least 10 attempts per task, arm and model; Sonnet, Haiku and one non-Anthropic model (the
  harness is Claude-only today, `apps/bench/agent/src/models.ts`).
- Metric: median cost per passing app with a bootstrap 90% CI. Pass: the CI upper bound is at
  least 15% cheaper than the baseline arm, and pass@1 is not lower at the 90% level, with a
  pre-registered non-inferiority margin. The attempt count comes from a power estimate on the
  P0a baseline runs, not from the minimum of 10.
- Baseline arm: React + TanStack Router/Query + react-hook-form + shadcn, with equal grounding
  (Context7 plus TanStack's llms.txt, same context budget as livo's MCP tools and `AGENTS.md`),
  a starter template with a CRUD scaffolder, and a baseline champion with the same prompt-tuning
  budget as the livo arm.
- Two livo arms: with and without `generate`. The gate must pass on the no-generate arm too.
- The outside reviewer writes the held-out tasks before P0b starts and seals them.
- Secondary metric: React-habit errors per task (caught by `livo check` or found in review).
- Budget, models and reviewer: TBD (§7.3). Time box per sub-phase; over budget means stop.

| Phase | Deliverables | Proof that ends the phase | Size |
|---|---|---|---|
| **P0a Spikes and baseline** | Engine spikes (own runtime vs Solid's): TodoMVC, a 10k-row keyed table, mount and unmount 10k rows with a heap check, a React island sharing a signal. Resource room spike: write ceiling and cost per tenant, the 409 form flow. Harness changes (attempts, third model, CI analysis); the baseline arm and its champion; 3 practice tasks; sealed held-out tasks from the reviewer | Engine picked by the §3.2 rule. Room ceiling and cost measured. Baseline scores and the power estimate published in `evals.json` | 4w |
| **P0b Minimal framework** | Runtime, router, query, form, the new resource room on D1, `generate` v0, `livo check` v0 with the reactivity rules, 10 ported components with conformance, MCP `app_check`, a skill. Then frozen | **Gate** (P0 rules) on the held-out tasks. Else stop (§6) | 8w |
| **P1 Wedge-complete** | 20 components; nested layouts, guards, typed search; live queries and conflicts; Access auth; `generate` recipes; `@cascivo/livo/testing` | A reference internal tool (the `track` feature set) on Workers, with at most 1 effect escape per 1k LOC and fewer LOC than the baseline arm's best solution | 10w |
| **P2 Agent loop** | Full `livo check` graph; `app_inspect`; devtools; manifests in `pnpm regen`; registry `targets` | Eval v2 on 8+ tasks: at least 30% cheaper per pass, pass@1 equal or higher, 3 models. 3 developers new to livo each build the admin task in under a day | 8w |
| **P3 Interop and pilots** | `toReact`, `<ReactIsland>`; migration guide | External React app migrated in PRs; one external pilot in production for 4 weeks | 10w |
| **P4 After a pilot, on demand** | `cascivo-worker` contract conformance; custom-element export; Solid island generation; offline queue; Oxc transform | Only if 2 or more pilots ask | open |

Total to v1 (P0-P3): about 10-12 months. P0 is about 12 weeks, because the gate now needs a
framework prototype. That is twice the first draft, and the price of answer 1.

## 6. Risks and kill criteria

### Risks

| Risk | Mitigation |
|---|---|
| Cold start: agents write React habits (`useState`, `className`) into livo | `livo check` rejects them with fixes; P0 measures it directly. This is the main risk |
| B1 generation becomes a framework inside the framework (Rails magic) | Generated code is owned and plain; `generate` only writes files, never runs at runtime |
| The runtime leaks or loses updates (ownership, cleanup, batching) | P0a spikes both engines with a heap check; the public API hides the engine |
| The resource room is a write bottleneck or costs too much | P0a measures it; shard by record range; internal tools write rarely |
| TanStack DB, Zero or Convex close the B2 gap on React | B1 and B3 still differ; an optional TanStack DB arm in P2 |
| Two views per component doubles component work | Conformance gate plus agent ports; neutral parts are shared; kill criterion 5 |
| Benchmark gaming | Outside reviewer, hidden EVAL, held-out tasks, a baseline arm built in its own idioms, publish losses |
| Cloudflare coupling (the Meteor lesson: niche backend) | The resource contract is JSON Schema; plain REST works on the client; a Rust implementation can follow (P4) |
| Breadth (02 §5) with nothing frozen | Breadth rule (§3.10). Kill criterion 7 |
| Retool and low-code tools own the wedge's buyers | Sell owned code, agents and Git review, not a builder UI |

### Kill criteria (any one stops the livo track)

1. P0b: the gate fails on the held-out tasks.
2. P0: over the time box or the token budget.
3. P0a: neither engine passes the leak test and island interop in its one-week spike.
4. P2: the advantage falls below the P0 gate on the larger task set.
5. P1: porting a component with the gate costs more than half the effort of writing it, or the
   two views of a component drift (a conformance failure) in more than 1 of 10 releases.
6. P3: no external pilot after 8 weeks of trying.
7. Any time: livo work stops design-system releases for more than one cycle.
8. P0b or later: runtime plus router plus query over 15 kB gzip.
9. P1: the reference tool is not smaller than the baseline's best solution, or has more than 1
   effect escape per 1k LOC.
10. P0b: React-habit errors are above the pre-registered rate after `livo check` feedback.

If the track is killed, the neutral parts stay useful: `resource`, the neutral form store, the
conformance gate and the resource Durable Object help React adopters and elements anyway.

## 7. Open decisions

1. **Name:** confirm livo (§3.12), or pick another candidate.
2. **Default Worker language:** TypeScript `@cascivo/livo/server` (recommended: one language, no
   codegen) or Rust `cascivo-worker` (needs a Durable Object abstraction and conformance first)?
3. **P0 budget, models, reviewer:** token budget, the non-Anthropic model, and the outside task
   reviewer. Still TBD.
4. **Engine rule:** confirm that P0a picks the engine (own runtime vs Solid's) by the fixed rule in
   §3.2, not by preference.
