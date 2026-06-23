# cascivo — Roadmap v43: `@cascivo/flow` — A CSS-Native, Signal-Driven Flow & Diagram Package

**Last updated:** 2026-06-23
**Status:** ✅ Shipped (T1–T8). New package **`@cascivo/flow`** — visualize and animate node/edge
flows (flowcharts, DAGs, pipelines, mind-maps) built from HTML + CSS + the minimum JS, signal-driven, themed
with the rest of cascivo, AI-first. Landed: the package + engine (signal store, transforms, geometry), the
pan/zoom viewport + CSS background, draggable nodes + connection handles, bezier/straight/smoothstep edges with
arrowheads, labels, and reduced-motion-safe animation, interactive connect + controls/minimap/panel, the
declarative `<Flow nodes edges />` API + dependency-free grid/layered layout + a `scaffold_flow` MCP tool, the
scripted **`FlowStory`** storyline, and **auto-generated** storybook stories + docs from the manifests.
**Plan documents:** `docs/superpowers/plans/2026-06-23-v43-master-plan.md` + tranches 1–7
**Builds on:** the **`@cascivo/charts`** package model (`packages/charts/` — a standalone, zero-runtime-dep,
signal-driven visualization package installed via `@cascivo/charts`, registry `type: 'chart'`, source aliases
in every app's vite config) which is the **direct template** for a second visualization package; the
`@cascivo/core` primitives — **`useDraggable`** (pointer-driven `{ x, y }` offset, the node-drag and
pan engine), **`useResizeObserver`** (v42, viewport sizing), `useControllableSignal`, `useSignal`/
`useComputed`/`useSignalEffect`/`useSignals`, `cn`, `Portal`, `FocusScope`; the per-component **`intent`**
manifest field + `intent-completeness.test.ts`; the registry/MCP/docs/storybook auto-generation pipeline
(`scripts/registry/generate.ts`, `pnpm regen`); and `@cascivo/i18n` for defaulted strings.

---

## Why this roadmap exists

The brief: **add a new package to visualize and animate flows**, after studying the two reference libraries —
[**React Flow** (xyflow)](https://reactflow.dev) ([github](https://github.com/xyflow/xyflow)) and
[**AntV X6**](https://x6.antv.antgroup.com/) ([github](https://github.com/antvis/x6)) — and then deliver a
package that:

1. follows cascivo's guidelines (**HTML + CSS first, JavaScript only where genuinely required**; performance
   benefits directly from that discipline),
2. works **perfectly with the UI library** (themes via `data-theme` + CSS custom properties, owned-code model,
   signals/FSM primitives),
3. ships **auto-generated stories + docs** like every other surface,
4. offers **at least the basic set** of the reference libraries but **deliberately does not** try to match
   their full surface, and
5. is **easy to use** and **AI-first** (a declarative graph the agent can emit, manifests, MCP/skill).

The honest framing, consistent with v42/v41/v39: cascivo should **adopt the ideas, not the stacks.** React
Flow and X6 are excellent but heavy general-purpose graph engines with their own state stores, plugin systems,
and (in X6's case) a registration/MVC architecture. cascivo's contribution is a **small, owned, CSS-native
flow renderer** that covers the 80% case (visualize a graph, drag nodes, connect, pan/zoom, animate edges) and
leans on signals + modern CSS for performance instead of a bespoke virtual-DOM/diffing store.

This document records the study so the "build a focused subset, not a port" decision is auditable, then scopes
the seven workstreams.

---

## The reference libraries at a glance (what the study found)

| Dimension     | React Flow (xyflow, v12.x)                                                                 | AntV X6 (v2.x)                                                                            |
| ------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Identity      | React node-based UIs / flow editors; the de-facto React graph library                       | "Graph editing engine based on HTML and SVG" — DAG, ER, flowchart, lineage editors        |
| Stack         | React + an internal **Zustand store**; D3-zoom for the viewport; TypeScript                 | Framework-agnostic; its own **MVX (Model-View) + registration** architecture; TypeScript   |
| Rendering     | **Hybrid**: nodes are **DOM** (React components), edges are **SVG** paths, viewport is a CSS transform | **Hybrid**: nodes SVG **or** HTML, edges SVG; a registration mechanism for shapes/tools     |
| Core concepts | `nodes`, `edges`, `handles` (connection points), `viewport`, node/edge **types**            | `Graph`, `Node`, `Edge`, `Port`, `Shape`; everything registered and extensible             |
| Built-in UI   | `<Background>` (dots/lines/cross), `<Controls>`, `<MiniMap>`, `<Panel>`, `<NodeToolbar>`    | grid, snapline (alignment guides), minimap, selection tool, transform (resize/rotate)      |
| Interactions  | pan, zoom, node drag, multi-select, **connect via handles**, fit-view, keyboard a11y         | drag, connect, **resize, rotate**, snap/align, keyboard, clipboard, undo/redo              |
| Edge types    | bezier, straight, smoothstep, step, simple-bezier; markers (arrows), labels, **animated**   | many connectors/routers (orth, manhattan, metro) + markers + labels                        |
| Advanced      | layouting via **external** Dagre/ELK; sub-flows; lasso/whiteboard; multiplayer (Pro)         | layout algorithms, history (undo/redo), clipboard, scroller, print/export, MVC plugins      |
| Performance   | only-visible rendering, granular store subscriptions to avoid re-renders                     | virtual rendering, async rendering, dirty-rect redraw                                       |
| AI / DX       | declarative `nodes`/`edges` arrays (very agent-friendly); hooks (`useReactFlow`, `useNodesState`) | imperative `graph.addNode(...)` API; JSON `graph.fromJSON(...)`; rich plugin docs        |

### The essential ("basic set") both libraries share — what `@cascivo/flow` will cover

A flow renderer is "basic-complete" when it can do all of:

1. **Render a graph** from declarative `nodes` + `edges` data.
2. **A pan/zoom viewport** (drag to pan, wheel/pinch to zoom, fit-to-view).
3. **Draggable nodes** that contain arbitrary cascivo components (DOM nodes).
4. **Connection handles** (ports) and **edges** between them, with arrowheads and labels.
5. **Edge path styles** — bezier / straight / smoothstep (step).
6. **Selection** (click a node/edge; visual selected state).
7. **Interactive connect** — drag from one handle to another to create an edge.
8. **Background** (dots / grid / cross) and **Controls** (zoom in/out, fit) and a **MiniMap**.
9. **Animated edges** (flow direction — "marching ants"/particle), reduced-motion-safe.

That is the v43 scope. Everything above it (full auto-layout engines, undo/redo, rotate/resize transforms,
collaboration, whiteboard) is explicitly out (see below).

### What we deliberately do NOT offer (defer / reject — not a port)

- **Heavy auto-layout engines (Dagre / ELK / X6 layout):** these are large dependencies with their own
  graph-theory surface. React Flow itself keeps them **external**. v43 ships **only a tiny, optional,
  dependency-free `gridLayout`/`layeredLayout` helper** for the common "I just want it arranged" case, and
  documents bring-your-own-layout (pass pre-computed `position`s). Full layout engines: **deferred.**
- **Undo/redo history + clipboard (X6):** a stateful editor concern, not a visualize-and-animate concern.
  cascivo gives you the signals; an app can build history on top. **Deferred.**
- **Resize / rotate transform handles (X6):** node geometry editing is an editor feature beyond the basic
  set; nodes are sized by their CSS content. **Deferred.**
- **Snapline / alignment guides (X6), lasso / freehand whiteboard, sub-flows / grouping, multiplayer
  (React Flow Pro):** advanced editor surfaces. **Deferred / rejected** for v43.
- **The Zustand store (React Flow) and the MVX + registration architecture (X6):** cascivo already has a
  reactivity primitive — **Preact Signals**. The flow state model is plain signals (`nodes`, `edges`,
  `viewport`), not a third-party store or a bespoke MVC. **Rejected.**
- **D3-zoom dependency (React Flow's viewport):** pan/zoom is pointer + wheel math applied to **one CSS
  transform** (`translate()` + `scale()` via custom properties) — no runtime dependency. **Rejected.**
- **SVG-rendered nodes (one of X6's modes):** nodes are **HTML** so they can contain any themed cascivo
  component for free; **only edges (and the minimap) are SVG**. Matches React Flow's proven hybrid model.
- **Canvas raster rendering:** not crisp, not themeable via CSS, not in the a11y tree. **Rejected.**

### Why a focused subset wins on cascivo's terms

- **Performance from CSS, not from a diffing store.** Node position is a CSS custom property
  (`transform: translate(var(--flow-x), var(--flow-y))`); the viewport is a single transformed layer; edge
  animation is a CSS `stroke-dashoffset`/`offset-path` keyframe — the GPU/compositor does the work, signals
  update only the handful of changed values, and there is no per-frame React reconciliation of the whole graph.
- **Themes for free.** HTML nodes are ordinary cascivo DOM under a `data-theme` scope; edges/markers read
  `var(--cascivo-color-*)` tokens. No separate theming system.
- **Owned, tiny, no runtime deps.** Like `@cascivo/charts`, the package is signal + CSS + a little geometry
  math — zero runtime dependencies beyond `@cascivo/core`/`@cascivo/i18n`.

---

## What is worth adopting (the seven workstreams)

| #   | Workstream                                   | Tranche | Origin in the reference libs                                  | Category |
| --- | -------------------------------------------- | ------- | ------------------------------------------------------------ | -------- |
| A   | **Package scaffold + flow engine**           | T1      | the state model both libs need (nodes/edges/viewport)        | package / engine |
| B   | **Viewport (pan/zoom) + Background**         | T2      | React Flow viewport + `<Background>`                         | core / display |
| C   | **Nodes (drag, select, handles)**            | T3      | React Flow nodes + handles; X6 HTML nodes                    | core / interaction |
| D   | **Edges (paths, markers, animation)**        | T4      | React Flow edge types + animated edges; X6 connectors        | core / display |
| E   | **Interactive connect + Chrome**             | T5      | connect-by-handle + `<Controls>`/`<MiniMap>`/`<Panel>`      | interaction / chrome |
| F   | **Declarative `<Flow>` API + auto-gen stories + AI + docs** | T6 | declarative `nodes`/`edges` (agent-friendly) + manifest-driven stories + auto docs | API / AI / docs |
| G   | **`FlowStory` — scripted storyline animation** | T7    | (beyond both libs) a sequenced, captioned, looping flow walkthrough | core / animation |
| H   | **Final gate (regen, drift, CI, sweep)**     | T8      | the cascivo release discipline                              | gate |

Why this order:

1. **T1 — scaffold + engine.** Stand up `packages/flow/` cloned from the `@cascivo/charts` package shape
   (package.json, tsconfig, vite.config, scripts, `src/index.ts`), wire it into the monorepo (catalog deps,
   the four vite source-aliases, the registry `ROOTS` + a new `'flow'` `EntryType` in all four files that
   declare it, MCP/docs `EntryType`). Implement the **engine**: plain-signal state (`nodes`/`edges`/`viewport`
   signals via a `useFlow` store hook), coordinate transforms (screen↔flow), and geometry helpers (node bounds,
   handle positions, bounding box for fit-view). Nothing renders yet; the engine is unit-tested in isolation.
2. **T2 — viewport + background.** The `<Flow>`/`<FlowCanvas>` container: a single transformed pane
   (`translate`+`scale` from the `viewport` signal as CSS custom properties), **drag-to-pan** (reuse
   `useDraggable`), **wheel/pinch zoom** (pointer math in `useSignalEffect`, clamped), and **fit-view**
   (uses the engine's bounding box + `useResizeObserver` for the container size). `<FlowBackground>` renders
   dots / grid / cross **purely in CSS** (`background-image` gradients scaled with the viewport) — no SVG, no
   per-cell DOM.
3. **T3 — nodes.** `<FlowNode>` renders an **HTML** box positioned by a `--flow-x`/`--flow-y` transform,
   draggable via `useDraggable` (writes the node's position signal, screen→flow corrected by zoom),
   selectable (click → `data-selected`, CSS handles the visual), containing arbitrary children (any cascivo
   component). `<FlowHandle>` marks connection ports (`source`/`target`, position `top|right|bottom|left`),
   ≥44px coarse target, keyboard-focusable.
4. **T4 — edges.** One **SVG** edge layer under/over the nodes; `<FlowEdge>` computes a path from source→target
   handle coordinates with **bezier / straight / smoothstep** path math (owned geometry, no D3), an
   **arrowhead marker**, an optional **label** (HTML, positioned at the path midpoint), and **animated**
   variant (CSS `stroke-dashoffset` keyframe — "marching ants" — with a **static fallback** and disabled under
   `prefers-reduced-motion: reduce`).
5. **T5 — interactive connect + chrome.** Drag from a `source` handle to a `target` handle to create an edge
   (a live "connection-in-progress" SVG path following the pointer, drop → `onConnect`). `<FlowControls>`
   (zoom in / out / fit — cascivo `icon-button`s), `<FlowMiniMap>` (a scaled SVG overview with a draggable
   viewport rectangle), `<FlowPanel>` (absolutely-positioned slot for custom UI, e.g. a legend).
6. **T6 — declarative API + auto-gen stories + AI + docs.** The headline **easy-to-use, AI-first** surface: a
   single `<Flow nodes={...} edges={...} />` that takes plain serializable data (the agent emits JSON), with
   optional `nodeTypes`/`edgeTypes` maps for custom renderers, and the optional `gridLayout`/`layeredLayout`
   helper. Every flow primitive ships a `*.meta.ts` manifest (incl. **`intent`** + **`examples`**), feeding the
   registry/MCP/docs auto-generation; add a **`scaffold_flow`** MCP affordance / skill note. Crucially, this
   tranche makes storybook **auto-generated**: a new `scripts/stories/generate.ts` (chained into `pnpm regen`)
   emits `apps/storybook/stories/flow/*.stories.tsx` from each meta's `examples` — realising CLAUDE.md's
   "auto-generated stories from manifests" goal rather than hand-authoring them (`audit:stories` stays green).
7. **T7 — `FlowStory` (scripted storyline animation).** The differentiator beyond a single static animated
   edge: a **storyline** that walks the viewer through a graph step by step, fading in a caption at each step
   so the flow is *understood*. Driven by a super-easy serializable `script`
   (`[{ from, to, label }, …]`) — e.g. `A<->B-->C` animated `A→B`, `B→A`, `A→B`, `B→C`, looping. The engine
   resolves each step to an edge + travel **direction** (one `A<->B` edge animates both ways); **sequencing**
   is a `currentStep` signal advanced by a timer in `useSignalEffect` (the `carousel`/`relative-time` idiom,
   injectable clock for deterministic tests — never `useEffect`/wall-clock); **motion is CSS** (the T4
   animated-edge keyframe, reversed per step; caption fade-in); **reduced-motion-safe** and **accessible**
   (`aria-live` caption + play/pause/prev/next + step indicator). Composes `<Flow>` (T6); its story
   auto-generates from the meta `examples` (T6 generator).
8. **T8 — final gate.** `pnpm regen` (registry gains the `flow/*` entries; `stories:generate` emits the flow
   stories), drift gate, `breakpoint:check`, `fallback:check`, `brand:check`, `audit:stories`, full
   `pnpm ready` / `pnpm ready:ci`, and a grep sweep proving every flow primitive reached every registration
   surface (`src/index.ts`, registry, the four vite aliases, the four `EntryType` declarations, docs, storybook).

---

## What exists today (verified against the codebase)

| Area                  | State                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Flow / diagram package | **None.** No node/edge graph renderer anywhere in the repo.                                        |
| Visualization package model | **`@cascivo/charts`** (`packages/charts/`) — a standalone, published, zero-runtime-dep, signal-driven SVG/CSS visualization package; registry `type: 'chart'`, `install: '@cascivo/charts'`, per-chart `*.meta.ts`, source-aliased in every app's vite config. This is the **template**. |
| Drag engine           | `@cascivo/core` **`useDraggable`** (pointer `{ x, y }` offset + handle/target refs, listeners in `useSignalEffect`) — the node-drag **and** pan engine; no new drag code. |
| Sizing                | `@cascivo/core` **`useResizeObserver`** (v42) — the viewport/container measurement for fit-view + minimap scaling. |
| State primitive       | Preact Signals via `@cascivo/core` (`useSignal`/`useComputed`/`useSignalEffect`/`useControllableSignal`) — replaces React Flow's Zustand store and X6's MVX. |
| Timing idiom          | `carousel` autoplay + v42 `relative-time` (a signal + timer inside `useSignalEffect`, **injectable clock** for deterministic tests, no `useEffect`/wall-clock) — the template for the `FlowStory` sequencer. |
| Storybook stories     | **hand-authored** `*.stories.tsx`, governed by `scripts/quality/story-check.ts` (`pnpm audit:stories` — every story must map to a registry entry). `meta.examples` is the manifest source docs render from. **No story generator** yet (despite CLAUDE.md's "auto-generated from manifests" goal). |
| Registry `EntryType`  | `'component' \| 'layout' \| 'block' \| 'chart' \| 'section'` declared in **four** places: `scripts/registry/generate.ts`, `apps/docs/src/data.ts`, `packages/mcp/src/registry.ts`, and the MCP enum in `packages/mcp/src/server.ts`. **No `'flow'`** yet. |
| Registry `ROOTS`      | `scripts/registry/generate.ts` maps source dirs → entry types (`components`, `layouts`, `layouts/blocks`, `charts/charts`, `layouts/sections`). **No `flow` root** yet; charts set `entry.install = '@cascivo/charts'`. |
| Vite source aliases   | `@cascivo/charts` aliased to its `src/index.ts` in `apps/docs/vite.config.ts`, `apps/landing/vite.config.ts` (×2), `apps/storybook/.storybook/main.ts`. **No `@cascivo/flow`** alias yet. |
| Manifest `intent`     | every `*.meta.ts` carries a typed `intent`, enforced by `intent-completeness.test.ts`. New flow primitives must carry it. |
| AI layer              | per-component manifests → MCP (`@cascivo/mcp`), `skills/`, auto-docs, `llms.txt`. **No flow scaffolding affordance** yet. |

---

## Target state (after v43)

| Concern                | Today                              | Target                                                                 |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| Packages              | charts/core/i18n/… (no flow)        | + **`@cascivo/flow`** (published, zero-runtime-dep, signal-driven)      |
| Flow primitives       | none                                | `Flow`/`FlowCanvas`, `FlowNode`, `FlowHandle`, `FlowEdge`, `FlowBackground`, `FlowControls`, `FlowMiniMap`, `FlowPanel`, **`FlowStory`** (+ `useFlow`/`useStory`, geometry/layout/script helpers), each with a manifest |
| Scripted storyline    | none                                | **`FlowStory`** — a serializable `script` of steps animated in sequence with fade-in captions, looping (the `A<->B-->C` storyboard) |
| Registry `EntryType`  | 5 types                             | + `'flow'` (in all four declarations); `flow/*` entries with `install: '@cascivo/flow'` |
| Vite aliases          | charts aliased                      | + `@cascivo/flow` source alias in docs/landing(×2)/storybook            |
| Storybook stories     | hand-authored, `audit:stories`-checked | flow stories **auto-generated** from manifests via `scripts/stories/generate.ts` (chained into `pnpm regen`) |
| Docs                  | charts auto-generated               | flow docs auto-generated from manifests                                  |
| AI                    | no flow affordance                  | declarative `<Flow nodes edges />` + serializable `FlowStory` `script` + `scaffold_flow` MCP/skill note |

---

## Key open decisions (recommendations in the master plan)

1. **Package name & shape — `@cascivo/flow`, cloned from `@cascivo/charts`?** _Recommendation: **yes**._
   `@cascivo/flow` is the obvious name; the charts package is the proven template for a standalone,
   published, zero-runtime-dep, signal-driven visualization package (registry `type`, `install`, source
   aliases, `*.meta.ts`). Reuse its `package.json`/`tsconfig`/`vite.config`/scripts shape verbatim.
2. **State model — plain signals or a store?** _Recommendation: **plain signals via a `useFlow` hook**._
   React Flow uses Zustand and X6 an MVX model because their host frameworks lack fine-grained reactivity.
   cascivo has signals. `nodes`/`edges`/`viewport` are signals (controllable via `useControllableSignal`);
   no third-party store, no bespoke MVC.
3. **Rendering — hybrid HTML nodes + SVG edges (React Flow model)?** _Recommendation: **yes**._ HTML nodes
   get cascivo theming and arbitrary content for free; SVG edges give smooth scalable paths + markers; the
   viewport is one CSS transform. Reject canvas (not themeable/a11y) and SVG nodes (lose component reuse).
4. **Pan/zoom — reuse `useDraggable` + wheel math, no D3?** _Recommendation: **yes**._ Pan is `useDraggable`
   on the pane; zoom is wheel/pinch delta → clamped `scale` written to the `viewport` signal and applied as a
   CSS transform. No D3-zoom dependency.
5. **Background — CSS or SVG?** _Recommendation: **CSS** (`background-image` gradients scaled with the
   viewport)._ Dots/grid/cross as repeating gradients cost zero DOM and scale with one `background-size`
   bound to zoom — strictly faster than per-cell SVG/DOM.
6. **Animated edges — how?** _Recommendation: CSS `stroke-dashoffset` keyframe (marching ants), with an
   `offset-path` particle variant as progressive enhancement._ Each has a **static fallback** preceding the
   progressive declaration (`fallback:check`) and is disabled under `prefers-reduced-motion: reduce`. No JS
   animation loop, no `requestAnimationFrame` in render.
7. **Auto-layout — bundle an engine?** _Recommendation: **no**; ship only a tiny optional
   `gridLayout`/`layeredLayout` helper and document bring-your-own positions._ Dagre/ELK are large and
   React Flow keeps them external; the basic set only needs "arrange these for me" convenience.
8. **AI-first surface — what is the easy API?** _Recommendation: a single declarative
   `<Flow nodes={…} edges={…} />`_ taking plain serializable data (the agent emits JSON), with optional
   `nodeTypes`/`edgeTypes` for custom renderers and a `scaffold_flow` MCP/skill affordance. The low-level
   primitives (`FlowNode`/`FlowEdge`/…) remain available for hand-authoring.
9. **Auto-generate storybook stories?** _Recommendation: **yes** — add `scripts/stories/generate.ts` chained
   into `pnpm regen`._ Stories are hand-authored today; CLAUDE.md wants them "auto-generated from manifests."
   The generator emits `stories/flow/*.stories.tsx` from each flow meta's `examples` (same data docs use), so
   flow stories never drift and `audit:stories` stays green. The brief explicitly asks for auto-generated
   stories.
10. **`FlowStory` storyline — how is the "script" defined and animated?** _Recommendation: a super-easy
    serializable `script: [{ from, to, label }]`_ that auto-resolves each step to an edge + travel direction
    (one `A<->B` edge animates both ways), plays in sequence with fade-in captions, and loops. Sequencing is a
    `currentStep` signal advanced by a timer in `useSignalEffect` (the `carousel`/`relative-time` idiom,
    injectable clock — never `useEffect`/wall-clock); motion is CSS (the T4 animated edge, reversed per step);
    reduced-motion-safe; `aria-live` + play/pause/prev/next. The JSON script is the AI-first contract. Rejected:
    a pure-CSS sequencer (can't express arbitrary steps/durations/looping with captions) and a
    `requestAnimationFrame` loop.
11. **Scope discipline — what stays out?** _Recommendation: **defer** layout engines, undo/redo, clipboard,
    resize/rotate, snaplines, lasso/whiteboard, sub-flows, multiplayer; **reject** the Zustand store, the MVX
    architecture, and the D3/canvas dependencies_ (recorded above). v43 is the basic set + the `FlowStory`
    storyline differentiator, done well.

---

## Cross-cutting rules

1. **HTML + CSS first; JS only where required.** Nodes/background/labels/chrome are HTML+CSS; edges/minimap
   are SVG; the only JS is signals state, pointer/wheel geometry (in `useSignalEffect`), and path math.
   Every primitive obeys CLAUDE.md: no `useState`/`useContext`/`useEffect`/`useLayoutEffect`/`useReducer`;
   `useSignal*` + `useRef` only; CSS for hover/focus/active/disabled/selected; `useSignals()` first in any
   component that reads a signal during render (the React apps get no signals transform).
2. **DOM side effects via `useSignalEffect`.** Pan/zoom wheel + pointer listeners, drag (via `useDraggable`),
   resize observation, and connection tracking attach/detach in `useSignalEffect` with cleanup — never
   `useEffect`. SSR/no-DOM guarded.
3. **No runtime dependencies.** `@cascivo/flow` depends only on `@cascivo/core` + `@cascivo/i18n` (workspace),
   peers on `react`/`react-dom`/`@preact/signals-react` — matching `@cascivo/charts`. No D3, no Zustand, no
   layout engine, no canvas lib. Geometry/path/layout math is owned source.
4. **Themes & tokens only.** Every color/space/radius reads `var(--cascivo-*)`; HTML nodes inherit the
   `data-theme` scope; no literal colors. Works in light/dark/warm with no extra config.
5. **Animations are progressive enhancement + reduced-motion-safe.** Animated edges and any settle transition
   have a static fallback before each progressive declaration (`fallback:check`) and are disabled under
   `prefers-reduced-motion: reduce`; no off-scale breakpoint literals (`breakpoint:check`); never
   `display:none` content away; ≥44px coarse-pointer targets on interactive handles/controls.
6. **AI-first & auto-generated.** Each primitive ships a `*.meta.ts` (incl. **`intent`**) so the registry,
   MCP, docs, and storybook generate automatically; the declarative `<Flow>` takes plain serializable data;
   a `scaffold_flow` affordance + storybook stories + auto-docs land in T6. `intent-completeness.test.ts`
   stays green.
7. **Additive, not a rewrite.** A net-new package; no existing package API changes. Only additive edits to
   shared files (the four `EntryType` declarations, the registry `ROOTS`, the four vite aliases, catalog/
   workspace wiring).
8. **Generated artifacts stay in sync.** `pnpm regen` after wiring; the drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `pnpm ready` /
   `pnpm ready:ci` green before pushing (the package builds without a prior full build — the source aliases
   are mandatory).

---

## Definition of Done

### T1 — Package scaffold + flow engine

- [ ] `packages/flow/` exists (cloned from `@cascivo/charts` shape): `package.json` (`@cascivo/flow`,
      zero-runtime-dep, `@cascivo/core`/`@cascivo/i18n` workspace deps, `react`/`react-dom`/
      `@preact/signals-react` peers, `exports` `.` + `./styles.css`), `tsconfig.json`, `vite.config.ts`,
      `scripts/`, `src/index.ts`, README scaffold. Added to `pnpm-workspace.yaml`/catalog as needed.
- [ ] Monorepo wiring: `'flow'` added to **all four** `EntryType` declarations
      (`scripts/registry/generate.ts`, `apps/docs/src/data.ts`, `packages/mcp/src/registry.ts`, the
      `packages/mcp/src/server.ts` enum); a `flow` `ROOTS` entry (`packages/flow/src/flows`, `type: 'flow'`,
      `prefix: 'flow/'`, `entry.install = '@cascivo/flow'`); `@cascivo/flow` source alias added to
      `apps/docs/vite.config.ts`, `apps/landing/vite.config.ts` (both alias blocks), `apps/storybook/.storybook/main.ts`.
- [ ] Engine: a `useFlow` store (`nodes`/`edges`/`viewport` signals + actions), screen↔flow coordinate
      transforms, and geometry helpers (node bounds, handle anchor points, graph bounding box for fit-view),
      all pure + unit-tested (`pnpm exec vp run @cascivo/flow#test` green). No banned hooks.
- [ ] `pnpm exec vp run @cascivo/flow#build` succeeds; `pnpm exec vp run @cascivo/docs#build @cascivo/landing#build @cascivo/storybook#build` resolve `@cascivo/flow` via the aliases (no dist required).

### T2 — Viewport (pan/zoom) + Background

- [ ] `<Flow>`/`<FlowCanvas>` renders a single transformed pane (`translate`+`scale` from the `viewport`
      signal as CSS custom properties); **drag-to-pan** (via `useDraggable`), **wheel/pinch zoom** (clamped,
      `useSignalEffect` listener), **fit-view** (engine bounding box + `useResizeObserver`). `viewport`
      controllable. No banned hooks.
- [ ] `<FlowBackground>` renders dots / grid / cross **in CSS** (gradients scaled with zoom via
      `background-size`), tokenised colors, no per-cell DOM. Reduced-motion irrelevant (static). Tests cover
      pan/zoom math + fit-view via injected sizes (no wall-clock). Manifests for both, exported.

### T3 — Nodes (drag, select, handles)

- [ ] `<FlowNode>` is an **HTML** box positioned by `--flow-x`/`--flow-y` transform, draggable via
      `useDraggable` (zoom-corrected write to the node position signal), selectable (`data-selected`, CSS
      visual), rendering arbitrary children; keyboard-focusable, ≥44px coarse target. No banned hooks.
- [ ] `<FlowHandle>` marks `source`/`target` ports at `top|right|bottom|left`, ≥44px coarse, focusable,
      tokenised. Geometry helpers report handle anchor points for edge routing. Tests: drag moves position,
      click selects, handle anchors compute. Manifests for both, exported, in registry after regen.

### T4 — Edges (paths, markers, animation)

- [ ] One SVG edge layer; `<FlowEdge>` computes a path from source→target handle anchors with **bezier /
      straight / smoothstep** path math (owned geometry), an **arrowhead marker**, optional HTML **label** at
      the midpoint. Tokenised stroke. No banned hooks.
- [ ] **Animated** edge variant via CSS `stroke-dashoffset` keyframe (+ optional `offset-path` particle),
      each with a **static fallback** preceding the progressive declaration and disabled under
      `prefers-reduced-motion: reduce`. `fallback:check` green. Tests assert path `d` for known coords.
      Manifest, exported, in registry.

### T5 — Interactive connect + chrome

- [ ] Drag from a `source` handle to a `target` handle creates an edge: a live connection-in-progress SVG
      path follows the pointer (via `useDraggable`/pointer math in `useSignalEffect`), drop fires `onConnect`.
      Keyboard-accessible connect path documented. No banned hooks.
- [ ] `<FlowControls>` (zoom in/out/fit — cascivo `icon-button`s, i18n-defaulted labels), `<FlowMiniMap>` (a
      scaled SVG overview + draggable viewport rect), `<FlowPanel>` (positioned slot). WCAG AA, ≥44px coarse
      targets. Manifests for each, exported, in registry.

### T6 — Declarative `<Flow>` API + auto-gen stories + AI + docs

- [ ] `<Flow nodes={…} edges={…} />` accepts plain serializable data (agent-emittable JSON), optional
      `nodeTypes`/`edgeTypes` maps and `onConnect`/`onNodesChange`/`onEdgesChange`; optional dependency-free
      `gridLayout`/`layeredLayout` helper. i18n-defaulted strings. No hardcoded English.
- [ ] Every flow primitive carries a complete `*.meta.ts` (incl. **`intent`** + a non-empty **`examples`**);
      `intent-completeness.test.ts` green. A `scaffold_flow` MCP affordance / skill section surfaces the
      declarative API to agents.
- [ ] **Stories auto-generated:** `scripts/stories/generate.ts` emits `apps/storybook/stories/flow/*.stories.tsx`
      from each flow meta's `examples`, chained into `pnpm regen`; `pnpm audit:stories` green (each generated
      story maps to a `flow/*` registry entry); re-running leaves no drift. Docs pages auto-generate from
      manifests.

### T7 — `FlowStory` (scripted storyline animation)

- [ ] `packages/flow/src/flows/flow-story/` ships `flow-story.tsx` + `.module.css` + `.meta.ts` + `.test.tsx`,
      plus `engine/script.ts` (+ test) and `core/use-story.ts` (+ test).
- [ ] `<FlowStory>` takes a serializable `script: [{ from, to, label?, description?, duration? }]` (and a
      `{ edge, reverse }` form), resolves each step to an edge id + travel **direction** (one `A<->B` edge
      animates both ways), plays in sequence with fade-in captions, and **loops** (the `A<->B-->C` example).
- [ ] Sequencing is a `currentStep` signal advanced by a timer in `useSignalEffect` (carousel/`relative-time`
      idiom) with an **injectable clock**; tests advance deterministically (no `useEffect`, no wall-clock).
      Motion is CSS (the T4 animated edge, reversed per step; caption fade-in) with a **static fallback** and
      **disabled under `prefers-reduced-motion: reduce`** (captions preserved). `fallback:check` green.
- [ ] Accessible: `aria-live` caption, play/pause/prev/next controls (≥44px coarse, i18n-defaulted), step
      indicator. Manifest (incl. `intent` + the `A<->B-->C` `examples`); exported; its story auto-generates via
      the T6 generator; in `registry.json` after `pnpm regen`.

### T8 — Final gate

- [ ] `pnpm regen` (registry gains `flow/*` entries with `install: '@cascivo/flow'`; `stories:generate` emits
      the flow stories); drift gate green.
- [ ] Full gate green: `vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`,
      `fallback:check`, `brand:check`, `audit:stories`, and `pnpm ready:ci` (cold-cache, sequential — proves the
      source aliases let docs/landing/storybook build without a prior full build).
- [ ] Grep sweep confirms every flow primitive reached every registration surface: `packages/flow/src/index.ts`,
      `registry.json`, the four `EntryType` declarations, the registry `ROOTS`, the four vite aliases, docs, and
      the generated `apps/storybook/stories/flow/`.
