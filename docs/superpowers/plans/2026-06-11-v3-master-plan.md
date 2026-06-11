# cascade v3 — Master Plan (Roadmap v3 execution sequencing)

> **For agentic workers:** This is a sequencing document, not an executable task plan. Execute the
> per-tranche plans listed below — all seven exist. Each opens with a "Current-state assumptions —
> RE-VERIFY" check; run those first and adapt the plan where reality has drifted.
> Source spec: `docs/ROADMAP-V3.md`.

**Goal:** Implement Roadmap v3 — from application platform to the design system you *prefer* — in
seven sequential tranches. Three workstreams: (1) catalog depth via a shared Popover primitive and
~25 new components; (2) AI-native components that Carbon and shadcn don't have; (3) theme
modernization to oklch perceptual color with two new first-party themes.

**Architecture:** The Popover primitive (T1) is the structural prerequisite — every floating
surface in T1, T2, and T3 builds on it. The dark factory grinds T2 and T3 components through
`factory-backlog.json`. AI components ship as a new published package `@cascade-ui/ai` (not
copy-paste). Token modernization (T4) runs parallel to T2/T3; theme addition (T5) gates on T4.
All generated artifacts (registry, READMEs, schema, MCP data, llms.txt, per-component markdown)
travel in the same PR as their source change — the existing drift gate enforces this.

**Tech stack:** pnpm workspaces + vite+ (`vp`), TypeScript strict, React 18+ with
`@preact/signals-react`, CSS Modules + `@layer cascade.*`, CSS Anchor Positioning + Popover API
(zero JS positioning), oklch color space throughout, Vitest + Testing Library + Playwright.

---

## Decisions locked in (2026-06-11, with Adam)

1. **CSS Anchor Positioning + Popover API** for all floating UI — zero JS positioning math; no
   `floating-ui`/`popper` dependency ever. A `useSignalEffect`-based rect fallback handles browsers
   without anchor positioning, feature-detected via `CSS.supports('anchor-name: --a')`.
2. **oklch perceptually-uniform color space** for ALL new token values; the three existing themes
   are restated in oklch in T4. Hex fallbacks are not needed — last-2 browser matrix already
   supports oklch.
3. **Dark factory handles T2 (Inputs wave) and T3 (Display/structure)** — copy-paste model
   preserved; factory queues in `factory-backlog.json`, humans review design + a11y.
4. **Two new themes** ship as separate CSS files: `packages/themes/src/flat.css` and
   `packages/themes/src/minimal.css`. All four themes co-exist; `cascade:create-theme` skill gains
   both as archetypes.
5. **AI components published in `@cascade-ui/ai`** — a new npm package, not copy-paste registry
   items. Depends on `@cascade-ui/core`, `@cascade-ui/i18n`, `@cascade-ui/tokens`.
   peerDependencies: `react >=18`, `@preact/signals-react >=2`.
6. **ErrorBoundary is a React class component** — the one legitimate exception to the hooks/signals
   ban; documented as such in CLAUDE.md. VisuallyHidden and FocusScope are pure CSS/HTML with
   signal-driven behavior only.
7. **Component count target: ~65 after T3** (up from 41 post-v2; ~95 total registry entries
   counting charts, layouts, blocks).

---

## Roadmap corrections (repo reality vs. ROADMAP-V3 "Current State")

The roadmap was written against a pre-v2-completion snapshot. Verified state on `main`
(2026-06-11):

- **registry.json has 77 entries** — 41 components + 16 charts + 11 layouts + 9 blocks. The
  roadmap table shows this correctly.
- **All v2 packages exist and are published:** `core`, `tokens`, `themes`, `icons`, `i18n`,
  `storage`, `charts`, `render`, `cli`, `mcp`, `components`, `react`. `packages/layouts` was
  implemented as copy-paste registry items (no separate npm package), matching T3 decisions.
- **apps/docs has /ai page;** `llms.txt` and per-component markdown exist; four Claude Code skills
  exist in `skills/`.
- **Token layer:** `--cascade-motion-*` semantic tokens exist. `--cascade-radius-*` tokens exist
  but are ad-hoc per-component, not semantic-split. **oklch is NOT yet adopted** — all primitive
  tokens are hex or hsl. No semantic radius/shadow/focus split tokens.
- **No Popover API usage anywhere** — Modal uses `showModal()` imperative call; Dropdown, Tooltip
  each own bespoke floating position JS.
