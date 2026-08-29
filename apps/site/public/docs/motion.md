<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/motion.md
  registry v1.0.0 · generated 2026-08-29
-->

# Motion (`@cascivo/tokens/motion.css`)

cascivo's motion layer is a **closed set**: thirteen shared keyframes, a fixed duration
scale, six easings, and five semantic pairs. A component picks from it. It does not
author its own.

That is a change from how the catalogue grew. Before the shared layer existed, motion was
written per component, and the result was three separate shimmers (`cascade-shimmer`,
`cascade-image-shimmer`, and a bare `shimmer`), two indeterminate sweeps under different
names, and three naming conventions across fifteen files. Same animations, different
implementations, and — because two of the three shimmers slid `background-position` while
the third translated a pseudo-element — different **performance** for the same visual
effect.

Everything here is enforced. `pnpm motion:check` runs the audit plus the parity sweep;
`pnpm reduced-motion:check` runs the accessibility half.

---

## 1. The one rule that fails silently

**A `.module.css` referencing a keyframe it does not itself define must wrap the name in
`global()`.**

```css
/* BROKEN — compiles, ships, never runs */
.spinner {
  animation: cascivo-spin 1s linear infinite;
}

/* correct */
.spinner {
  animation: global(cascivo-spin) 1s linear infinite;
}
```

CSS Modules localises `animation-name` by default, so the first form is rewritten to
`_cascivo-spin_8in1i_1`, which resolves to nothing. There is **no diagnostic** — not from
the bundler, not from CSS, not from the browser. An unresolved `animation-name` is legal;
the element simply never animates.

Plain (non-module) stylesheets — themes, platform — reference the name directly, with no
`global()`.

`audit:animation` fails the build on a bare cross-file reference, and on a `global()` name
that is not in the catalogue.

---

## 2. Reduced motion

The strategy is **central, not per component**: `packages/tokens/src/index.css` collapses
every `--cascivo-duration-*` token to `0.01ms` under
`@media (prefers-reduced-motion: reduce)`. Anything timed off a token is therefore disabled
library-wide by one rule, and needs no guard of its own.

The hole that leaves is literal durations, and it is the reason this section exists: `1.4s`
reads no token, so it silently opts out. Four infinite animations once ran regardless of
the user's setting because of exactly that.

Three paths, by what the motion is for:

| Kind                                                      | Timing                     | Reduced motion                                                            |
| --------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| One-shot (transitions, finite animations)                 | `--cascivo-duration-*`     | Collapses globally. Nothing to write.                                     |
| **Decorative loop** — pulse, ping, blink, shimmer, wiggle | `--cascivo-duration-loop*` | Wrap the declaration in `@media (prefers-reduced-motion: no-preference)`. |
| **Indicator loop** — spinner, indeterminate bar           | `--cascivo-duration-loop*` | Keep running; **slow** it with an explicit `reduce` guard.                |

Decorative loops use the `no-preference` form because it makes motion **opt-in**: a user who
expresses no preference, or whose browser predates the feature, gets no animation. It is
strictly stronger than a `reduce` guard, and it needs no second rule.

```css
/* Decorative loop — opt-in, so a user who expresses no preference gets no motion. */
@media (prefers-reduced-motion: no-preference) {
  .dot {
    animation: global(cascivo-pulse) var(--cascivo-duration-loop) var(--cascivo-ease-in-out)
      infinite;
  }
}
```

Indicator loops are the deliberate exception: a frozen progress indicator reads as a hung
app, so WCAG 2.2 prefers it slowed. Spinner, ProgressBar and Progress each slow to 1.5–4s.

**Why loop durations are excluded from the global collapse.** Zeroing a loop does not stop
it — it spins it infinitely fast. A loop is silenced by not running, which is a different
mechanism. `--cascivo-duration-loop-fast` (1s), `--cascivo-duration-loop` (1.4s) and
`--cascivo-duration-loop-slow` (2s) are therefore deliberately absent from the
`prefers-reduced-motion` block, and `reduced-motion:check` proves every one of their call
sites took one of the two paths above instead.

---

## 3. Compositor safety

Animate `transform` / `translate` / `rotate` / `scale`, `opacity`, and `filter`. Those are
composited: they skip layout and paint entirely.

