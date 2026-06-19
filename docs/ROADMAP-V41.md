# cascivo — Roadmap v41: HeroUI Study — Adopt the Genuinely-Missing Pieces

**Last updated:** 2026-06-19
**Status:** ✅ Shipped (T1–T5). `image`, `user`, `avatar-group` added; `useDisclosure`/`useInfiniteScroll`/`useDraggable` in `@cascivo/core`; draggable Modal / swipe-to-dismiss Drawer / `scroll-area` mask fade; `--cascivo-disabled-opacity` + `--cascivo-hover-opacity` in all 12 themes.
**Plan documents:** `docs/superpowers/plans/2026-06-19-v41-master-plan.md` + tranches 1–5
**Builds on:** the component registry + manifests (`registry.json`, `packages/components`, `packages/react`),
the `@cascivo/core` hooks/primitives (`useClipboard`, `useControllableSignal`, `useMediaQuery`, …), the
token + theme system (`packages/tokens`, `packages/themes`, `docs/THEME-PROPOSALS.md`), and the v39 RetroUI
study (`docs/ROADMAP-V39.md`) whose "we are already a superset — adopt only what's genuinely missing"
framing this roadmap reuses.

---

## Why this roadmap exists

The brief was to **study [HeroUI](https://heroui.com/)** (formerly NextUI) and find components, layouts,
utilities, and UX/DX/AI ideas worth adopting into cascivo.

The honest headline, as with v39: **cascivo is already a superset of HeroUI at the component level.** HeroUI
v2 (the NextUI lineage) ships ~50 components built on **React Aria + TailwindCSS + Tailwind Variants +
Framer Motion**, distributed as **compiled npm packages** (`@heroui/react` or per-component packages — you
import, you do not own the source). cascivo ships ~115 components (plus a separate `@cascivo/layouts`
package, `@cascivo/charts`, and `@cascivo/ai`). A component-by-component map (below) shows **all but a small
handful** of HeroUI's components already exist here.

So v41 is deliberately **not** a "port the component library" roadmap. Instead it adopts the **genuinely
missing pieces and the ideas worth learning from**, each filtered through cascivo's principles (CSS-native,
signal-driven, owned code, AI-first). HeroUI's stack — React Aria primitives, Tailwind/Tailwind-Variants,
Framer Motion, the `heroui()` JS plugin, and npm-compiled distribution — is explicitly **rejected** as
contrary to cascivo's CSS-native, own-primitives, copy-paste model.

This document records the full study so the decision not to port is auditable, then scopes the five
adoptable workstreams.

