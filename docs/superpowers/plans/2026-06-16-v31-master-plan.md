# v31 — DaisyUI Gap Sprint — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close cascivo's component vocabulary and token convention gaps identified by a full DaisyUI audit. Ship 12 new components and a systematic `-content` token layer across all ten themes.

Target metrics (measured after T6):

| Metric                                        | Target            |
| --------------------------------------------- | ----------------- |
| New components shipped                        | 12                |
| Status color `-content` coverage              | 7 / 7 color roles |
| Themes updated with new tokens                | 10 / 10           |
| `parity.test.ts`                              | passes            |
| New components without `useState`/`useEffect` | 12 / 12           |
| New manifests with complete `intent` block    | 12 / 12           |
| `registry.json` entries (new)                 | 12                |

**Architecture:** T1 touches `packages/themes/src/` (all 10 theme files) and three existing components. T2–T5 each add three new component directories to `packages/components/src/`, export them from `packages/react/src/index.ts`, and register them in `packages/components/src/_all-metas.ts`. T6 runs the full CI gate.

**Tech Stack:** No new npm packages. All new components use `useSignal` / `useSignalEffect` / `useSignals` from `@cascivo/core`. CSS Modules throughout. `conic-gradient` for Radial Progress (progressive enhancement).

---

## Tranche Overview

| Tranche | Title                 | Goal                                                                                                |
| ------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| T1      | Token Architecture    | -content pairs for all status colors; secondary role; update Alert/Badge/Button; parity gate        |
| T2      | Form Utilities        | Progress, Kbd, Filter — three new components from form/feedback/input categories                    |
| T3      | Navigation Components | Steps, Pagination, Dock — three new navigation components                                           |
| T4      | Layout Primitives     | Join, Indicator, Stack — three CSS-first layout utilities                                           |
| T5      | Interaction Patterns  | Swap, Chat Bubble, Radial Progress — three signal-driven/display components                         |
| T6      | Gate                  | Full CI gate: registry audit, manifest completeness, format+lint+build+type+tests+drift+breakpoints |

---

## Files Created / Modified per Tranche

### T1 — Token Architecture

| Action | Path                                               |
| ------ | -------------------------------------------------- |
| Modify | `packages/themes/src/light.css`                    |
| Modify | `packages/themes/src/dark.css`                     |
| Modify | `packages/themes/src/warm.css`                     |
| Modify | `packages/themes/src/minimal.css`                  |
| Modify | `packages/themes/src/midnight.css`                 |
| Modify | `packages/themes/src/corporate.css`                |
| Modify | `packages/themes/src/brutalist.css`                |
| Modify | `packages/themes/src/flat.css`                     |
| Modify | `packages/themes/src/pastel.css`                   |
| Modify | `packages/themes/src/terminal.css`                 |
| Modify | `packages/components/src/alert/alert.module.css`   |
| Modify | `packages/components/src/badge/badge.module.css`   |
| Modify | `packages/components/src/button/button.module.css` |
| Modify | `packages/components/src/button/button.tsx`        |

### T2 — Form Utilities

| Action | Path                                                   |
| ------ | ------------------------------------------------------ |
| Create | `packages/components/src/progress/progress.tsx`        |
| Create | `packages/components/src/progress/progress.module.css` |
| Create | `packages/components/src/progress/progress.meta.ts`    |
| Create | `packages/components/src/progress/progress.test.tsx`   |
| Create | `packages/components/src/kbd/kbd.tsx`                  |
| Create | `packages/components/src/kbd/kbd.module.css`           |
| Create | `packages/components/src/kbd/kbd.meta.ts`              |
| Create | `packages/components/src/kbd/kbd.test.tsx`             |
| Create | `packages/components/src/filter/filter.tsx`            |
| Create | `packages/components/src/filter/filter.module.css`     |
| Create | `packages/components/src/filter/filter.meta.ts`        |
| Create | `packages/components/src/filter/filter.test.tsx`       |
| Modify | `packages/components/src/_all-metas.ts`                |
| Modify | `packages/react/src/index.ts`                          |

### T3 — Navigation Components