- **No CSS Anchor Positioning anywhere** in the codebase.
- **`flat.css` and `minimal.css` do not exist** in `packages/themes/`.
- **`packages/ai` does not exist.**
- **ContextMenu and HoverCard do not exist.** Sheet/Drawer does not exist. AlertDialog does not
  exist as a standalone component.

---

## Edge-case register (feeds tranche plans)

| #   | Edge case                                                                                                              | Resolution                                                                                                                                                                                                   | Tranche |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| 1   | CSS Anchor Positioning browser support (~94% as of 2026-06; Safari 18.4+)                                              | Feature-detect via `CSS.supports('anchor-name: --a')`; signal-driven rect fallback in `usePopover` for older browsers. The fallback path is a thin shim, not a full floating-ui port.                        | 1       |
| 2   | `popover="auto"` light-dismiss conflicts with nested popovers (Menu inside Sheet)                                      | Outer uses `popover="manual"` (Sheet); inner Menu uses `popover="auto"`. The Popover API nesting rules handle stacking correctly; document in Sheet's story.                                                  | 1       |
| 3   | Modal currently uses `showModal()` for true modal semantics; Popover API `popover` alone doesn't trap focus            | Keep `showModal()` for Modal; Popover API handles top-layer stacking for non-modal surfaces. AlertDialog uses `popover="manual"` + FocusScope (T3 utility) for trapping.                                      | 1, 3    |
| 4   | oklch conversion: existing hex tokens differ from naively converted oklch at identical L/C/H due to gamut clipping     | Use the CSS Color 4 `oklch()` function directly; verify each converted value visually in Storybook snapshot before committing. Run contrast-check gate on every theme after conversion.                       | 4       |
| 5   | Semantic radius split (`--cascade-radius-control/surface/indicator`) requires updating every component CSS file        | Automated sed pass in T4 (script-assisted migration); visual regression baseline re-recorded deliberately in a dedicated PR.                                                                                  | 4       |
| 6   | `flat.css` zero-border-radius conflicts with focus-ring visibility on some components                                  | `flat.css` uses a solid 2px outline `focus-visible` style (not box-shadow ring) — inherently visible without radius. Document in theme authoring guide.                                                      | 5       |
| 7   | `minimal.css` near-invisible borders — WCAG distinction: decoration vs. information                                    | Borders that convey state (error, focus) remain high-contrast; decorative divider borders are the "invisible" ones. Contrast-check script distinguishes by token name (`--cascade-border-subtle` is exempt). | 5       |
| 8   | `@cascade-ui/ai` streaming animation uses `requestAnimationFrame` — must clean up in `useSignalEffect` return          | `useSignalEffect` cleanup pattern is the standard cascade idiom; explicitly shown in T6 StreamingText implementation.                                                                                         | 6       |
| 9   | AiChat markdown rendering: full remark vs. minimal subset                                                              | Minimal subset only (bold/italic/code/fences/links/lists) — no full remark pipeline. Recorded decision; bundle budget gate enforces it (< 20 KB gzip for `@cascade-ui/ai`).                                  | 6       |
| 10  | ErrorBoundary home: `@cascade-ui/core` vs. copy-paste component                                                       | Ships in `@cascade-ui/core` (no styling of its own; not a registry copy-paste item). Exported from `@cascade-ui/react` for convenience.                                                                      | 3       |
| 11  | T2 MultiSelect floats on Popover — must wait for T1                                                                    | Factory backlog queue for T2 items added at T2 start; factory does not run T2 until T1 is merged and on `main`.                                                                                               | 2       |
| 12  | ContextMenu CSS anchor at pointer position — anchor positioning spec doesn't support pointer coords natively           | `--cascade-context-x` / `--cascade-context-y` CSS custom properties set via `onContextMenu` handler (single DOM write per right-click); CSS reads them via `left: var(--cascade-context-x)`.                 | 1       |
| 13  | Dark factory integrate step must add to `@cascade-ui/react` exports — not currently enforced                           | Verify factory skill SKILL.md already has the export step (added in v2 T1 Task 2); if missing, re-add before queuing T2 items.                                                                               | 2       |
| 14  | Visual regression baselines become stale after T4 oklch restyle                                                        | T4 includes a dedicated "re-record baselines" task — the diff IS the restyle review. T5, T6, T7 use the T4 baselines as the new reference.                                                                   | 4       |

---

## Tranches

