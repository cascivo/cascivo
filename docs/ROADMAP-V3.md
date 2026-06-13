# cascade — Roadmap v3: Catalog Depth, AI Surfaces, Modern Themes

**Last updated:** 2026-06-11
**Status:** Planning — supersedes nothing; `docs/ROADMAP-V2.md` is complete (all seven tranches landed)
**Decisions baked in:** Popover lands first (everything floats on it) · new components stay one-component-one-import · themes override the semantic layer only · gap-fill is demand-weighted, not catalog-complete · AI-native components (AiChat, Terminal) are first-party differentiators, not ports

This document is the ground truth for v3. Like v1/v2, it is structured so an agent can pick up any milestone and execute it without additional context. Gap analysis sources: `@carbon/react@1.109.0` (live unpkg index), ui.shadcn.com component index + theming docs, Ark UI, Radix primitives (all fetched 2026-06-11).

---

## Vision

v2 made cascade an application platform. v3 makes it the design system you _prefer_ — deep enough that no real app hits a missing component, distinctive enough that an AI-built product doesn't look like a template:

> A cascade app should be visibly better-looking than a shadcn app, materially more complete than one built on shadcn's catalog, and the only system where "add an AI chat to my dashboard" is a one-component answer.

Three workstreams serve that sentence:

1. **Catalog depth** — close the high-priority gaps vs Carbon and shadcn/ui (~25 new components), anchored by a shared Popover primitive.
2. **AI-native components** — AiChat, Terminal, streaming-text affordances: components Carbon and shadcn don't have, built on signals where streaming is the natural fit.
3. **Theme modernization** — restyle the three existing themes to contemporary standards (oklch, restrained shadows, soft focus rings) and ship two new first-party themes: `flat` and `minimal`.

Everything inherits the v2 cross-cutting rules: signals not hooks, CSS-only motion, manifests + registry + MCP + llms.txt regeneration in the same PR (drift gate), i18n built-in strings, perf budgets in CI.

---

## Current State (start of v3)

| Area       | Status                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| Components | 41 components in registry; 16 charts; 11 layouts; 9 blocks — 77 registry entries                                           |
| Packages   | `core`, `tokens`, `themes`, `icons`, `i18n`, `storage`, `charts`, `render`, `cli`, `mcp`, `components`, `layouts`, `react` |
| Themes     | `light`, `dark`, `warm` — Tailwind-era hex grays, 4–6px radius, conventional shadow scale                                  |
| AI layer   | MCP (validate_view/scaffold_view + registry tools), 4 skills, llms.txt + per-component md, JSON renderer + codegen         |
| Gates      | check/test/build, drift (registry/readme/schema/llms), visual, perf, animation audit                                       |

---

## Gap Analysis Summary (researched 2026-06-11)

**The #1 structural gap is a Popover primitive** — date-picker, combobox, dropdown each own their floating logic today; Carbon, shadcn, Radix, and Ark all treat anchored-floating-panel as the foundation. CSS Anchor Positioning + the Popover API make a from-scratch, zero-dependency implementation realistic within cascade's modern-CSS thesis.

**High-priority gaps present in BOTH Carbon and shadcn** (table-stakes): Popover, segmented control (ContentSwitcher/ToggleGroup), Menu primitive, AlertDialog/confirm, MultiSelect, PasswordInput, IconButton, copy-to-clipboard, Sheet/Drawer.

**High-priority single-source gaps:** Calendar (shadcn), InputGroup/ButtonGroup (shadcn), Collapsible (shadcn), CodeSnippet (Carbon), inline Notification with actions (Carbon), TagsInput (Ark — neither competitor has it; enterprise-forms win).

