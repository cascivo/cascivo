# cascivo — Roadmap v18: Parity & Primitives

**Last updated:** 2026-06-14
**Status:** 📝 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-14-v18-master-plan.md` + tranches 1–7

---

## Vision

v17 answered "coming from shadcn/ui — how do I switch?" with an honest migration guide. But the guide
exposes an uncomfortable truth: a migrator coming from shadcn/ui or IBM Carbon will, today, hit
components cascivo simply **does not have yet** — and reach for composition primitives (`asChild`,
controllable state, dismissable layers, roving focus) that cascivo never published, forcing every
component author to reinvent them ad-hoc.

cascivo ships **118 registry items** across inputs, display, overlay, navigation, feedback, layout,
charts, and blocks — a deep catalog. But "deep" is not "complete relative to the two systems we
benchmark against on every other page." We claim shadcn/ui and Carbon as competitors in
`ProofTeasers`, `AxeComparison`, and `PerformancePage`. A migrator deserves a straight answer to
"will the component I use every day be here?" — and where the answer is "no," a queued spec with a
date, not silence.

Two gaps, one root cause:

1. **Component parity gaps.** Against shadcn/ui's 58-component registry and Carbon's roster, cascivo is
   missing ~20 components — some foundational (`Label`, `Field`, `Button Group`, `Toggle Group`,
   `Icon Button`, `Inline Loading`), some structural (`Navigation Menu`, `Menubar`, `Resizable`,
   `Tree View`, `Scroll Area`), some already half-specced in `factory-backlog.json` but never built.
2. **Primitive gaps.** shadcn/ui stands on Radix primitives (`Slot`/`asChild`, dismissable layer,
   roving focus, presence). Carbon stands on internal hooks. cascivo's `@cascivo/core` ships `cn`,
   `composeRefs`, `mergeProps`, signals, the micro-FSM, `Portal`, `FocusScope`, `VisuallyHidden`,
   `ErrorBoundary`, `SuspenseBoundary` — and nothing for composition (`asChild`), controllable
   state (the controlled-prop→signal pattern `CLAUDE.md` documents by hand), shared dismissal,
   roving focus, or mount/exit presence. Every component reinvents these, inconsistently.

> Concept: **"Parity & Primitives."** First publish the missing composition primitives in
> `@cascivo/core` — the substrate the factory's component generator builds on. Then run a formal
> parity audit against shadcn/ui + Carbon, codify the gap as a machine-readable matrix, queue every
> missing component into `factory-backlog.json` with a real spec, and drive the factory through them in
> dependency order. Close with a public parity page that proves the coverage — receipts, not adjectives.

## The diagnosis (gap → cascivo today → what v18 closes)

| #   | Gap                                            | cascivo today                                                                   | Gap v18 closes                                                                              |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | No `asChild` / composition primitive           | Components render fixed elements; no Radix-style `Slot`                         | `Slot` + `asChild` in `@cascivo/core` — merge props/refs onto a child element               |
| 2   | Controlled/uncontrolled pattern is hand-rolled | `CLAUDE.md` documents `const x = useSignal(open); x.value = open` per component | One `useControllableSignal` helper — the documented pattern, codified + tested              |
| 3   | Dismissal logic duplicated per overlay         | Popover/dropdown/menu/tooltip/sheet each wire outside-click + Escape ad-hoc     | `DismissableLayer` primitive — one tested implementation                                    |
| 4   | No roving-focus primitive                      | Menus/tabs/toggle-groups manage tabindex by hand                                | `RovingFocus` / `useRovingFocus` — arrow-key navigation, one source of truth                |
| 5   | No mount/exit presence                         | Overlays mount/unmount with no exit-animation hook                              | `Presence` primitive (signal-driven, no `useEffect`)                                        |
| 6   | Component coverage vs shadcn/Carbon unmeasured | We benchmark both but never measured component coverage                         | A machine-readable parity matrix + generated `parity.json` — the honest scoreboard          |
| 7   | Missing parity components                      | ~20 gaps; some half-specced in `factory-backlog.json`, none built               | Every gap queued with a real spec; the factory builds them on the new primitives            |
| 8   | Parity is not provable                         | "Competitors" framing, no coverage receipt                                      | A `/parity` (or docs) page: cascivo vs shadcn vs Carbon coverage, generated from the matrix |

## The pitch additions (extends v17's claims 1–33)

| #   | Claim                                 | Substance                                                                                                                                                                                                                                                           |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 34  | **Primitives, not just components**   | `@cascivo/core` ships the composition substrate — `Slot`/`asChild`, `useControllableSignal`, `DismissableLayer`, `RovingFocus`, `Presence` — all signal-driven, zero `useEffect`/`useState`. The same foundation Radix gives shadcn, on cascivo's reactivity model. |
| 35  | **Measured parity, not implied**      | A generated parity matrix scores cascivo against shadcn/ui (58) and Carbon component-by-component. Where there's a gap, there's a queued spec — public, dated, honest.                                                                                              |
| 36  | **The catalog keeps closing the gap** | Every parity gap is a real `factory-backlog.json` entry; the dark factory builds them on the v18 primitives. The coverage page is generated from the matrix, so it can never overstate.                                                                             |

## Workstreams

| #   | Workstream               | Tranche | Summary                                                                                                                                                                                                                                                                                  |
| --- | ------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Parity audit + backlog   | T1      | Formal gap analysis vs shadcn/ui (58) + Carbon; machine-readable `parity-matrix.md` → `parity.json`; queue every missing component into `factory-backlog.json` with specs + priorities.                                                                                                  |
| B   | Composition primitive    | T2      | `Slot` + `asChild` in `@cascivo/core` — prop/ref merging onto a single child, with tests + docs.                                                                                                                                                                                         |
| C   | State & DOM utilities    | T3      | `useControllableSignal`, `useMediaQuery`, `useScrollLock`, `useId`, `useClipboard` in `@cascivo/core`.                                                                                                                                                                                   |
| D   | Interaction primitives   | T4      | `DismissableLayer`, `RovingFocus`/`useRovingFocus`, `Presence`, anchor-positioning helper in `@cascivo/core`.                                                                                                                                                                            |
| E   | Tier-1 parity components | T5      | Foundational/shared gaps via the factory: Label, Field, Button Group, Icon Button, Toggle Group, Inline Loading, Notification, Scroll Area, Collapsible, Aspect Ratio.                                                                                                                   |
| F   | Tier-2 parity components | T6      | Structural/one-system gaps via the factory: Navigation Menu, Menubar, Menu Button, Toggletip, Resizable/Splitter, Drawer, Tree View, Tile, Structured List, Carousel, Calendar, Date Range Picker, Color Picker, Timeline, Data List, Native Select, Item, Code Snippet, Contained List. |
| G   | Receipts + DoD           | T7      | Coverage page generated from the matrix (cascivo vs shadcn vs Carbon); claims 34–36 on `/why`; README/llms refresh; registry + matrix regen; full gate; roadmap close.                                                                                                                   |

## Decisions baked in

1. **Primitives ship before components.** T2–T4 land the substrate in `@cascivo/core` first so the
   factory (T5–T6) builds new components _on_ them, not around their absence. This is the whole point:
   stop reinventing dismissal/roving-focus/controllable-state per component.
2. **Components go through the dark factory, not hand-built in tranches.** Per the established pattern
   (v17 deferral: "new component development — use the dark factory"), T1 queues real specs into
   `factory-backlog.json`; T5/T6 _drive_ the factory through them in dependency order and verify parity
   - a11y. The tranches define the spec bar and the primitive dependencies, not bespoke component code.
3. **The parity matrix is generated and drift-gated.** `docs/specs/parity-matrix.md` is the
   human-authored source; a generator emits `parity.json` (consumed by the coverage page). Editing the
   JSON by hand is forbidden; `git diff --exit-code` enforces regen, exactly like `context.json`/`tokens.catalog.json`.
4. **Honest mapping, not inflated coverage.** A cascivo component counts as covering a competitor entry
   only when it genuinely does (e.g. `toggle` covers shadcn `Switch`; `modal` covers `Dialog`;
   `command-menu` covers `Command`). Near-misses are marked "partial" with a note (e.g. `sheet` partially
   covers shadcn `Drawer` — no mobile gesture). RTL `Direction` is "covered by convention" (CSS logical
   properties), not a component. No gap is hidden; no coverage is overstated.
5. **No new runtime dependencies.** Primitives are built on React + `@preact/signals-react` only.
   `Slot` clones a child and merges props/refs (no Radix dep). Anchor positioning leans on CSS anchor
   positioning with a JS fallback helper — progressive enhancement, consistent with the v13 `@function`
   stance. `useMediaQuery` wraps `matchMedia` via `useSignalEffect`.
6. **Signal rules apply to every primitive.** No `useState`/`useEffect`/`useContext`/`useReducer` in any
   new `@cascivo/core` code. DOM side effects (listeners, `matchMedia`, scroll lock) use
   `useSignalEffect`. Controlled props sync into signals via `useControllableSignal`. `useRef` only for
   DOM refs.
7. **Tier split is by dependency + reach, not difficulty.** Tier-1 (T5) = primitives-light, used by the
   most apps, often unblock other components (`Label`/`Field` are a11y substrate; `Button Group`/`Toggle