| #   | Tranche                                                                                                                                                                                           | Roadmap items                                           | Size | Plan                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---- | --------------------------------- |
| 1   | **Popover primitive + floating family** — `usePopover` hook, Popover component, Menu, AlertDialog, Sheet, ContextMenu, HoverCard; migrate Dropdown + Tooltip onto Popover internals               | Phase 1 (1.1 + 1.2)                                     | L    | `2026-06-11-v3-tranche-1.md`      |
| 2   | **Inputs wave — dark factory** — PasswordInput, MultiSelect, TagsInput, OtpInput, SegmentedControl, InputGroup, RatingGroup, Editable; all via factory pipeline                                  | Phase 2 Milestone 2.1                                   | M    | `2026-06-11-v3-tranche-2.md`      |
| 3   | **Display/structure + utilities** — 12 display/nav components via factory + 5 utility components hand-built (ErrorBoundary, SuspenseBoundary, Portal, VisuallyHidden, FocusScope) + cascade doctor CLI | Phase 2 Milestones 2.2 + 2.3                        | L    | `2026-06-11-v3-tranche-3.md`      |
| 4   | **Token foundation refresh** — oklch primitive tokens, semantic radius/shadow/focus split, restyle light/dark/warm themes, chart tokens, visual regression re-baseline                            | Phase 4 Milestones 4.1 + 4.2                            | M    | `2026-06-11-v3-tranche-4.md`      |
| 5   | **flat + minimal new themes** — `flat.css` and `minimal.css`, docs/Storybook theme switcher gains both, landing page update                                                                       | Phase 4 Milestone 4.3                                   | S    | `2026-06-11-v3-tranche-5.md`      |
| 6   | **Terminal + AiChat + StreamingText** — new `@cascade-ui/ai` package with StreamingText, AiLabel, Terminal (TerminalBlock), AiChat; ai-chat-page block; docs /ai page update                     | Phase 3 Milestones 3.1 + 3.2 + 3.3                     | L    | `2026-06-11-v3-tranche-6.md`      |
| 7   | **Integration sweep + DoD verification** — CLAUDE.md compliance audit, axe-core CI gate, bundle budgets, visual regression update, latency benchmarks, cascade doctor CI, registry drift gate, llms.txt regen | Phase 5                                        | M    | `2026-06-11-v3-tranche-7.md`      |

Dependency notes: T1 is the prerequisite for T2 (MultiSelect floats on Popover) and T3
(ContextMenu, HoverCard). T4 can run parallel to T2/T3 — it touches tokens and themes, not
component logic. T5 gates on T4 (new themes need the oklch foundation). T6 benefits from T4's
restyle but does not require it; T6 can start once T1 is merged (Menu in chat actions). T7 gates
on all prior tranches.

---

## Exit criteria per tranche

- **T1:** `CSS.supports('anchor-name: --a')` fallback tested; Dropdown, Tooltip, Menu, AlertDialog,
  Sheet, ContextMenu, HoverCard all pass axe-core; no component owns bespoke floating-position JS
  after migrations; visual snapshots of Dropdown and Tooltip are pixel-identical before/after migration.
- **T2:** All 8 input components at `review`/`done` in factory backlog; exported from
  `@cascade-ui/react`; MultiSelect's Popover integration confirmed working (Playwright smoke test).
- **T3:** `npx cascade add display/calendar` works; `cascade doctor` exits 0 on the monorepo;
  ErrorBoundary catches a thrown render error in a Vitest test; all 17 new components exported from
  `@cascade-ui/react`.
- **T4:** Contrast-check gate green for all three restyled themes; visual regression baselines
  re-recorded; no hardcoded hex in any component CSS file; Playwright visual diff reviewed and
  approved by human.
- **T5:** `data-theme="flat"` and `data-theme="minimal"` produce correct visuals in Storybook;
  both pass contrast gate; docs theme switcher has 4 options; `cascade:create-theme` skill accepts
  `flat`/`minimal` as archetypes.
- **T6:** `@cascade-ui/ai` builds and publishes; AiChat streaming benchmark shows 60fps with zero
  React commits per streamed token (Playwright); Terminal renders on cascade landing page hero;
  all 4 AI components have Storybook stories and docs demos.
- **T7:** All DoD gates from ROADMAP-V3 Phase 5 enforced in CI; bundle budgets green
  (`@cascade-ui/react` < 50 KB gzip, `@cascade-ui/ai` < 20 KB gzip, `@cascade-ui/charts` < 80 KB
  gzip); registry has ≥ 95 entries; every component in registry has a story and a docs demo.
