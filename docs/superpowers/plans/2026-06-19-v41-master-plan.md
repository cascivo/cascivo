# v41 — HeroUI Study → Adopt the Genuinely-Missing Pieces — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Study [HeroUI](https://heroui.com/) (formerly NextUI) and adopt the **five** things cascivo
genuinely lacks or can learn from — **not** re-port its component library. A component-by-component map (in
`docs/ROADMAP-V41.md`) shows cascivo (~115 components + `@cascivo/layouts`/`charts`/`ai`) is already a
superset of HeroUI v2 (~50, on React Aria + TailwindCSS + Tailwind Variants + Framer Motion, distributed as
compiled npm packages). The only net-new *components* are **Image** and **User** (plus an **AvatarGroup**
sub-component and a **ScrollShadow** mask-fade enhancement to `scroll-area`). The other adoptions are a DX
gap (HeroUI's user-facing **`@heroui/use-*` hooks** — `useDisclosure`, `useInfiniteScroll`, `useDraggable`),
a couple of **UX interactions** (draggable Modal / drag-to-dismiss Drawer, infinite scroll), and the one
genuine **theming** gap (HeroUI's **layout-opacity tokens**: `disabledOpacity`/`hoverOpacity`). HeroUI's
stack — Tailwind/Tailwind-Variants, React Aria, Framer Motion, the `heroui()` JS plugin, and npm-compiled
distribution — is explicitly **rejected** as contrary to cascivo's CSS-native, own-primitives, copy-paste
principles. HeroUI's `radius` layout knob is **already** covered by cascivo's `--cascivo-radius-base`, and
its `doctor`/AI tooling is **already** matched or exceeded (cascivo ships `doctor`, MCP, skills, `llms.txt`,
per-component manifests).

Target state (verified after T5):

| Metric                                   | Today                      | Target |
| ---------------------------------------- | -------------------------- | ------ |
| Components                               | ~115 (no Image/User)       | +2 (`image`, `user`) + `avatar-group` (manifest + react export + registry + tests) |
| Avatar                                   | single                     | + `AvatarGroup` (overlap, `max`, `+N`) |
| scroll-area                              | box-shadow edges           | + opt-in `mask`/fade variant |
| Core hooks                               | 7                          | + `useDisclosure`, `useInfiniteScroll`, `useDraggable` |
| Modal / Drawer                           | static                     | opt-in `draggable` / drag-to-dismiss (CSS transform, no Framer) |
| Interaction-state tokens                 | none                       | `--cascivo-disabled-opacity` + `--cascivo-hover-opacity` in all 12 themes |
| Themes in `parity.test.ts` / chart-CVD   | 12                         | 12 (new tokens in all) |
| Full CI gate (`pnpm ready`)              | green                      | green |

**Architecture & evidence (reproduced in-repo before planning):**

- **Components:** `packages/components/src/*` (~115 dirs), re-exported from `packages/react/src/index.ts`
  (`export * from '../../components/src/<name>/<name>'`), metas enumerated in
  `packages/components/src/_all-metas.ts`. Mapping every HeroUI v2 component to a cascivo equivalent leaves
  exactly two component gaps — **`image`** and **`user`** — plus an **`avatar-group`** sub-component and a
  **`scroll-area`** mask-fade enhancement.
- **Avatar:** `packages/components/src/avatar/avatar.tsx` uses `createMachine`/`useMachine`
  (`loading → loaded → error`), `useSignals()`, `fallback`, `size`, `status`. It has **no group/stack**
  sub-component — the model both `image` (load FSM) and `avatar-group` (wraps `avatar`) follow.
- **scroll-area:** `packages/components/src/scroll-area/scroll-area.module.css` already renders **box-shadow**
  inset edges driven by `data-*` attributes set from scroll position (no `useEffect`). It has **no
  `mask-image` fade** — T4 adds that as an opt-in variant with box-shadow as the static fallback.
- **data-table:** already supports `virtualized`/`rowHeight`/`overscan` (so HeroUI's Table virtualization is
  covered). It has **no infinite-scroll sentinel** — T4 demonstrates `useInfiniteScroll` against it.
- **Core hooks:** `packages/core/src/` exports `useClipboard`, `useControllableSignal`, `useMediaQuery`,
  `useScrollLock`, `useId`, `useRovingFocus`, `useAnchorPosition`. The `clipboard.ts` hook
  (`useSignal` + `useRef` + `useSignalEffect` cleanup, no `useEffect`) is the **template** for T3's three
  new hooks. There is **no** `useDisclosure`/`useInfiniteScroll`/`useDraggable`.
- **Tokens / themes:** `packages/tokens/src/index.css` declares a **one-knob** semantic radius
  `--cascivo-radius-base` (themes retune it) — so HeroUI's `radius` layout token is **already** covered. It
  has **no** `--cascivo-disabled-opacity`/`--cascivo-hover-opacity`. 12 theme files in `packages/themes/src/*`
  (`light,dark,warm,flat,minimal,midnight,pastel,brutalist,corporate,terminal,cyberpunk,arcade`);
  `parity.test.ts` asserts an identical `--cascivo-*` key set, `chart-palette.test.ts` runs CVD simulation —
  both new tokens must land in all 12 in the same tranche.
- **i18n:** `packages/i18n/src/builtin.ts` holds per-component built-in catalogs (`defineMessages('cascade.<c>', …)`);
  new user-visible strings (e.g. avatar-group overflow label) default from here.
- **CLI / AI:** `packages/cli/src/commands/` already includes `doctor.ts`; `@cascivo/mcp`, `skills/`,
  `llms.txt` (in `apps/docs/public` + `apps/landing/public`), and per-component manifests put cascivo's AI
  layer **ahead** of HeroUI's docs-derived MCP/llms.txt. No AI work beyond discipline (manifests for the new
  components) + an optional vendor-neutral `AGENTS.md` stretch in T5.

**Tech Stack:** signal-driven TSX + CSS Modules for T1/T2 (no Tailwind, no React Aria, no Framer, no
`useState`/`useEffect`); pure signal hooks for T3 (`useSignal`/`useSignalEffect`/`useRef`); CSS + opt-in
props + token rows for T4; docs + gate for T5. vite+ (`vp`) for check/build/test throughout.
Progressive-enhancement CSS (`@function`/`if()` only with static fallbacks — `fallback:check`).

---

## Tranche Overview

| Tranche | Title                                | Goal                                                                                                  |
| ------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| T1      | `image` component                    | New signal-driven Image (load FSM, blur-up/skeleton, `fallbackSrc`, `zoom`, aspect-ratio) + manifest + react export + registry + tests. The clearest component gap. |
| T2      | `user` + `avatar-group`              | Two identity-display components that reuse `avatar` (User = avatar+name/desc; AvatarGroup = overlap + `max` + `+N`) + manifests + tests. |
| T3      | `@cascivo/core` interaction hooks    | Add `useDisclosure`, `useInfiniteScroll`, `useDraggable` (signal-driven, no banned hooks) + unit tests. The HeroUI `@heroui/use-*` DX gap. |
| T4      | Interaction polish + state tokens    | Consume T3: draggable Modal / drag-to-dismiss Drawer; `scroll-area` mask-fade variant; infinite-scroll integration; add `--cascivo-disabled-opacity`/`--cascivo-hover-opacity` to all 12 themes (parity). |
| T5      | HeroUI study doc + final gate        | Document the study + new surfaces; optional `AGENTS.md` stretch; `pnpm regen`; full gate + drift + grep sweep. |

Ordering rationale: **T1** and **T2** are independent net-new components (T2 reuses `avatar` only) and can
run in parallel; sequenced T1 → T2 for a single reviewer. **T3** (pure core hooks) is independent of T1/T2.
**T4 depends on T3** (it consumes all three hooks) and on the token parity discipline; it is the most
cross-cutting tranche (touches `modal`, `drawer`, `scroll-area`, `tokens`, and all 12 theme files). **T5**
documents everything and runs the final gate including drift and a grep sweep proving the new components
reached every registration surface (`react/src/index.ts`, `_all-metas.ts`, `registry.json`).

---

## Files Created / Modified per Tranche

### T1 — `image` component

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/components/src/image/image.tsx`, `image.module.css`, `image.meta.ts`, `image.test.tsx` |
| Modify | `packages/react/src/index.ts` (export `image`)                                          |
| Modify | `packages/components/src/_all-metas.ts` (add `imageMeta`)                                |
| Modify | `packages/i18n/src/builtin.ts` (if Image surfaces any string, e.g. error alt)           |
| Regen  | `registry.json` (`pnpm regen`)                                                           |

### T2 — `user` + `avatar-group`

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/components/src/user/user.tsx`, `user.module.css`, `user.meta.ts`, `user.test.tsx` |
| Create | `packages/components/src/avatar-group/avatar-group.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` |
| Modify | `packages/react/src/index.ts` (export `user`, `avatar-group`)                            |
| Modify | `packages/components/src/_all-metas.ts` (add `userMeta`, `avatarGroupMeta`)              |
| Modify | `packages/i18n/src/builtin.ts` (avatar-group overflow / user label defaults)            |
| Regen  | `registry.json` (`pnpm regen`)                                                           |

### T3 — `@cascivo/core` interaction hooks

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/core/src/disclosure.ts` + `disclosure.test.ts`                                |
| Create | `packages/core/src/infinite-scroll.ts` + `infinite-scroll.test.ts`                      |
| Create | `packages/core/src/draggable.ts` + `draggable.test.ts`                                  |
| Modify | `packages/core/src/index.ts` (export the three hooks + their types)                     |
| Modify | `packages/core/README.md` (document the new hooks)                                       |

### T4 — interaction polish + state tokens

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `packages/components/src/modal/modal.tsx` (+ `.module.css`) — opt-in `draggable`        |
| Modify | `packages/components/src/drawer/drawer.tsx` (+ `.module.css`) — opt-in drag-to-dismiss  |
| Modify | `packages/components/src/scroll-area/scroll-area.tsx` (+ `.module.css`) — `mask`/fade variant |
| Modify | `packages/tokens/src/index.css` (add `--cascivo-disabled-opacity`, `--cascivo-hover-opacity`) |
| Modify | `packages/themes/src/*.css` (all 12 — declare the two new tokens for parity)            |
| Modify | `packages/themes/src/parity.test.ts` (confirm new tokens in the asserted set)           |
| Modify | one consuming component (e.g. `button`/`input`) to route a state opacity through the token |
| Modify | a `data-table`/`select` example or test demonstrating `useInfiniteScroll`               |

### T5 — HeroUI study doc + final gate

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `docs/ROADMAP-V41.md` (status → in progress/done as tranches land)                      |
| Modify | `docs/THEME-PROPOSALS.md` (interaction-state opacity tokens documented)                 |
| Modify | component docs / `packages/core/README.md` (new components + hooks)                      |
| Create | `AGENTS.md` (optional stretch — vendor-neutral agent guide, HeroUI parity) or defer     |
| Verify | `pnpm regen` (registry + generated listings); commit drift                              |
| Verify | full gate: `vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`, drift; grep sweep for `image`/`user`/`avatar-group` |

---

## Key Decisions

### Decision 1 — Do NOT re-port HeroUI's components (firm)

cascivo (~115 components) already supersedes HeroUI v2 (~50). The component map in `docs/ROADMAP-V41.md`
shows every HeroUI component has a cascivo equivalent **except** `image` and `user` (plus an `avatar-group`
sub-component and a `scroll-area` enhancement). Re-porting would be redundant and would import HeroUI's stack
assumptions (Tailwind, React Aria, Framer Motion). **Decision: adopt `image` + `user` + `avatar-group` as
net-new; reject the rest as already-shipped.** This is the central honest finding and the reason v41 is
scoped around ideas, not ports.

### Decision 2 — Reject Tailwind/Tailwind-Variants, React Aria, Framer Motion, npm-compiled distribution (firm)

HeroUI is Tailwind + Tailwind Variants for styling, React Aria for behavior/a11y, Framer Motion for
animation, the `heroui()` JS plugin for theming, and **compiled npm packages** for distribution. cascivo is
CSS-native (`@layer`, CSS Modules, custom properties), builds its own micro-FSM + signals + a11y helpers in
`@cascivo/core`, animates with CSS only, and distributes copy-paste owned source. **Decision: none of
HeroUI's stack is adopted.** The study records each as "considered, rejected, with reason." The one HeroUI
*interaction* worth keeping — draggable overlays — is reimplemented as pointer events + a `useSignal` CSS
transform (T3/T4), **without** the Framer dependency.

### Decision 3 — `image` composes `aspect-ratio` + `skeleton`, mirrors the `avatar` load FSM (recommended)

cascivo has `aspect-ratio` (a layout box) and `skeleton` (a placeholder), but neither owns image **load
behavior**. **Decision: a dedicated `image` component** with a signal-driven `loading → loaded → error` FSM
(modelled on `avatar/avatar.tsx`), a blur-up/`skeleton` placeholder during `loading`, graceful `fallbackSrc`
on error, `width`/`height`/`radius`, and an optional hover `zoom`. Load handlers fire `LOADED`/`ERROR` via
`onLoad`/`onError` (no `useEffect`). Blur/zoom are reduced-motion-safe with static fallbacks. Rejected: a
bare `<img>` wrapper (provides nothing over `aspect-ratio`) and a `useEffect`-based loader (violates the
reactivity rules).

### Decision 4 — `user` is a component; `avatar-group` is its own directory (recommended)

**Decision: `user` ships as a `display` component** (avatar + name + description + optional trailing action
slot) — it is a granular identity primitive used inside menus/tables/navbars, too small for the page-section
`blocks/` layer. **`avatar-group` ships as its own directory** that wraps the existing `avatar` (matching
`button`/`button-group`, `radio`/`radio-card`), owning overlap spacing, a `max` cap, and a `+N` overflow chip
with an i18n-defaulted label. Both reuse `avatar` rather than duplicating its FSM. Rejected: folding
`avatar-group` into `avatar.tsx` (bloats the simple primitive) and shipping `user` as a block (wrong altitude).

### Decision 5 — Three signal-driven hooks, no banned hooks (recommended)

**Decision: add `useDisclosure`, `useInfiniteScroll`, `useDraggable` to `@cascivo/core`**, each built from
`useSignal`/`useSignalEffect`/`useRef` (the `clipboard.ts` template), exported from `index.ts`, unit-tested.
`useDisclosure` returns `{ isOpen, open, close, toggle, onOpenChange }` backed by a signal (controllable via
an optional `isOpen` arg). `useInfiniteScroll` returns a sentinel `ref` + wires an `IntersectionObserver`
(via `useSignalEffect`, SSR-guarded) that calls `onLoadMore` while `hasMore`. `useDraggable` returns
`{ x, y }` offset signal + `handleRef`/`targetRef`, attaching pointer listeners in `useSignalEffect` and
clearing them in teardown; `prefers-reduced-motion` disables any settle transition. Rejected: `useState`/
`useEffect` implementations (violate CLAUDE.md), and a Framer-based drag (rejected dependency).

### Decision 6 — ScrollShadow is a `scroll-area` variant, not a new component (recommended)

cascivo's `scroll-area` already detects overflow and renders box-shadow edge affordances. **Decision: add an
opt-in `mask`/fade variant (`mask-image` gradient) to `scroll-area`**, gated by a prop, with the existing
box-shadow as the static fallback (so non-supporting browsers and the default keep working). No new
component, no behavior change to existing call sites. Rejected: a standalone `scroll-shadow` component
(duplicates `scroll-area`'s overflow detection).

### Decision 7 — Add only the interaction-opacity tokens; radius is already covered (recommended)

HeroUI's layout tokens are `radius`, `borderWidth`, `disabledOpacity`, `hoverOpacity`, `dividerWeight`,
`boxShadow`. cascivo **already** has a one-knob `--cascivo-radius-base` (themes retune it) plus border/shadow
tokens. **Decision: add only `--cascivo-disabled-opacity` and `--cascivo-hover-opacity`** — the genuine gap —
to `packages/tokens` and **all 12** theme files in the same tranche (so `parity.test.ts` stays green), and
route ≥1 component's state opacity through the new token to prove the mechanism. Rejected: re-implementing a
radius/border knob (already exists) and a mass refactor of every component's `:disabled`/`:hover` opacity
(out of scope — prove the mechanism, don't sweep).

### Decision 8 — AI parity is already met; `AGENTS.md` is an optional stretch (recommended)

cascivo's AI layer (per-component `component.meta.ts` manifests, `@cascivo/mcp`, `skills/`, `llms.txt` in
docs + landing) already **exceeds** HeroUI's docs-derived MCP + `llms.txt`. cascivo also already ships a
`doctor` CLI command, so HeroUI's `doctor`/`agents-md` are not gaps. **Decision: the only optional AI-parity
item is a vendor-neutral `AGENTS.md`** (read by Cursor/Copilot/etc.), emitted from existing sources in T5 if
cheap, else explicitly deferred. It does not block the gate.

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before each commit.
2. **No Tailwind, no React Aria, no Framer Motion, no banned hooks.** New TSX (`image`, `user`,
   `avatar-group`) and hooks obey CLAUDE.md: no `useState`/`useEffect`/`useContext`/`useReducer`;
   `useSignal*` + `useRef` only; CSS handles hover/focus/active/disabled; i18n-defaulted strings;
   `useSignals()` when a signal is read during render in React apps.
3. **DOM side effects use `useSignalEffect`.** Image `onLoad`/`onError`, the `useInfiniteScroll`
   IntersectionObserver, and the `useDraggable` pointer listeners attach/detach via `useSignalEffect` with
   cleanup — never `useEffect`. SSR/no-DOM guarded.
4. **Parity is a hard gate:** T4's two interaction-state tokens are added to **all 12** themes in the same
   tranche; `parity.test.ts` (identical `--cascivo-*` set) and `chart-palette.test.ts` stay green.
5. **Animations: progressive enhancement + reduced-motion.** Image blur-up, `scroll-area` mask fade, and any
   draggable settle transition have a static fallback before every progressive declaration
   (`fallback:check`), are disabled under `prefers-reduced-motion: reduce`; no off-scale breakpoint literals
   (`breakpoint:check`); no `display:none` data loss; ≥44px coarse-pointer targets where interactive.
6. **Additive only:** existing component APIs gain **opt-in** props (`draggable`, `edges="mask"`); no behavior
   change to existing call sites. New hooks/components are net-new.
7. **AI-first:** `image`/`user`/`avatar-group` each ship a `component.meta.ts`, are added to
   `packages/react/src/index.ts` and `_all-metas.ts`; new hooks are exported from `@cascivo/core`'s `index.ts`;
   `pnpm regen` refreshes `registry.json`.
8. **Generated artifacts stay in sync:** `pnpm regen` after wiring; drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `brand:check` green.
</content>