| Action | Path                                                       |
| ------ | ---------------------------------------------------------- |
| Create | `packages/components/src/steps/steps.tsx`                  |
| Create | `packages/components/src/steps/steps.module.css`           |
| Create | `packages/components/src/steps/steps.meta.ts`              |
| Create | `packages/components/src/steps/steps.test.tsx`             |
| Create | `packages/components/src/pagination/pagination.tsx`        |
| Create | `packages/components/src/pagination/pagination.module.css` |
| Create | `packages/components/src/pagination/pagination.meta.ts`    |
| Create | `packages/components/src/pagination/pagination.test.tsx`   |
| Create | `packages/components/src/dock/dock.tsx`                    |
| Create | `packages/components/src/dock/dock.module.css`             |
| Create | `packages/components/src/dock/dock.meta.ts`                |
| Create | `packages/components/src/dock/dock.test.tsx`               |
| Modify | `packages/components/src/_all-metas.ts`                    |
| Modify | `packages/react/src/index.ts`                              |

### T4 — Layout Primitives

| Action | Path                                                     |
| ------ | -------------------------------------------------------- |
| Create | `packages/components/src/join/join.tsx`                  |
| Create | `packages/components/src/join/join.module.css`           |
| Create | `packages/components/src/join/join.meta.ts`              |
| Create | `packages/components/src/join/join.test.tsx`             |
| Create | `packages/components/src/indicator/indicator.tsx`        |
| Create | `packages/components/src/indicator/indicator.module.css` |
| Create | `packages/components/src/indicator/indicator.meta.ts`    |
| Create | `packages/components/src/indicator/indicator.test.tsx`   |
| Create | `packages/components/src/stack/stack.tsx`                |
| Create | `packages/components/src/stack/stack.module.css`         |
| Create | `packages/components/src/stack/stack.meta.ts`            |
| Create | `packages/components/src/stack/stack.test.tsx`           |
| Modify | `packages/components/src/_all-metas.ts`                  |
| Modify | `packages/react/src/index.ts`                            |

### T5 — Interaction Patterns

| Action | Path                                                                 |
| ------ | -------------------------------------------------------------------- |
| Create | `packages/components/src/swap/swap.tsx`                              |
| Create | `packages/components/src/swap/swap.module.css`                       |
| Create | `packages/components/src/swap/swap.meta.ts`                          |
| Create | `packages/components/src/swap/swap.test.tsx`                         |
| Create | `packages/components/src/chat-bubble/chat-bubble.tsx`                |
| Create | `packages/components/src/chat-bubble/chat-bubble.module.css`         |
| Create | `packages/components/src/chat-bubble/chat-bubble.meta.ts`            |
| Create | `packages/components/src/chat-bubble/chat-bubble.test.tsx`           |
| Create | `packages/components/src/radial-progress/radial-progress.tsx`        |
| Create | `packages/components/src/radial-progress/radial-progress.module.css` |
| Create | `packages/components/src/radial-progress/radial-progress.meta.ts`    |
| Create | `packages/components/src/radial-progress/radial-progress.test.tsx`   |
| Modify | `packages/components/src/_all-metas.ts`                              |
| Modify | `packages/react/src/index.ts`                                        |

### T6 — Gate

| Action | Path                                                            |
| ------ | --------------------------------------------------------------- |
| Verify | `registry.json` (regenerated via `pnpm regen`, no manual edits) |

---

## Key Decisions

### -content token placement — themes, not tokens package

The `-content` tokens encode a relationship between a background color and its legible foreground. That relationship is theme-specific (a `warning` color on a dark theme may need white content; on a light theme it may need dark). Therefore the tokens live in `packages/themes/src/*.css`, not in `packages/tokens/src/index.css`.

Pattern per theme:

```css
/* in every theme — new additions */
--cascivo-color-primary-content: var(--cascivo-color-primary-fg); /* alias existing */
--cascivo-color-accent-content: var(--cascivo-color-text-on-accent); /* alias existing */
--cascivo-color-destructive-content: var(--cascivo-color-text-on-destructive); /* alias existing */
--cascivo-color-info-content: oklch(1 0 0); /* white on info blue */
--cascivo-color-success-content: oklch(1 0 0); /* white on success green */
--cascivo-color-warning-content: oklch(0.145 0 0); /* dark on warning yellow/orange */
--cascivo-color-error-content: oklch(1 0 0); /* white on error red */
```

The three aliased tokens keep the existing values. The four new tokens must be reviewed per-theme — `warning` is light in every current theme, but `pastel` and `terminal` themes may require adjustment.

### Parity gate strategy

`packages/themes/src/parity.test.ts` asserts that every theme file defines the same set of custom property names. Every new token added in T1 must be added to all 10 theme files. The implementation order is: update `light.css` first (it is the reference theme), then copy the token block to all nine others and adjust values per theme as needed.

### secondary color role design

`secondary` is intentionally muted — it sits between `primary` (bold/black) and `accent` (brand hue). Reference values for the light theme:

```css
--cascivo-color-secondary: oklch(0.92 0.004 264); /* very light gray-violet */
--cascivo-color-secondary-content: oklch(0.27 0.01 264); /* dark text on it */
--cascivo-color-secondary-hover: oklch(0.86 0.006 264);
--cascivo-color-secondary-subtle: oklch(0.967 0.002 264);
```

`Button variant="secondary"` becomes the correct answer for "less prominent than primary, more substance than ghost."

### Progress vs Spinner

`Spinner` is for indeterminate, unbounded waits (a page loading, an async operation of unknown length). `Progress` is for:

1. Tracked progress with a known total (`value={65}` = 65% done)
2. Indeterminate progress on a bounded operation where UX convention calls for a bar over a spinner (file upload queued, multi-step import)

They coexist. The `Progress` indeterminate mode uses `animation: indeterminate-slide` on the `<progress>` pseudo-element — the native `<progress>` indeterminate state triggers this automatically when no `value` attribute is set.

### Join implementation — CSS selectors only

`Join` applies border-radius overrides using:

```css
.join > :first-child:not(:last-child) {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}
.join > :last-child:not(:first-child) {
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}
.join > :not(:first-child):not(:last-child) {
  border-radius: 0;
}
```

CSS logical properties (`border-start-end-radius`) handle RTL correctly. No `children` inspection, no React.cloneElement, no forwardRef juggling.

### Radial Progress — inline style for conic-gradient

`conic-gradient` cannot read CSS custom properties set on an ancestor. The value must be on the same element. The component sets `style={{ '--cascivo-radial-progress': value }}` on the wrapper and the CSS reads:

```css
.radialProgress {
  background: conic-gradient(
    var(--cascivo-color-accent) calc(var(--cascivo-radial-progress, 0) * 1%),
    var(--cascivo-color-surface-2) 0
  );
}
```

This is the only deliberate `style` prop in cascivo components. It is acceptable because `conic-gradient` has no alternative that avoids inline style.

### Swap — signal, not DOM input

DaisyUI's Swap uses a hidden `<input type="checkbox">` for CSS-only state. cascivo replaces this with a `checked` prop that drives `data-checked` on the wrapper:

```tsx
const isChecked = useSignal(checked)
isChecked.value = checked  // sync controlled prop

return <div className={cls.swap} data-checked={isChecked.value || undefined} ...>
```

CSS targets `[data-checked]` to show the `on` child and hide the `off` child (or vice versa). No checkbox, no label-for wiring, no CSS `:checked` selector.

---

## Cross-Tranche Rules

1. No `useState`, `useEffect`, `useContext`, `useReducer`, or `useLayoutEffect` imported in any new or modified component.
2. `pnpm exec vp run @cascivo/components#test` must pass after T2, T3, T4, T5.
3. `pnpm exec vp check` must pass after T1.
4. `pnpm breakpoint:check` must exit 0 at T6.
5. `pnpm test` must pass across the monorepo at T6.
6. All T1 token additions go to all 10 theme files — no partial additions.
7. Every new component's `component.meta.ts` must include a non-empty `intent.whenToUse` and `intent.whenNotToUse`.