**`background-position` is not among them**, despite often being listed as safe — it
repaints the element every frame. That is why the canonical shimmer translates an overlay
rather than sliding a gradient:

```css
.placeholder {
  position: relative;
  overflow: hidden;
}
.placeholder::after {
  content: '';
  position: absolute;
  inset: 0;
  translate: -100% 0;
  background-image: linear-gradient(
    90deg,
    transparent,
    var(--cascivo-color-bg-subtle),
    transparent
  );
}
@media (prefers-reduced-motion: no-preference) {
  .placeholder::after {
    animation: global(cascivo-shimmer) var(--cascivo-duration-loop) linear infinite;
  }
}
```

Layout properties are rejected outright by `audit:animation`, in **both** spellings —
`width` and `inline-size`, `left` and `inset-inline-start`. The logical spellings matter
more here than the physical ones, since `rtl:check` already forbids the physical ones
elsewhere; a list of only physical names would describe a spelling this codebase cannot use.

Four exceptions are documented in the audit, each a place the platform forces the layout
form: the disclosure components (`accordion`, `collapsible`, `tree-view`), native
`<progress>` pseudo-elements, collapsing sidebar rails (which must reflow their sibling
column — `transform` would leave the gap behind), and PullToRefresh's growing well.

---

## 4. The catalogue

Thirteen keyframes in `packages/tokens/src/motion.css`. It is imported from
`tokens/index.css`, so every consumer path already has it — including a component copied by
`cascivo add`, which gains no new dependency.

### Loading & progress

| Keyframe                 | For                           | Notes                                                          |
| ------------------------ | ----------------------------- | -------------------------------------------------------------- |
| `cascivo-spin`           | Spinners, refresh glyphs      | Continuous rotation.                                           |
| `cascivo-shimmer`        | Skeletons, image placeholders | Translate an overlay; see §3.                                  |
| `cascivo-progress-sweep` | Indeterminate bars            | Host must be `overflow: hidden`; bar ≈ 40% of track.           |
| `cascivo-blink`          | Terminal / streaming cursor   | Pair with `step-end`.                                          |
| `cascivo-dots`           | Typing indicator              | Stagger `animation-delay` 0 / 160ms / 320ms across three dots. |
| `cascivo-dash-grow`      | Material-style SVG spinner    | Pair with `cascivo-spin` on the parent.                        |

### Attention & feedback

| Keyframe              | For                               | Notes                                                 |
| --------------------- | --------------------------------- | ----------------------------------------------------- |
| `cascivo-pulse`       | Live badges, recording dots       | Opacity. Floors at 0.4 — see the contrast note below. |
| `cascivo-pulse-scale` | Breathing CTA                     | Scale to 1.05.                                        |
| `cascivo-ping`        | Map markers, unread dots          | Apply to a `::after` under the dot, never the dot.    |
| `cascivo-shake`       | Failed validation                 | Finite; time off `--cascivo-motion-attention`.        |
| `cascivo-wiggle`      | Edit-mode / reorderable items     | ±1.5°.                                                |
| `cascivo-bounce`      | Scroll affordances, FABs          |                                                       |
| `cascivo-flash`       | New table row, hash-linked target | One-shot only; tint via `--cascivo-flash-tint`.       |

> **Never pulse a text label's opacity.** `cascivo-pulse` floors at 0.4 precisely because a
> label fading further crosses below the WCAG contrast threshold mid-cycle. Animate a
> decorative pseudo-element beside the label instead — `ai-label` is the worked example.

Two keyframes are deliberate exceptions to §3, called out at their definitions:
`cascivo-dash-grow` (`stroke-dashoffset` has no transform equivalent) and `cascivo-flash`
(neither does a background tint — so it is one-shot, never looped).

---

## 5. Tokens

**Durations.** `--cascivo-duration-{75,100,150,200,300,500}` for one-shot motion;
`--cascivo-duration-loop-fast` / `-loop` / `-loop-slow` for infinite motion. There is no
`120ms` — snap to the scale.

**Easings.**