> **Note on HeroUI v3.** During the study HeroUI shipped a v3 rewrite (Tailwind v4 CSS-first + OKLCH
> tokens, compound components, ~75 primitives renamed toward React Aria's vocabulary: `TextField`,
> `NumberField`, a full Color suite, `Meter`, `Surface`, `Toolbar`, `Disclosure`, etc.). v41 studies the
> **stable v2** surface (what production apps run and what maps cleanly to cascivo's component model). v3's
> new primitives (Color suite, Meter, Surface/Toolbar) are noted as **future-study candidates**, not v41
> scope.

---

## HeroUI at a glance (what the study found)

| Dimension     | HeroUI (v2)                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Identity      | "Beautiful, fast, modern" — rounded, slightly-playful default look, strong dark mode; alt to MUI/Chakra/shadcn |
| Stack         | React + **React Aria** (behavior/a11y) + **TailwindCSS v3** + **Tailwind Variants** + **Framer Motion** |
| Distribution  | **Compiled npm packages** — `@heroui/react` or per-component (`@heroui/button`). You **import**, not own. |
| CLI           | `heroui-cli` — `init`, `add`, `upgrade`, `list`, `doctor`, `env`, `agents-md`; `@heroui/codemod` migrations |
| Components    | ~50: Accordion, Alert, Autocomplete, Avatar (+Group), Badge, Breadcrumbs, Button (+Group), Calendar, Card, Checkbox (+Group), Chip, CircularProgress, Code, DateInput, DatePicker, DateRangePicker, Divider, Drawer, Dropdown, Form, **Image**, Input, InputOtp, Kbd, Link, Listbox, Modal, Navbar, NumberInput, Pagination, Popover, Progress, RadioGroup, RangeCalendar, **ScrollShadow**, Select, Skeleton, Slider, Snippet, Spacer, Spinner, Switch, Table, Tabs, Textarea, TimeInput, Toast, Tooltip, **User** |
| Hooks         | `@heroui/use-*` packages: **`useDisclosure`**, **`useInfiniteScroll`**, **`useDraggable`**, `usePagination`, `useClipboard` (+ internal aria/dom helpers) |
| Theming       | `heroui()` Tailwind plugin: semantic colors (default/primary/secondary/success/warning/danger, each 50–900 + foreground/DEFAULT), base/layout colors (background/content1–4/focus/overlay/divider), and **layout tokens** (`radius`, `borderWidth`, `disabledOpacity`, `hoverOpacity`, `dividerWeight`, `boxShadow`) that light/dark can retune independently |
| UX            | React-Aria a11y; **draggable Modal / drag-to-dismiss Drawer**; Table/Select/Listbox **virtualization**; **infinite scroll**; ripple on pressables; RTL via logical properties; global `disableAnimation` + reduced-motion |
| AI layer      | **Mature**: official `@heroui/react-mcp` MCP server, `llms.txt`/`llms-full.txt`, agent skills + `AGENTS.md` (via `heroui-cli agents-md`), v2→v3 codemods. Derived from docs, **not** a per-component machine-readable manifest |

### Component map: HeroUI → cascivo (already covered)

| HeroUI               | cascivo equivalent                                  |
| -------------------- | --------------------------------------------------- |
| Accordion            | `accordion` / `collapsible`                         |
| Alert                | `alert` / `alert-dialog`                            |
| Autocomplete         | `combobox` / `multi-select`                         |
| Avatar               | `avatar`  ·  **AvatarGroup → none** ⬅ sub-gap        |
| Badge                | `badge` / `indicator`                               |
| Breadcrumbs          | `breadcrumb`                                        |
| Button / ButtonGroup | `button` / `button-group` / `icon-button`           |
| Calendar             | `calendar`                                          |
| Card                 | `card` / `tile`                                     |
| Checkbox (+Group)    | `checkbox` / `checkbox-card`                        |
| Chip                 | `tag` / `badge`                                     |
| CircularProgress     | `progress-circle` / `radial-progress`              |
| Code                 | `code`                                              |
| DateInput            | `date-picker` (covers; segmented-only entry is a refinement, not a gap) |
| DatePicker           | `date-picker`                                       |
| DateRangePicker      | `date-range-picker`                                 |
| Divider              | `separator`                                         |
| Drawer               | `drawer` / `sheet`                                  |
| Dropdown             | `dropdown` / `menu`                                 |
| Form                 | `form` / `field`                                    |
| **Image**            | **— none —** ⬅ genuine component gap                 |
| Input / InputOtp     | `input` / `input-group` / `otp-input` / `password-input` … |
| Kbd                  | `kbd`                                               |
| Link                 | `link`                                              |
| Listbox              | `menu` / `select` / `contained-list` (covered)      |
| Modal                | `modal`                                             |
| Navbar               | `header` / `shell-header` / `navigation-menu`       |
| NumberInput          | `number-input`                                      |
| Pagination           | `pagination`                                        |
| Popover              | `popover` / `hover-card` / `toggletip`              |
| Progress             | `progress` / `progress-bar` / `progress-indicator`  |
| RadioGroup           | `radio` / `radio-card`                              |
| RangeCalendar        | `calendar` / `date-range-picker`                    |
| **ScrollShadow**     | `scroll-area` (has box-shadow edges) — **mask-fade variant missing** ⬅ enhancement |
| Select               | `select` / `native-select` / `multi-select`         |
| Skeleton             | `skeleton`                                          |
| Slider               | `slider`                                            |
| Snippet              | `code-snippet`                                      |
| Spacer               | `@cascivo/layouts` → `spacer`                        |
| Spinner              | `spinner` / `inline-loading`                        |
| Switch               | `toggle` / `switch`                                 |
| Table                | `data-table` (already virtualized) / `data-list` / `structured-list` |
| Tabs                 | `tabs`                                              |
| Textarea             | `textarea`                                          |
| TimeInput            | `time-picker`                                       |
| Toast                | `toast` / `notification`                            |
| Tooltip              | `tooltip`                                           |
| **User**             | **— none —** ⬅ genuine component gap                 |

**Conclusion:** the only net-new *components* HeroUI has that cascivo lacks are **Image** and **User**, plus
an **AvatarGroup** sub-component and a **ScrollShadow mask-fade** enhancement to `scroll-area`. Everything
else is already shipped, usually with more variants.

### Hooks map: HeroUI `@heroui/use-*` → cascivo `@cascivo/core`

| HeroUI hook         | cascivo                                                     |
| ------------------- | ---------------------------------------------------------- |
| `useClipboard`      | `useClipboard` ✓                                            |
| `usePagination`     | covered (internal to `pagination`)                          |
| **`useDisclosure`** | **— none —** ⬅ DX gap (cascivo uses `useControllableSignal` per-component, no named disclosure primitive) |
| **`useInfiniteScroll`** | **— none —** ⬅ DX gap (no IntersectionObserver sentinel helper) |
| **`useDraggable`**  | **— none —** ⬅ DX gap (no drag-to-dismiss / draggable-overlay helper) |

### Explicitly rejected (does not fit cascivo)

- **Tailwind / Tailwind Variants / the `heroui()` JS plugin** — cascivo is CSS-native (`@layer`, CSS
  Modules, custom properties). **Not adopted.**
- **React Aria dependency** — cascivo builds its own micro-FSM + signals primitives and a11y helpers in
  `@cascivo/core` (`focus-scope`, `roving-focus`, `dismissable-layer`, `visually-hidden`). **Not adopted.**
- **Framer Motion** — animation is CSS-only (`@starting-style`, `view-transition`, keyframes), reduced-motion
  safe. **Not adopted.** (HeroUI's draggable-overlay *interaction* is adopted as a CSS-transform + pointer
  helper — see T3/T4 — without the Framer dependency.)
- **npm-compiled distribution / `heroui-cli add` (package installs)** — cascivo's model is copy-paste owned
  source via `npx cascivo add` + the shadcn-registry interop added in v39. **Not adopted.**
- **`heroui-cli doctor` / `agents-md`** — cascivo **already** ships a `doctor` command
  (`packages/cli/src/commands/doctor.ts`) and an AI layer (MCP, skills, `llms.txt` in both docs and landing,
  per-component manifests) that is **ahead** of HeroUI's docs-derived approach. No action. (One thin,
  optional AI parity item — a vendor-neutral `AGENTS.md` emit — is noted in T5 as a stretch.)
