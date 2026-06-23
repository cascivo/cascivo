# v43 — `@cascivo/flow`: A CSS-Native, Signal-Driven Flow & Diagram Package — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Study [React Flow](https://reactflow.dev) ([github](https://github.com/xyflow/xyflow)) and
[AntV X6](https://x6.antv.antgroup.com/) ([github](https://github.com/antvis/x6)) and ship a **new package,
`@cascivo/flow`**, that visualizes and animates node/edge flows (flowcharts, DAGs, pipelines, mind-maps)
covering the **basic set** both libraries share — render a graph, pan/zoom viewport, draggable nodes,
connection handles, edges (bezier/straight/smoothstep) with arrowheads/labels, selection, interactive connect,
background, controls, minimap, and **animated edges** — built from **HTML + CSS first, JS only where required**,
signal-driven, themed with the rest of cascivo, and **AI-first** (a declarative `<Flow nodes edges />` the
agent can emit, manifests, MCP/skill, auto-generated docs + stories). It deliberately does **not** replicate
the heavy parts of the reference libraries (auto-layout engines, undo/redo, clipboard, resize/rotate,
snaplines, lasso/whiteboard, sub-flows, multiplayer) nor their stacks (React Flow's Zustand store + D3-zoom;
X6's MVX + registration architecture; canvas/SVG-node rendering). The package is modeled **directly on
`@cascivo/charts`** — the existing standalone, published, zero-runtime-dep, signal-driven visualization package.

Target state (verified after T7):

| Metric                                   | Today                                  | Target |
| ---------------------------------------- | -------------------------------------- | ------ |
| Packages                                 | charts/core/i18n/… (no flow)            | + `@cascivo/flow` (published, zero-runtime-dep, signal-driven) |
| Flow primitives                          | none                                    | `Flow`/`FlowCanvas`, `FlowNode`, `FlowHandle`, `FlowEdge`, `FlowBackground`, `FlowControls`, `FlowMiniMap`, `FlowPanel` + `useFlow` + geometry/layout helpers, each with a manifest |
| Registry `EntryType`                     | 5 (`component\|layout\|block\|chart\|section`) | + `'flow'` in all four declarations; `flow/*` entries with `install: '@cascivo/flow'` |
| Vite source aliases                      | charts aliased                          | + `@cascivo/flow` in docs/landing(×2)/storybook |
| Docs + storybook                         | charts auto-generated                   | flow auto-generated (docs pages + `stories/flow/*`) |
| AI affordance                            | none for flow                           | declarative `<Flow nodes edges />` + `scaffold_flow` MCP/skill note |
| `intent-completeness.test.ts`            | green                                   | green (new primitives carry `intent`) |
| Full CI gate (`pnpm ready` / `ready:ci`) | green                                   | green |

**Architecture & evidence (reproduced in-repo before planning):**

- **Package template — `@cascivo/charts`:** `packages/charts/` is a standalone, published
  (`"private": false`), zero-runtime-dep, signal-driven visualization package: `package.json` with
  `dependencies` `@cascivo/core` + `@cascivo/i18n` (`workspace:^`), peers `react`/`react-dom`/
  `@preact/signals-react`, `exports` `.` + `./styles.css`, a `build` script (`vp build` + flatten-types),
  `src/index.ts` re-exporting an `engine/`, `core/`, `chrome/`, and per-chart `charts/<name>/` dirs each with
  `<name>.tsx` + `<name>.meta.ts` + `<name>.test.tsx`. **`@cascivo/flow` clones this shape** with `engine/`
  (state + geometry), `core/` (the `<Flow>` pane + `useFlow`), and per-primitive `flows/<name>/` dirs.
- **Registry wiring:** `scripts/registry/generate.ts` declares `type EntryType = 'component' | 'layout' |
  'block' | 'chart' | 'section'` and a `ROOTS` array mapping source dirs → types; charts map
  `packages/charts/src/charts` → `type: 'chart'`, `prefix: 'chart/'`, and set `entry.install =
  '@cascivo/charts'` with empty `files` (npm-installed, not copy-pasted). `EntryType` is **also** declared in
  `apps/docs/src/data.ts`, `packages/mcp/src/registry.ts`, and an enum in `packages/mcp/src/server.ts` — all
  four need `'flow'`.
- **Vite source aliases (mandatory):** per CLAUDE.md, any `@cascivo/*` package whose root export resolves to
  `./dist/` **must** be aliased to its `src/index.ts` in every app that builds without a prior `pnpm build`.
  `@cascivo/charts` is aliased in `apps/docs/vite.config.ts`, `apps/landing/vite.config.ts` (two alias
  blocks), and `apps/storybook/.storybook/main.ts`. `@cascivo/flow` must be added to all four.
- **Drag/pan engine — `useDraggable`:** `packages/core/src/draggable.ts` returns a pointer-driven `{ x, y }`
  signal offset + handle/target refs, attaching pointer listeners in `useSignalEffect`. It is the **node-drag,
  the pane-pan, and the connection-drag engine** — no new drag code, no D3-zoom.
- **Sizing — `useResizeObserver`:** `packages/core/src/resize-observer.ts` (v42) returns an `ElementSize`
  signal + a `ref`, SSR-guarded, observer torn down in `useSignalEffect` cleanup — the container/minimap
  measurement for fit-view.
- **State primitive — Preact Signals:** `@cascivo/core` exports `useSignal`/`useComputed`/`useSignalEffect`/
  `useControllableSignal`/`useSignals`. The flow state model (`nodes`/`edges`/`viewport`) is **plain signals**
  via a `useFlow` hook — **not** Zustand (React Flow) or MVX (X6).
- **`intent` manifest field:** every `*.meta.ts` carries a typed `intent`, enforced by
  `packages/components/src/intent-completeness.test.ts`. Each flow primitive must carry it.
- **Auto-generation:** `pnpm regen` (`registry:generate` → … → `context:generate` → `llms:generate` …) reads
  the manifests; docs/storybook derive from the registry. Adding the `flow` root + manifests makes flow appear
  automatically.

**Tech Stack:** signal-driven TSX + CSS Modules for all primitives (HTML nodes/background/labels/chrome; SVG
edges/minimap; one CSS-transform viewport); owned geometry/path/layout math (no D3, no layout engine);
`@cascivo/core` (`useDraggable`, `useResizeObserver`, `useControllableSignal`, `useSignal`/`useComputed`/
`useSignalEffect`/`useSignals`, `cn`, `Portal`); `@cascivo/i18n` for defaulted strings; Vitest + Testing
Library. vite+ (`vp`) for check/build/test. Progressive-enhancement CSS (`@function`/`if()` and animations
only with static fallbacks — `fallback:check`; reduced-motion-safe). Zero runtime dependencies (matches
`@cascivo/charts`).

---

## Tranche Overview

| Tranche | Title                                | Goal                                                                                                  |
| ------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| T1      | Package scaffold + flow engine       | Stand up `packages/flow/` from the `@cascivo/charts` shape; wire the monorepo (`'flow'` EntryType ×4, registry `ROOTS` root, four vite aliases, catalog/workspace); implement the engine — `useFlow` signal store (`nodes`/`edges`/`viewport`), screen↔flow transforms, geometry helpers — pure + unit-tested. Nothing renders yet. |
| T2      | Viewport (pan/zoom) + Background      | `<Flow>`/`<FlowCanvas>` transformed pane; drag-to-pan (`useDraggable`), wheel/pinch zoom (clamped, `useSignalEffect`), fit-view (`useResizeObserver` + bounding box); `<FlowBackground>` dots/grid/cross in pure CSS. |
| T3      | Nodes (drag, select, handles)         | `<FlowNode>` HTML box positioned by CSS vars, draggable (`useDraggable`, zoom-corrected), selectable (CSS), arbitrary children; `<FlowHandle>` source/target ports + anchor geometry. |
| T4      | Edges (paths, markers, animation)     | SVG edge layer; `<FlowEdge>` bezier/straight/smoothstep path math, arrowhead markers, HTML labels; animated edges via CSS `stroke-dashoffset` (static fallback, reduced-motion-safe). |
| T5      | Interactive connect + chrome          | Drag handle→handle to create an edge (live SVG path → `onConnect`); `<FlowControls>` (zoom/fit icon-buttons), `<FlowMiniMap>` (scaled SVG + draggable viewport rect), `<FlowPanel>` (positioned slot). |
| T6      | Declarative `<Flow>` API + AI + docs  | `<Flow nodes edges />` taking plain serializable data + `nodeTypes`/`edgeTypes` + optional `gridLayout`/`layeredLayout`; per-primitive manifests (incl. `intent`); storybook `stories/flow/*`; auto-docs; `scaffold_flow` MCP/skill affordance. |
| T7      | Final gate                            | `pnpm regen`; drift; `breakpoint:check`/`fallback:check`/`brand:check`; `pnpm ready:ci`; grep sweep across every registration surface. |

Ordering rationale: **T1** must come first — it creates the package and the monorepo wiring everything else
imports, and the engine (state + geometry) the renderers consume. **T2** (viewport) renders the pane the nodes
and edges live in. **T3** (nodes) and **T4** (edges) layer the two halves of the graph onto the pane and could
overlap once the engine + viewport exist, but are sequenced T3 → T4 because edges route to handle anchors that
nodes define. **T5** adds interaction (connect) + chrome on top of nodes+edges. **T6** wraps it in the
easy-to-use, AI-first declarative API and lands manifests/docs/stories (which depend on all primitives
existing). **T7** runs the full gate and proves every surface is wired.

---

## Files Created / Modified per Tranche

### T1 — Package scaffold + flow engine

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/flow/package.json`, `tsconfig.json`, `vite.config.ts`, `README.md`, `readme.body.md`, `scripts/*` (cloned from `@cascivo/charts`) |
| Create | `packages/flow/src/index.ts`, `packages/flow/src/css-modules.d.ts`, `packages/flow/src/setup.ts` |
| Create | `packages/flow/src/engine/store.ts` (`useFlow` — `nodes`/`edges`/`viewport` signals + actions) + `store.test.ts` |
| Create | `packages/flow/src/engine/transform.ts` (screen↔flow coords, zoom-corrected) + `transform.test.ts` |
| Create | `packages/flow/src/engine/geometry.ts` (node bounds, handle anchors, graph bounding box) + `geometry.test.ts` |
| Modify | `scripts/registry/generate.ts` (`EntryType` + `'flow'`; add `flow` `ROOTS` entry; `entry.install = '@cascivo/flow'`) |
| Modify | `apps/docs/src/data.ts` (`EntryType` + `'flow'`) |
| Modify | `packages/mcp/src/registry.ts` (`type` union + `'flow'`) |
| Modify | `packages/mcp/src/server.ts` (EntryType enum + `'flow'`; category enum if needed) |
| Modify | `apps/docs/vite.config.ts`, `apps/landing/vite.config.ts` (both alias blocks), `apps/storybook/.storybook/main.ts` (add `@cascivo/flow` source alias) |
| Modify | `pnpm-workspace.yaml` / root catalog as needed (the package is auto-discovered via `packages/*`) |

### T2 — Viewport (pan/zoom) + Background

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/flow/src/core/flow-canvas/flow-canvas.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` |
| Create | `packages/flow/src/core/use-viewport.ts` (pan/zoom/fit-view actions on the `viewport` signal) + `use-viewport.test.ts` |
| Create | `packages/flow/src/flows/flow-background/flow-background.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` |
| Modify | `packages/flow/src/index.ts` (export canvas + background) |

### T3 — Nodes (drag, select, handles)

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/flow/src/flows/flow-node/flow-node.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` |
| Create | `packages/flow/src/flows/flow-handle/flow-handle.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` |
| Modify | `packages/flow/src/engine/geometry.ts` (handle-anchor lookup for edge routing, if not in T1) |
| Modify | `packages/flow/src/index.ts` (export node + handle) |
| Modify | `packages/i18n/src/builtin.ts` (node/handle default aria-labels, if surfaced) |

### T4 — Edges (paths, markers, animation)

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/flow/src/engine/path.ts` (bezier/straight/smoothstep `d` builders) + `path.test.ts` |
| Create | `packages/flow/src/flows/flow-edge/flow-edge.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` |
| Modify | `packages/flow/src/index.ts` (export edge + path builders) |

### T5 — Interactive connect + chrome

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/flow/src/core/use-connection.ts` (handle→handle drag → `onConnect`) + `use-connection.test.ts` |
| Create | `packages/flow/src/flows/flow-controls/flow-controls.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` |
| Create | `packages/flow/src/flows/flow-minimap/flow-minimap.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` |
| Create | `packages/flow/src/flows/flow-panel/flow-panel.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` |
| Modify | `packages/flow/src/index.ts` (export controls/minimap/panel + `useConnection`) |
| Modify | `packages/i18n/src/builtin.ts` (controls aria-labels: zoom in/out/fit) |

### T6 — Declarative `<Flow>` API + AI + docs

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/flow/src/flows/flow/flow.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` (the declarative `<Flow nodes edges />`) |
| Create | `packages/flow/src/engine/layout.ts` (optional dependency-free `gridLayout`/`layeredLayout`) + `layout.test.ts` |
| Create | `apps/storybook/stories/flow/*.stories.tsx` (one per primitive + a declarative example) |
| Modify | `packages/flow/src/index.ts` (export `Flow` + layout helpers) |
| Modify | `packages/mcp/src/*` (a `scaffold_flow` affordance surfacing the declarative API) and/or `skills/` (a flow section) |
| Modify | `packages/flow/README.md` / `readme.body.md` (usage); docs pages auto-generate from manifests |

### T7 — Final gate

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `docs/ROADMAP-V43.md` (status → done as tranches land)                                  |
| Verify | `pnpm regen` (`registry.json` gains `flow/*` entries with `install: '@cascivo/flow'`); commit drift |
| Verify | full gate: `vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`, `pnpm ready:ci`; grep sweep for `flow/*` across `index.ts`, `registry.json`, the four `EntryType` declarations, the `ROOTS`, the four vite aliases, docs, `stories/flow/` |

---

## Key Decisions

### Decision 1 — Build a focused subset, do NOT port React Flow / X6 (firm)

React Flow and X6 are large, general-purpose graph engines. v43's brief is explicit: cover **at least the
basic set** but **not** the same full functionality. The roadmap (`docs/ROADMAP-V43.md`) enumerates the shared
basic set (render, pan/zoom, drag, handles, edges, selection, connect, background/controls/minimap, animated
edges) as v43 scope, and **defers/rejects** the heavy surfaces (auto-layout engines, undo/redo, clipboard,
resize/rotate, snaplines, lasso/whiteboard, sub-flows, multiplayer). **Decision: ship the basic set as a small
owned package; leave the rest to the app or a future roadmap.**

### Decision 2 — `@cascivo/flow`, cloned from the `@cascivo/charts` package shape (recommended)

cascivo has exactly one precedent for a standalone visualization package: `@cascivo/charts`. **Decision: name
the package `@cascivo/flow` and clone the charts package shape** — `package.json` (zero-runtime-dep,
`@cascivo/core`/`@cascivo/i18n` workspace deps, react peers, `exports` `.` + `./styles.css`), `tsconfig`,
`vite.config`, `scripts/`, an `engine/`+`core/`+`flows/<name>/` `src/` layout, and registry `type: 'flow'`
with `install: '@cascivo/flow'`. Rejected: putting flow in `packages/components` (it is a coordinated
multi-part system + a separate npm package, exactly like charts).

### Decision 3 — State is plain signals (`useFlow`), not Zustand or MVX (firm)

React Flow ships a Zustand store and X6 an MVX model because React/agnostic JS lack fine-grained reactivity.
cascivo has Preact Signals. **Decision: the flow state model is plain signals** — `nodes`, `edges`, and
`viewport` signals exposed via a `useFlow` hook with action helpers, controllable via `useControllableSignal`.
No third-party store, no bespoke MVC, no `useReducer`. This is faster (granular updates), smaller, and
on-idiom. Rejected: adopting Zustand or re-implementing an MVX layer.

### Decision 4 — Hybrid rendering: HTML nodes + SVG edges + one CSS-transform viewport (recommended)

This is React Flow's proven model and it is exactly right for cascivo. **Decision: nodes are HTML** (so they
contain any themed cascivo component for free and inherit the `data-theme` scope), **edges and the minimap are
SVG** (smooth scalable paths + markers), and **the viewport is a single CSS-transformed pane**
(`transform: translate(var(--flow-tx), var(--flow-ty)) scale(var(--flow-scale))`). Rejected: canvas raster
(not themeable, not crisp, not in the a11y tree) and SVG-rendered nodes (lose component reuse + theming).

### Decision 5 — Pan/zoom reuse `useDraggable` + wheel math, background is CSS, no D3 (recommended)

**Decision: pan is `useDraggable` on the pane; zoom is wheel/pinch delta → clamped `scale` written to the
`viewport` signal; the background (dots/grid/cross) is pure CSS `background-image` gradients scaled with the
viewport via `background-size`.** No D3-zoom dependency, no per-cell background DOM. Performance comes from the
compositor (one transformed layer, one repeating gradient) and from signals updating only changed values.
Rejected: D3-zoom (runtime dep) and SVG/DOM background grids (DOM cost).

### Decision 6 — Edges: owned bezier/straight/smoothstep path math; animation is CSS (recommended)

**Decision: `<FlowEdge>` computes its `d` from source→target handle anchors using owned path builders**
(bezier, straight, smoothstep) — no D3-shape dependency — with an SVG arrowhead marker and an optional HTML
label at the midpoint. **Animated edges use a CSS `stroke-dashoffset` keyframe** ("marching ants"), with an
optional `offset-path` particle variant as progressive enhancement; **each has a static fallback preceding the
progressive declaration** (`fallback:check`) and is **disabled under `prefers-reduced-motion: reduce`**. No JS
animation loop. Rejected: a `requestAnimationFrame` render loop and a D3/animation-library dependency.

### Decision 7 — Auto-layout: only a tiny optional helper, no engine (recommended)

Dagre/ELK are large; React Flow keeps them external. **Decision: ship only a dependency-free optional
`gridLayout`/`layeredLayout` helper** for the common "arrange these for me" case, and document
bring-your-own-positions (the agent or app computes `position`s and passes them). Rejected: bundling a layout
engine (large; out of the basic set).

### Decision 8 — Easy-to-use, AI-first surface: declarative `<Flow nodes edges />` + manifests + `scaffold_flow` (recommended)

The brief stresses **easy to use** and **AI-first**. **Decision: the headline API is a single declarative
`<Flow nodes={…} edges={…} />`** that takes plain serializable data an agent can emit as JSON, with optional
`nodeTypes`/`edgeTypes` maps for custom renderers, `onConnect`/`onNodesChange`/`onEdgesChange` callbacks, and
the optional layout helper. Every primitive ships a `*.meta.ts` (incl. `intent`) so the registry/MCP/docs/
storybook generate automatically, and T6 adds a **`scaffold_flow`** MCP affordance / skill section so agents
can generate a flow from intent. The low-level primitives stay available for hand-authoring. Rejected: an
imperative `graph.addNode(...)` API (X6-style; not declarative/agent-friendly) as the primary surface.

### Decision 9 — Defer the heavy editor surfaces, reject the foreign stacks (recommended)

**Decision: defer** auto-layout engines, undo/redo, clipboard, resize/rotate transforms, snaplines/alignment
guides, lasso/whiteboard, sub-flows/grouping, and multiplayer (future-study candidates); **reject** the
Zustand store, the MVX/registration architecture, and the D3/canvas dependencies. Recorded in
`docs/ROADMAP-V43.md`. v43 is the basic set, done well, on cascivo's terms.

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before each commit; `pnpm ready:ci` before the
   final push (proves the source aliases let docs/landing/storybook build without a prior full build).
2. **HTML + CSS first; JS only where required; no banned hooks.** All primitives obey CLAUDE.md: no
   `useState`/`useContext`/`useEffect`/`useLayoutEffect`/`useReducer`; `useSignal*` + `useRef` only; CSS
   handles hover/focus/active/disabled/selected; `useSignals()` first in any component reading a signal during
   render (the React apps get no signals transform).
3. **DOM side effects via `useSignalEffect`.** Pan/zoom wheel + pointer listeners, node/pane/connection drag
   (via `useDraggable`), resize observation (`useResizeObserver`), and connection tracking attach/detach in
   `useSignalEffect` with cleanup — never `useEffect`. SSR/no-DOM guarded.
4. **No runtime dependencies.** `@cascivo/flow` depends only on `@cascivo/core` + `@cascivo/i18n` (workspace),
   peers `react`/`react-dom`/`@preact/signals-react` — matching `@cascivo/charts`. Geometry/path/layout math
   is owned source. No D3, no Zustand, no layout engine, no canvas lib.
5. **Themes & tokens only.** Every color/space/radius reads `var(--cascivo-*)`; HTML nodes inherit the
   `data-theme` scope; no literal colors. Light/dark/warm work with no extra config.
6. **Animations: progressive enhancement + reduced-motion.** Animated edges and any settle transition have a
   static fallback before each progressive declaration (`fallback:check`), disabled under
   `prefers-reduced-motion: reduce`; no off-scale breakpoint literals (`breakpoint:check`); no `display:none`
   data loss; ≥44px coarse-pointer targets on interactive handles/controls.
7. **Additive only:** a net-new package; no existing package API changes. Shared-file edits are additive (the
   four `EntryType` declarations, the registry `ROOTS`, the four vite aliases, catalog/workspace wiring).
8. **AI-first & auto-generated:** each primitive ships a `*.meta.ts` **including `intent`** (so
   `intent-completeness.test.ts` passes); the declarative `<Flow>` takes plain serializable data; `pnpm regen`
   refreshes `registry.json`; storybook stories + auto-docs + a `scaffold_flow` affordance land in T6.
9. **Generated artifacts stay in sync:** `pnpm regen` after wiring; drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `brand:check` green;
   the new package builds standalone (`vp run @cascivo/flow#build`) and via the app aliases without a prior full build.
</content>