**Deliberately skipped (recorded so we don't re-litigate):** Carbon Layer (Carbon-specific elevation model), Menubar (desktop-app niche), Carousel (marketing niche; revisit on demand), AspectRatio (one line of CSS), Marquee/QR/SignaturePad/Timer (novelty), Carbon Fluid\* variants (style variants, not components).

---

## Phase 1 — The Floating Foundation

**Goal:** one primitive that every floating surface builds on; retire per-component floating logic.

### Milestone 1.1 — Popover primitive (`packages/components/src/popover/`)

- [ ] Built on the native **Popover API** (`popover` attribute, top layer) + **CSS Anchor Positioning** (`anchor-name`/`position-anchor`, `position-try-fallbacks` for flipping) — zero JS positioning math where the platform provides it; a small signal-driven fallback (manual rect math in a `useSignalEffect`) only for browsers missing anchor positioning, feature-detected via `CSS.supports('anchor-name: --a')`.
- [ ] One component, one props object: `placement`, `offset`, `trigger` (`'click' | 'hover' | 'focus' | 'manual'`), `open`/`onOpenChange` (controlled), `modal` (focus trap). Enter/exit via `@starting-style` + `allow-discrete` (already the house style).
- [ ] Exit criterion: Dropdown, Tooltip, and (new) Menu render through Popover internals; date-picker/combobox migrate in 1.2. No component owns bespoke floating-position code afterwards.

### Milestone 1.2 — Migrations + floating family

- [ ] **Menu** — full menu primitive (the user-requested "menu"): items, sections, separators, checkbox/radio items, submenus, typeahead, roving focus. `MenuButton` variant (button+menu in one) and `ComboButton` (split primary action + menu) as variants, not separate components.
- [ ] **AlertDialog** — destructive-confirm modal variant: `variant: 'confirm'` on Modal or standalone; focus lands on the cancel action; `role="alertdialog"`.
- [ ] **Sheet** — side-sliding panel (`side: 'start' | 'end' | 'top' | 'bottom'`), top-layer, scrim, same motion tokens as Modal. Covers shadcn Sheet + Drawer in one component.
- [ ] **HoverCard** and **Toggletip** — thin Popover compositions (hover-preview card; click-tooltip with interactive content). Cheap once 1.1 lands.
- [ ] Migrate `dropdown`, `tooltip`, `date-picker`, `combobox` onto Popover internals (no public API change; visual snapshots must not move).

---

## Phase 2 — Catalog Depth (Carbon + shadcn parity, demand-weighted)

**Mechanism:** every component below is a `factory-backlog.json` spec; the dark factory grinds; humans review design + a11y. Order within a milestone = priority order.

### Milestone 2.1 — Inputs wave

- [ ] **PasswordInput** — Input variant with visibility toggle (`type: 'password'` + reveal button); strength-meter slot optional.
- [ ] **MultiSelect** — Select allowing multiple values, tag summary in the trigger, filterable; one props object (`selection: { mode: 'multi' }` discriminated union — consistent with DataTable).
- [ ] **TagsInput** — free-form multi-value chip input (emails, keywords); paste-splitting, validation hook. Neither Carbon nor shadcn core has this — differentiation.
- [ ] **OtpInput** — segmented one-time-code input; auto-advance, paste distribution, `autocomplete="one-time-code"`.
- [ ] **SegmentedControl** — mutually exclusive toggle group (Carbon ContentSwitcher ≙ shadcn ToggleGroup); single + multiple modes; animated thumb via `translate` only.
- [ ] **InputGroup / ButtonGroup** — prefix/suffix addons, attached buttons; logical-property borders so RTL works.
- [ ] **RatingGroup** — star/heart rating input. Low effort, high demo value.
- [ ] **Editable** — inline click-to-edit text for dashboards/admin tables.

### Milestone 2.2 — Display & structure wave

- [ ] **IconButton** — square icon-only button, mandatory `label` (becomes tooltip + aria-label); sizes aligned with Button.
- [ ] **CopyButton** — copy-to-clipboard with success feedback animation (CSS-only check-swap).
- [ ] **CodeSnippet** — inline / single-line / multi-line code display with CopyButton built in; `--cascivo-font-mono` token added if missing.
- [ ] **Notification** — inline/banner notification with actions and dismiss; richer than Alert (Alert stays for static callouts; Notification is the actionable one).
- [ ] **Collapsible** — minimal animated show/hide region (Disclosure); Accordion refactors to compose it internally if free.
- [ ] **Calendar** — standalone month-grid (extracted from date-picker's internals); range + multiple-month support; date-picker consumes it.
- [ ] **StructuredList** — lightweight read-only key/value & row list (lighter than DataTable; pairs with the Item primitive below).
- [ ] **Tile** — selectable card-like choice input (`selectable: 'single' | 'multi'`), the Carbon RadioTile/TileGroup family as one component.
- [ ] **TreeView** — hierarchical expandable tree (file explorers, nav); keyboard per WAI-ARIA tree pattern; lazy children via render prop.
- [ ] **ScrollArea** — styled scrollbars via `scrollbar-width`/`scrollbar-color` + `::-webkit-scrollbar` fallback; CSS-first, JS only for "scroll shadow" affordances (`animation-timeline: scroll()` where supported).
- [ ] **Typography** — `Heading`/`Text`/`Prose` primitives with auto heading-level context; unblocks docs prose and is a Carbon + shadcn shared gap.
- [ ] **ContextMenu** — right-click menu; thin wrapper over Menu + pointer-anchored Popover.
- [ ] **NavigationMenu** — horizontal nav with dropdown panels (landing/marketing). Lower priority; revisit demand at planning time.

### Milestone 2.3 — Utility components (the "proper error boundary" workstream)

- [ ] **ErrorBoundary** — a _real_ one, not a stub: class component internally (the only place React forces it; documented exception to the no-classes rule), `fallback` render prop receiving `{ error, reset }`, `onError` reporting hook, `resetKeys` for automatic recovery, optional default fallback UI built from EmptyState + Button ("Something went wrong — Try again"). Ships in `@cascade-ui/core` or `components` (decide: it has no styling of its own → lean `core`).
- [ ] **Suspense affordances** — `SuspenseBoundary` convenience wrapping `Suspense` with a Skeleton/Spinner default fallback and a minimum-display-time signal (no flash-of-spinner).
- [ ] **Portal** — declarative top-layer/portal helper used by Toast/Modal internally; exported because user code needs it for custom overlays.
- [ ] **VisuallyHidden** + **FocusScope** (focus trap/restore used by Modal/Sheet/Menu) — extracted, exported, documented.
- [ ] **`cascade doctor`** (CLI) — checks a consuming project: peer versions, theme import present, `data-theme` set, tokens loaded, lock-file drift. The error-boundary of the install experience.

---

## Phase 3 — AI-Native Components (the differentiators)

The user-requested set. These are first-party, signal-driven, and exist in neither Carbon nor shadcn. They live in `packages/components/` (copy-paste, owned code) with heavier internals allowed.

### Milestone 3.1 — Terminal

- [ ] **Terminal** — terminal-style output animation component: typed-out command/response sequences for landing pages, docs, and CLI product demos. Props: `lines: { prompt?, text, delayMs?, speed? }[]`, `loop`, `cursor` style. Implementation: CSS `steps()` typewriter where line lengths are static; signal-driven char streaming (`useSignalEffect` + DOM text-node patching, zero re-renders) for dynamic content. Respects `prefers-reduced-motion` (renders final state instantly).
- [ ] Used immediately on the cascade landing page hero (dogfood: replace static code block).

### Milestone 3.2 — AiChat

- [ ] **AiChat** — complete chat surface in one component: message list (user/assistant/tool roles), streaming assistant messages (token-by-token DOM patching via signals — the zero-re-render thesis applied to streaming text), markdown rendering (CodeSnippet for fences, CopyButton on blocks), typing indicator, stop/regenerate actions, auto-scroll with scroll-lock-on-user-scroll, attachment slot.
- [ ] Transport-agnostic: `messages` signal in, `onSend` out; an `streamAdapter` interface with a reference SSE/fetch implementation. No vendor SDK dependency in the component.
- [ ] Sub-pieces exported for custom layouts: `ChatMessage`, `ChatInput` (textarea + send + attachment, Enter/Shift-Enter), `ChatScrollAnchor`.
- [ ] **AiLabel** — small "AI-generated" indicator (Carbon has one; on-brand for cascade) — badge variant, cheap.
- [ ] New block: `block/ai-chat-page` (AppShell + AiChat + history side-nav) — the "build me a chatbot UI" one-liner.

### Milestone 3.3 — Streaming affordances

- [ ] **StreamingText** — standalone streamed-text primitive extracted from AiChat (fade-in token animation, reduced-motion safe) for non-chat streaming UIs.
- [ ] Renderer support: `<CascadeView>` can bind a streaming signal to AiChat/StreamingText (`bind: { messages: '$data.chat' }` with signal values) — verify, add test, document in schema notes.

---

## Phase 4 — Theme Modernization

**Rule unchanged:** themes override the semantic layer only. The work splits into (a) modernizing the foundation all themes share, (b) restyling the existing three, (c) two new themes.

### Milestone 4.1 — Token foundation refresh

- [ ] **oklch primitives**: regenerate the gray + color ramps in `packages/tokens` as oklch (perceptually uniform; enables `oklch(from …)` relative-color hover/active derivation later). Keep hex fallbacks only if the browser matrix demands (it doesn't — last-2 already supports oklch).
- [ ] **Semantic radius split**: `--cascivo-radius-control` (buttons/inputs), `--cascivo-radius-surface` (cards/modals), `--cascivo-radius-indicator` (badges/tags) — derived from one `--cascivo-radius-base` per theme (shadcn's `calc()` derivation pattern). Components migrate from raw `--cascivo-radius-md` to semantic radius tokens.
- [ ] **Focus ring tokens**: `--cascivo-ring-color` / `--cascivo-ring-width` / `--cascivo-ring-offset`; components standardize on one `:focus-visible` recipe (soft 3px @ 50% opacity default, per modern convention) instead of per-component outlines.
- [ ] **Shadow restraint**: re-cut the shadow scale — `xs` (0 1px 2px / 5%) default for controls/cards, `md+` reserved for floating surfaces. Audit components using `lg/xl` gratuitously.
- [ ] **Density tokens**: `--cascivo-control-height-{sm,md,lg}` + spacing so themes can shift density (minimal theme needs this).
- [ ] Contrast-check script (`scripts/quality/contrast-check.ts`) runs over every theme in CI — extend to the new tokens.

### Milestone 4.2 — Restyle light / dark / warm

- [ ] **light** → shadcn-class modern: near-achromatic neutrals (chroma ≤ 0.016), near-black primary accent option investigated (decision: keep blue accent or go neutral — pick with the human, it's brand), border + 1px shadow depth, 10px base radius, soft gray focus ring.
- [ ] **dark** → lifted background (oklch ~0.145, not near-black), surfaces one step lighter, **alpha-white borders** (`oklch(1 0 0 / 10%)`) — the signature modern dark-mode move.
- [ ] **warm** → same modernization with the warm hue cast preserved.
- [ ] Visual-regression baselines re-recorded once, deliberately, in a dedicated PR (the diff IS the restyle review).

### Milestone 4.3 — Two new themes: `flat` and `minimal`

- [ ] **flat** (`packages/themes/src/flat.css`): zero shadows everywhere (depth = border one step darker, oklch ~0.85 + surface contrast), 2–4px control radius, solid fills, hover/active = lightness steps (−0.06/−0.10 via `oklch(from var(--accent) calc(l - 0.06) c h)`), confident higher-chroma accent (~0.18), solid 2px focus outline with offset, overlays separated by border + scrim not elevation.
- [ ] **minimal** (`packages/themes/src/minimal.css`): monochrome (accent ≈ foreground, chroma < 0.02; one subdued link accent ~oklch(0.5 0.06 260)), hairline low-contrast borders (light 0.93–0.95; dark `oklch(1 0 0 / 8%)`), density up one notch (40–44px controls, generous card padding), single barely-there popover shadow only, hierarchy via type weight/size not boxes, thin 1.5px foreground-color focus ring @ 40%.
- [ ] Both pass the contrast gate (4.5:1 text, 3:1 graphics) — minimal's low-contrast borders are decoration, not information, document the distinction.
- [ ] Theme switcher in docs/storybook/playground gains both; `cascade:create-theme` skill learns the two new archetypes as starting points; llms.txt documents five first-party themes.

---

## Phase 5 — Integration & Gates

- [ ] Every Phase 1–3 component: manifest, registry, schema enum, componentMap, MCP, llms.txt, stories, docs demo, i18n strings (en+de) — same-PR drift gate (existing machinery; listed for completeness).
- [ ] Bundle budgets: AiChat and Terminal get their own line items (markdown rendering must stay lean — no full remark pipeline; a minimal md subset renderer, recorded decision).
- [ ] axe-core gate extends over all new docs routes; new components get a11y stories.
- [ ] Perf page gains an AiChat streaming benchmark (tokens/sec rendered with zero React commits vs a naive useState chat — the killer argument, applied to AI UIs).
- [ ] v3 Definition of Done checklist mirrors this doc; final tranche verifies line by line.

---

## Sequencing & Tranche Sketch

| Tranche | Content                                                          | Depends on                                       |
| ------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| T1      | Popover primitive + Menu + AlertDialog + Sheet + migrations      | —                                                |
| T2      | Inputs wave (2.1) via dark factory                               | T1 (MultiSelect floats on Popover)               |
| T3      | Display/structure wave (2.2) + utilities (2.3)                   | T1 (ContextMenu, Toggletip)                      |
| T4      | Token foundation refresh (4.1) + restyle existing themes (4.2)   | — (parallel to T2/T3)                            |
| T5      | `flat` + `minimal` themes (4.3)                                  | T4                                               |
| T6      | Terminal + AiChat + StreamingText + ai-chat-page block (Phase 3) | T1 (Menu in chat actions), benefits from T4 look |
| T7      | Integration sweep, perf benchmark, DoD verification (Phase 5)    | all                                              |

Open questions for the human before T1 planning:

1. Light theme accent: keep cascade blue or follow the near-neutral-primary trend? (Brand decision.)
2. AiChat markdown scope: minimal subset (bold/italic/code/fences/links/lists) vs full CommonMark — proposal is subset, confirm.
3. ErrorBoundary home: `@cascade-ui/core` (proposal) or copy-paste component?
4. Component-count target: the full Phase 2 list is ~25 components → catalog lands at ~70. Trim 2.2's tail (NavigationMenu, TreeView) if velocity demands?