- **Re-porting the ~45 covered components** — already superseded. **Not adopted.**

---

## What *is* worth adopting (the five workstreams)

| #   | Workstream                                   | Tranche | Origin in HeroUI                                          | Category   |
| --- | -------------------------------------------- | ------- | --------------------------------------------------------- | ---------- |
| A   | **`image` component**                        | T1      | HeroUI `Image` (loading/blur/fallback/zoom)               | component  |
| B   | **`user` + `avatar-group` components**       | T2      | HeroUI `User` and `AvatarGroup`                           | component  |
| C   | **Interaction hooks in `@cascivo/core`**     | T3      | HeroUI `useDisclosure` / `useInfiniteScroll` / `useDraggable` | DX / core |
| D   | **Interaction polish + state tokens**        | T4      | draggable Modal/Drawer, infinite scroll, ScrollShadow fade, layout-opacity tokens | UX / theming |
| E   | **HeroUI study doc + final gate**            | T5      | the study record + optional `AGENTS.md` AI-parity stretch | docs       |

Why these five, and why in this order:

1. **T1 — `image` (clearest component gap).** A dedicated Image component is HeroUI's single most-used
   net-new primitive: a signal-driven loading FSM (`loading → loaded → error`), a blur-up / skeleton
   placeholder, graceful `fallbackSrc`, optional `zoom` on hover, and aspect-ratio awareness (reusing
   cascivo's `aspect-ratio` + `skeleton`). Net-new, self-contained, ships a manifest.
2. **T2 — `user` + `avatar-group`.** HeroUI's `User` (avatar + name/description composite) and `AvatarGroup`
   (overlapping stack with a `+N` overflow and `max`) are the two identity-display pieces cascivo lacks.
   Both **reuse the existing `avatar`** — small, high-value, manifest-backed.
3. **T3 — interaction hooks.** HeroUI's user-facing `@heroui/use-*` hooks that cascivo's core lacks:
   `useDisclosure` (signal-based open/close for overlays), `useInfiniteScroll` (IntersectionObserver
   sentinel), and `useDraggable` (pointer-driven transform for draggable overlays). Pure additions to
   `@cascivo/core`, no banned hooks (`useSignal`/`useSignalEffect`/`useRef` only).
4. **T4 — apply the hooks + interaction polish.** Consume T3: an opt-in `draggable` Modal / drag-to-dismiss
   Drawer (CSS transform via `useDraggable`, no Framer), an infinite-scroll integration path for
   `data-table`/`select`, a **mask-fade** variant on `scroll-area` (HeroUI's `ScrollShadow`), and the one
   genuine **theming** gap: semantic **interaction-state tokens** (`--cascivo-disabled-opacity`,
   `--cascivo-hover-opacity`) added to **all 12** themes for parity. (HeroUI's `radius` layout knob is
   **already** covered by cascivo's `--cascivo-radius-base` — noted, not re-done.)
5. **T5 — docs + gate.** Record the full HeroUI study (this roadmap), document the new components/hooks/
   tokens, `pnpm regen`, and run the full CI gate + drift + a grep sweep. Optional stretch: emit a
   vendor-neutral `AGENTS.md` (HeroUI parity) since cascivo's other AI surfaces already lead.

---

## What exists today (verified against the codebase)

| Area                  | State                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Components            | ~115 in `packages/components/src/*`, re-exported from `packages/react/src/index.ts`; metas enumerated in `_all-metas.ts` |
| Image / User          | **None** — no `image` or `user` component; `avatar` exists but has **no group** sub-component        |
| Avatar                | `avatar/avatar.tsx` — load FSM (`loading/loaded/error`), `fallback`, `size`, `status`; **no overlap/stack group** |
| scroll-area           | `scroll-area` already renders **box-shadow** edge affordances; **no `mask-image` fade** variant      |
| data-table            | already supports `virtualized`/`rowHeight`/`overscan`; **no infinite-scroll sentinel hook**          |
| Core hooks            | `useClipboard`, `useControllableSignal`, `useMediaQuery`, `useScrollLock`, `useId`, `useRovingFocus`, `useAnchorPosition` — **no `useDisclosure`/`useInfiniteScroll`/`useDraggable`** |
| Modal / Drawer        | `modal`, `drawer`, `sheet` — **not draggable** (no drag-to-dismiss)                                  |
| Tokens                | `--cascivo-radius-base` is a **one-knob** semantic radius (themes retune it) ✓; **no `--cascivo-disabled-opacity` / `--cascivo-hover-opacity`** semantic tokens |
| Themes                | 12 (`light,dark,warm,flat,minimal,midnight,pastel,brutalist,corporate,terminal,cyberpunk,arcade`); `parity.test.ts` + `chart-palette.test.ts` gates |
| CLI                   | `cascivo` CLI incl. an existing **`doctor`** command (`packages/cli/src/commands/doctor.ts`)         |
| AI layer              | per-component `component.meta.ts` → MCP (`@cascivo/mcp`), skills, auto-docs, `llms.txt` (docs + landing) — **ahead** of HeroUI |

---

## Target state (after v41)

| Concern                        | Today                              | Target                                                                 |
| ------------------------------ | ---------------------------------- | ---------------------------------------------------------------------- |
| Components                     | ~115 (no Image/User)               | +2 (`image`, `user`) + `avatar-group`, each with manifest, react export, registry entry, tests |
| Avatar                         | single                             | + `AvatarGroup` (overlap stack, `max`, `+N` overflow)                  |
| scroll-area                    | box-shadow edges only              | + opt-in `mask`/fade variant (HeroUI ScrollShadow)                     |
| Core hooks                     | 7                                  | + `useDisclosure`, `useInfiniteScroll`, `useDraggable` (signal-driven)  |
| Modal / Drawer                 | static                             | opt-in `draggable` Modal / drag-to-dismiss Drawer (CSS transform, no Framer) |
| Interaction-state tokens       | none                               | `--cascivo-disabled-opacity` / `--cascivo-hover-opacity` in **all 12** themes (parity) |
| Docs                           | —                                  | HeroUI study recorded; new components/hooks/tokens documented           |

---

## Key open decisions (recommendations in the master plan)

1. **Adopt `image`, given cascivo has `aspect-ratio` + `skeleton`?** _Recommendation: **yes** — a dedicated
   `image` that **composes** those two._ A real Image primitive owns the load FSM, blur-up/skeleton swap,
   `fallbackSrc`, and optional `zoom` — behaviour `aspect-ratio` (a layout box) and `skeleton` (a placeholder)
   do not provide on their own. It mirrors the `avatar` load-FSM pattern exactly.
2. **`user` as a component or a block?** _Recommendation: **a component** (`category: 'display'`), not a
   block._ HeroUI ships `User` as a first-class component; it is a tiny, reusable identity primitive (avatar +
   name + description + optional action slot) used inside menus, tables, navbars — too granular for the
   `blocks/` layer (which is page-section compositions).
3. **`avatar-group` as its own component or part of `avatar`?** _Recommendation: **its own directory
   (`avatar-group`) that re-exports/wraps `avatar`**_, matching cascivo's `button`/`button-group` and
   `radio`/`radio-card` precedent. Keeps `avatar` simple; the group owns `max` + `+N` overflow + overlap
   spacing.
4. **`useDraggable` without Framer Motion?** _Recommendation: **yes** — pointer events + a `useSignal`
   transform offset, applied as a CSS `translate`._ No animation library. Respect `prefers-reduced-motion`
   for any settle transition; keep the drag handle opt-in (a header ref). This is the one HeroUI *interaction*
   worth the JS; the Framer *dependency* is not.
5. **ScrollShadow: new component or `scroll-area` variant?** _Recommendation: **a variant on `scroll-area`**_
   (e.g. `edges="mask"`), not a new component. `scroll-area` already detects overflow and renders box-shadow
   edges; adding a `mask-image` fade is a CSS-only addition to the same component, gated by a prop, with the
   box-shadow remaining the default/fallback.
6. **Interaction-state tokens scope.** _Recommendation: add **only** `--cascivo-disabled-opacity` and
   `--cascivo-hover-opacity`_ (the HeroUI layout tokens cascivo genuinely lacks). cascivo's `radius` one-knob
   (`--cascivo-radius-base`) and border/shadow tokens already cover the rest. Both new tokens land in **all 12**
   themes in the same tranche so `parity.test.ts` stays green; wiring them into a couple of components
   (e.g. routing `:disabled` opacity through the token) proves the mechanism without a mass refactor.
7. **AGENTS.md AI-parity — in scope?** _Recommendation: **optional T5 stretch only.**_ cascivo's AI layer
   (manifests, MCP, skills, `llms.txt`) already exceeds HeroUI's. A vendor-neutral `AGENTS.md` (read by Cursor/
   Copilot/etc.) is the one small parity item; emit it from existing sources if cheap, else defer — it does not
   block the gate.

---

## Cross-cutting rules

1. **No Tailwind/Tailwind-Variants, no React Aria, no Framer Motion, no npm-compiled distribution.** Adopt
   ideas, not HeroUI's stack. CSS-native + `@cascivo/core` signals/FSM throughout. Every net-new component
   obeys the CLAUDE.md authoring rules (no `useState`/`useEffect`/`useContext`/`useReducer`; `useSignal*` +
   `useRef`; CSS for hover/focus/active/disabled; i18n-defaulted strings; `useSignals()` when reading a
   signal during render in React apps).
2. **DOM side effects use `useSignalEffect`.** The Image load handlers, the `useInfiniteScroll`
   IntersectionObserver, and the `useDraggable` pointer listeners all attach/detach via `useSignalEffect`
   with cleanup — never `useEffect`. SSR/no-DOM guarded (`typeof IntersectionObserver`, `typeof window`).
3. **Parity is a hard gate.** The two new interaction-state tokens (T4) are added to **all 12** theme files in
   the same tranche; `parity.test.ts` (identical `--cascivo-*` set) and `chart-palette.test.ts` stay green.
4. **Animations are progressive enhancement + reduced-motion-safe.** Image blur-up, `scroll-area` mask fade,
   and any draggable settle transition each have a static fallback (`fallback:check`) and are disabled under
   `prefers-reduced-motion: reduce`; no off-scale breakpoint literals (`breakpoint:check`); never
   `display:none` content away (≥44px coarse-pointer targets where interactive).
5. **AI-first discipline.** `image`, `user`, and `avatar-group` each ship a `component.meta.ts`, are added to
   `packages/react/src/index.ts` and `_all-metas.ts`, and appear in `registry.json` after `pnpm regen` so
   MCP/docs/Storybook pick them up automatically. New hooks are exported from `@cascivo/core`'s `index.ts`.
6. **Additive, not a rewrite.** New components/hooks/tokens are net-new; existing component APIs gain only
   **opt-in** props (`draggable`, `edges="mask"`). No behavior change to existing call sites.
7. **Generated artifacts stay in sync.** `pnpm regen` after wiring; the drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `pnpm ready` green
   before each commit.

---

## Definition of Done

### T1 — `image` component

- [x] `packages/components/src/image/` ships `image.tsx` + `image.module.css` + `image.meta.ts` + `image.test.tsx`.
- [x] Signal-driven load FSM (`loading → loaded → error`) modelled on `avatar`; `src`, `alt`, `fallbackSrc`,
      `width`/`height`/`radius`, optional `zoom`, blur-up/`skeleton` placeholder during `loading`. No banned hooks.
- [x] WCAG AA (`alt` required-or-decorative semantics), reduced-motion-safe blur/zoom with static fallbacks,
      logical-property CSS; ≥44px target only if interactive.
- [x] Manifest complete; exported from `packages/react/src/index.ts` + `_all-metas.ts`; appears in
      `registry.json` after `pnpm regen`. `pnpm exec vp run @cascivo/components#test` green for `image`.

### T2 — `user` + `avatar-group` components

- [x] `packages/components/src/user/` and `packages/components/src/avatar-group/` each ship tsx + css + meta + test.
- [x] `user` composes `avatar` + name/description (+ optional trailing action slot); `avatar-group` overlaps N
      `avatar`s with `max` + a `+N` overflow chip and configurable spacing; both reuse the existing `avatar`.
- [x] i18n-defaulted strings (e.g. avatar-group overflow label) via `@cascivo/i18n` `builtin`; WCAG AA;
      manifests complete; both exported from `packages/react/src/index.ts` + `_all-metas.ts`; in `registry.json`.
- [x] `pnpm exec vp run @cascivo/components#test` green for `user` + `avatar-group`.

### T3 — interaction hooks in `@cascivo/core`

- [x] `useDisclosure` (`{ isOpen, open, close, toggle, onOpenChange }`, signal-backed, controllable),
      `useInfiniteScroll` (IntersectionObserver sentinel ref + `hasMore`/`onLoadMore`, `useSignalEffect`),
      `useDraggable` (pointer-driven `{ x, y }` signal offset + handle/target refs) — all in
      `packages/core/src/`, exported from `index.ts`, each with a unit test. No `useState`/`useEffect`.
- [x] SSR/no-DOM guarded; observers/listeners cleaned up in `useSignalEffect` teardown.
- [x] `pnpm exec vp run @cascivo/core#test` green.

### T4 — interaction polish + state tokens

- [x] `modal` gains an opt-in `draggable` prop (drag by header via `useDraggable`, CSS `translate`, no Framer);
      `drawer` gains opt-in drag-to-dismiss. Reduced-motion-safe; default behavior unchanged.
- [x] `scroll-area` gains an opt-in mask/fade variant (`mask-image`) with the existing box-shadow as the static
      fallback; `fallback:check` + `breakpoint:check` pass.
- [x] A documented infinite-scroll integration path (`useInfiniteScroll`) demonstrated with `data-table` or
      `select` (example/test), no real timers.
- [x] `--cascivo-disabled-opacity` + `--cascivo-hover-opacity` added to `packages/tokens` + **all 12** theme
      files; `parity.test.ts` + `chart-palette.test.ts` green; ≥1 component routes its state opacity through the
      token to prove the mechanism.

### T5 — HeroUI study doc + final gate

- [x] This roadmap + the new components/hooks/tokens documented (component docs, `THEME-PROPOSALS.md` for the
      interaction tokens, a core-hooks note).
- [x] Optional stretch: a vendor-neutral `AGENTS.md` emitted from existing sources (HeroUI parity) — or
      explicitly deferred.
- [x] `pnpm regen`; drift gate green; full CI gate passes: `vp check`, `pnpm build`, `vp run -r check`,
      `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`; grep sweep confirms `image`/`user`/
      `avatar-group` reached every registration surface.
</content>
</invoke>