| Token                       | Curve                           | For                                                |
| --------------------------- | ------------------------------- | -------------------------------------------------- |
| `--cascivo-ease-in`         | `cubic-bezier(0.4, 0, 1, 1)`    | Exits.                                             |
| `--cascivo-ease-out`        | `cubic-bezier(0, 0, 0.2, 1)`    | Entrances, hover. The default.                     |
| `--cascivo-ease-in-out`     | `cubic-bezier(0.4, 0, 0.2, 1)`  | Loops, symmetric motion.                           |
| `--cascivo-ease-decel`      | `cubic-bezier(0.16, 1, 0.3, 1)` | Off-canvas surfaces — enters fast, settles slowly. |
| `--cascivo-ease-spring`     | `linear(…)`                     | Snap detents. No JS spring solver needed.          |
| `--cascivo-ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)`    | Noticed but unhurried.                             |

**Semantic pairs** — reach for these first; they carry duration _and_ easing:

| Token                        | Resolves to       | For                                              |
| ---------------------------- | ----------------- | ------------------------------------------------ |
| `--cascivo-motion-enter`     | 200ms ease-out    | Anything appearing.                              |
| `--cascivo-motion-exit`      | 150ms ease-in     | Anything leaving. Faster than enter, on purpose. |
| `--cascivo-motion-emphasis`  | 300ms ease-in-out | Deliberate, noticed changes.                     |
| `--cascivo-motion-drawer`    | 300ms ease-decel  | Drawer, Sheet, SideNav.                          |
| `--cascivo-motion-attention` | 500ms ease-out    | Shake, flash, bounce.                            |

The platform axis owns motion (see `packages/tokens/src/layers.css`), so all five semantic
pairs are re-declared in `packages/platform/src/web.css`. A new pair must be added to both,
or `platform parity` fails.

---

## 6. Enter and exit without JavaScript

cascivo does not ship a presence/animation library, and does not need one. The platform
handles it:

- **Modal-style overlays** — native `<dialog>.showModal()`. The browser owns the focus trap
  and Escape.
- **Popups and menus** — native `popover="auto"`. The browser owns light-dismiss and Escape.
- **Exit animations** — transition `display` and `overlay` with `allow-discrete`, so the
  element stays visible (and in the top layer) until the transition finishes.
- **Entrances** — `@starting-style` supplies the from-state on first render.

```css
.dialog {
  opacity: 0;
  scale: 0.96;
  transition:
    opacity var(--cascivo-motion-exit),
    scale var(--cascivo-motion-exit),
    display var(--cascivo-duration-150) allow-discrete,
    overlay var(--cascivo-duration-150) allow-discrete;

  &[open] {
    opacity: 1;
    scale: 1;
    transition:
      opacity var(--cascivo-motion-enter),
      scale var(--cascivo-motion-enter);
    @starting-style {
      opacity: 0;
      scale: 0.96;
    }
  }
}
```

`@cascivo/core`'s `Presence` exists only for the case the platform does not cover: deferring
an **unmount** until an exit animation finishes on an element that is not a `<dialog>` or a
popover. It manages mount timing and nothing else; CSS still drives the visuals via
`data-state="open|closed"`.

Disclosure height is likewise native: `::details-content` with `block-size: auto` as the
static fallback and `calc-size(auto, size)` as the progressive enhancement.

---

## 7. Adding motion to a component

1. Pick a keyframe from §4, or a semantic pair from §5. Do not write a new keyframe unless
   nothing in the catalogue fits — and if you do, it goes in `motion.css`, prefixed
   `cascivo-`, not in the component.
2. Wrap every cross-file keyframe reference in `global()` (§1).
3. Choose the reduced-motion path from §2 by whether the motion is one-shot, decorative
   loop, or indicator loop.
4. Animate only composited properties (§3).
5. Run `pnpm motion:check && pnpm reduced-motion:check`.

If a manifest gains a new state or token, run `pnpm regen` and commit the regenerated
artifacts.

---

## See also

- [`STYLING-INTERNALS.md`](/docs/styling-internals.md) — layers, `data-cascivo-*` styling hooks
- [`TOKENS.md`](/docs/tokens.md) — the full token catalogue
- [`HEADLESS.md`](/docs/headless.md) — `Presence` and the rest of the behavior layer
- [`THEMING.md`](/docs/theming.md) — how a theme tunes motion character