Group` exercise `RovingFocus`). Tier-2 (T6) = richer/structural or single-system, several depending on
   `DismissableLayer`/`Presence`/anchor positioning.
8. **Existing half-specced backlog entries are reconciled, not duplicated.** `factory-backlog.json`
   already lists `icon-button`, `notification`, `structured-list`, `tile`, `scroll-area`, `calendar`,
   `date-range-picker`, `tree-view`, `color-picker`, `carousel`, `timeline`, `data-list`, `collapsible`,
   `code-block`, `splitter` as `pending`. T1 audits these against the gap analysis, upgrades their specs,
   sets priorities, and only _adds_ genuinely missing entries (Label, Field, Button Group, Toggle Group,
   Inline Loading, Navigation Menu, Menubar, Menu Button, Toggletip, Drawer, Native Select, Item,
   Code Snippet, Contained List).
9. **The coverage page can't overstate.** It renders from `parity.json`; the numbers are derived, not
   typed. If a component isn't built and exported from `@cascivo/react`, it shows as a gap.

## Definition of Done

- [ ] `docs/specs/parity-matrix.md` formally maps cascivo's catalog against shadcn/ui (58 components)
      and Carbon's roster — each competitor entry marked covered / partial / gap with the cascivo
      component (or note) — and a generator emits `parity.json`; a drift test fails if the matrix changes
      without regen. _Evidence: T1._
- [ ] `factory-backlog.json` contains a real, prioritized spec for every gap in the matrix; pre-existing
      `pending` entries are reconciled (no duplicates), and the only genuinely-new entries are added.
      _Evidence: T1._
- [ ] `@cascivo/core` exports `Slot` + an `asChild` mechanism that merges props and refs onto a single
      child element; covered by tests (prop merge, ref compose, event chaining). _Evidence: T2._
- [ ] `@cascivo/core` exports `useControllableSignal`, `useMediaQuery`, `useScrollLock`, `useId`,
      `useClipboard`; each tested; none use `useState`/`useEffect`. _Evidence: T3._
- [ ] `@cascivo/core` exports `DismissableLayer`, `RovingFocus`/`useRovingFocus`, `Presence`, and an
      anchor-positioning helper; each tested; DOM side effects use `useSignalEffect`. _Evidence: T4._
- [ ] Tier-1 parity components (≥10: Label, Field, Button Group, Icon Button, Toggle Group, Inline
      Loading, Notification, Scroll Area, Collapsible, Aspect Ratio) are generated via the factory on the
      new primitives, pass the component checklist, and are exported from `@cascivo/react`. _Evidence: T5._
- [ ] Tier-2 parity components are generated via the factory and exported from `@cascivo/react`; any not
      completed remain accurately marked as gaps in the matrix (no overstatement). _Evidence: T6._
- [ ] A coverage page (docs or landing) renders cascivo vs shadcn vs Carbon from `parity.json`; "Why
      cascivo" claims 34–36 live on `/why` with receipts linking to it. _Evidence: T7._
- [ ] Full CLAUDE.md gate exits 0 (`vp check` → build → `vp run -r check` → test → regen → diff),
      including the new parity-matrix drift check. _Evidence: T7._
- [ ] `ROADMAP-V18.md` DoD boxes all checked; status → ✅ Shipped. _Evidence: T7._

## Deferred (do not re-litigate in v18)

- **AI label / slug (Carbon AI components)** — niche, tied to Carbon's AI-assist visual language; not a
  general primitive. Deferred.
- **Fluid form variants (Carbon)** — a styling variant of existing inputs, not a new component. Deferred
  to a theming/density pass.
- **shadcn `Direction` provider** — cascivo does RTL via CSS logical properties throughout (an existing
  decision); a JS direction provider is redundant. Marked "covered by convention," not built.
- **A true gesture `Drawer` (vaul-style swipe physics)** — v18 ships a `Drawer` as an edge-anchored
  presence layer; momentum/drag-to-dismiss physics are a follow-up. The `sheet` + `Drawer` cover the
  common cases.
- **Charts parity expansion** — cascivo already ships 16 charts; chart-by-chart parity vs other viz libs
  is its own effort, out of scope here.
- **Full anchor-positioning engine (Floating-UI-class)** — v18 ships a small helper + CSS anchor
  positioning with a JS fallback; a full collision/flip/shift engine is deferred.
- **Codemod for shadcn → cascivo** — still human-followed prose (v17 deferral stands).
  </content>
  </invoke>
