# v11 Overlay Platform-Migration Audit

_Date: 2026-06-12_

## Audit Summary

| Component    | Positioning                                | Popover attr     | Decision                                                                                 |
| ------------ | ------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------- |
| tooltip      | Absolute CSS (no JS)                       | No               | Migrate to `popover="manual"` + anchor CSS                                               |
| popover      | Fixed + CSS anchor + JS fallback           | **Yes** (`auto`) | Add `@starting-style` transitions only                                                   |
| dropdown     | Absolute CSS + JS outside-click/Escape     | No               | Migrate to `popover="auto"` (eliminates JS dismiss)                                      |
| hover-card   | Fixed + CSS anchor + JS fallback           | **Yes** (`auto`) | Add `@starting-style` transitions only                                                   |
| menu         | Fixed + CSS anchor + JS fallback           | **Yes** (`auto`) | Add `@starting-style` transitions only                                                   |
| context-menu | Fixed + JS coordinate via CSS custom props | **Yes** (`auto`) | Add `@starting-style` transitions only (anchor positioning not applicable: point anchor) |
| command-menu | `<dialog>` (modal)                         | No (dialog API)  | Add `@starting-style` transitions only; no structural change                             |
| toast        | Fixed CSS corner                           | No               | Evaluate popover="manual"; keep if a11y intact                                           |
| modal        | `<dialog>`                                 | No               | Add `@starting-style` transitions only                                                   |
| sheet        | `<dialog>`                                 | No               | Add `@starting-style` transitions only                                                   |
| alert-dialog | `<dialog>`                                 | No               | Add `@starting-style` transitions only                                                   |

## Per-Component Details

### tooltip

- Positioning: `position: absolute` relative to inline `<span>` root; `data-placement` drives inset + translate CSS
- JS involvement: **zero** — pure CSS
- Z-index: `var(--cascivo-z-tooltip)`
- Dismiss: mouse-leave / blur (signal FSM: `HIDE`)
- Focus: no trap; implicit blur return
- Tests: 5 tests (hover show/hide with delay)
- **Migration**: render floating content as `popover="manual"`; trigger gets `anchor-name: --tooltip-<id>`; floating gets CSS anchor positioning under `@supports`; existing absolute CSS is the fallback

### popover

- Positioning: `position: fixed; inset: auto` + CSS anchor positioning (preferred); JS `getBoundingClientRect` fallback in `use-popover.ts` lines 71–92
- Already on `popover="auto"` — light-dismiss + Escape handled natively
- JS positioning fallback: ~20 lines
- Tests: 11 tests
- **Migration**: add `@starting-style` + `transition-behavior: allow-discrete` entry/exit motion; no structural change

### dropdown

- Positioning: `position: absolute` relative to inline-flex root; `data-placement` drives inset
- JS involvement: `pointerdown` listener on document (lines 94–101) for outside-click dismiss; Escape handler (lines 136–139) returning focus to trigger
- Z-index: `var(--cascivo-z-dropdown)`
- **Migration**: replace with `popover="auto"` → native light-dismiss + Escape eliminates the JS pointer listener; keep Escape focus-return since popover API doesn't guarantee it; add anchor CSS under `@supports`

### hover-card

- Already on `popover="auto"` with CSS anchor + JS fallback (shared `usePopover`)
- Hover delay + mouse-over card preserve interaction
- Tests: 3 tests
- **Migration**: add `@starting-style` transitions

### menu

- Already on `popover="auto"` with CSS anchor + JS fallback (shared `usePopover`)
- Arrow key navigation; focuses first item on open
- Tests: 6 tests
- **Migration**: add `@starting-style` transitions; verify keyboard canary still green

### context-menu

- On `popover="auto"` with JS coordinate injection via CSS custom properties (`--cascivo-context-x/y`)
- CSS anchor positioning does not apply (anchoring to a point, not an element)
- Tests: 3 tests
- **Migration**: add `@starting-style` transitions; keep JS coordinate approach (correct for point anchoring)

### command-menu

- `<dialog>` element; CSS centering (`margin-block-start: 15vh; margin-inline: auto`)
- Full focus trap (native dialog), open: focus input, Escape closes
- Tests: 14 tests
- **Migration**: add `@starting-style` entry/exit to modal overlay; no structural change

### toast

- `position: fixed` corner; `z-index: var(--cascivo-z-toast)`
- `aria-live` + `role` semantics (alert/status)
- **Evaluation result**: keep `position: fixed` — `popover="manual"` would shift toast to top layer and requires explicit `showPopover/hidePopover` calls already done via signals; however a11y semantics (`aria-live`) must be verified inside top-layer. Decision: **skip toast popover migration** — the existing top-layer workaround is unnecessary given aria-live works in any DOM position; the z-index approach is simpler and proven. Record reason: risk of aria-live announcement order inside popover top layer with screen reader is unknown; complexity is not justified by the benefit.

### modal / sheet / alert-dialog

- All use `<dialog>` with `showModal()`/`close()` via `useSignalEffect`
- **Migration**: add `@starting-style` `@keyframes`-free transitions only

## JS Lines Removed by Migration

| Component | Lines removed                                         | Reason                                |
| --------- | ----------------------------------------------------- | ------------------------------------- |
| dropdown  | ~8 lines (pointerdown listener + Escape handler body) | `popover="auto"` native light-dismiss |
| tooltip   | ~0                                                    | No JS positioning was used            |

## Claim Receipt

After migration: "near-zero overlay JS" means:

- Tooltip: 0 JS for positioning
- Dropdown: 0 JS for dismiss (was ~8 lines)
- All popover-API components: JS only for open/close state sync, not positioning geometry

## Browser Compatibility

- Popover API: Baseline 2025-01 (all engines)
- CSS Anchor Positioning: Chromium only (not Baseline); guarded by `@supports (anchor-name: --a)`
- `@starting-style`: Baseline 2024 (all engines)
- `transition-behavior: allow-discrete`: Baseline 2024 (all engines)
