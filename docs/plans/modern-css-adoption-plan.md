# Modern CSS adoption — closing the remaining platform gaps

**Status: proposed 2026-08-29.** Phases land independently; each is shippable alone.

cascivo already runs on most of the 2025–2026 CSS platform: anchor positioning, `:has()`,
`calc-size(auto)` over `::details-content`, `@container`, native masonry (both syntaxes),
OKLCH + `color-mix()` + relative color + `contrast-color()`, `@starting-style`,
`allow-discrete`, `@property`, `@scope`, `commandfor`, view transitions. This plan covers
only what a full-repo audit found **unused**, and only where the feature removes JavaScript,
removes a workaround, or adds a capability the catalog does not have.

Two settled decisions are **not** reopened here:

- **`light-dark()` stays rejected** — `ROADMAP-V58` C-1. cascivo is a 12-theme `[data-theme]`
  system scoped to any container; `light-dark()` is a two-way `color-scheme` pair.
- **`interpolate-size: allow-keywords` stays rejected** — `details-disclosure-plan.md` §1.2.
  `calc-size(auto, size)` already gets the same animation per-call-site with a static
  fallback, and needs no global opt-in that a minifier can drop.

---

## 0. Ground rules for every phase

Non-negotiable, and identical to the rules already in `CLAUDE.md`:

1. **Static fallback first, progressive line second, in the same rule block.** Every
   Chrome-only property below is progressive enhancement. `pnpm fallback:check` enforces the
   contract for `@function`/`if()`/`contrast-color()`; Phase 9 extends it to the new
   properties so the contract is machine-checked rather than remembered.
2. **`@supports` gates the enhancement**, never a UA sniff. Where JS is being replaced, the
   JS is gated by the matching `CSS.supports(...)` so a supporting browser ships no listener
   and a non-supporting one is unchanged.
3. **No layer invention.** Everything lands in `cascivo.component` (or
   `cascivo.blocks.<name>`), per `layers:check` / `unlayered:check`.
4. **Manifest is the source of truth.** Any component whose `clientJs` grade, tokens, style
   hooks, or props change updates its `.meta.ts` and re-runs `pnpm regen`.
5. **A visual baseline exists for every registry component.** Any phase that moves pixels
   regenerates baselines deliberately, in its own commit, with the diff reviewed.

Support data used for the gates below (checked 2026-08):

| Feature                                        | Chrome | Firefox | Safari | Verdict            |
| ---------------------------------------------- | ------ | ------- | ------ | ------------------ |
| `subgrid`                                       | 117    | 71      | 16     | **Baseline** — no gate needed |
| `field-sizing: content`                         | 123    | 121     | 26     | near-baseline — gate |
| `text-box-trim` / `text-box-edge`               | 133    | —       | 18.2   | PE                 |
| `appearance: base-select` / `::picker(select)`  | 135    | —       | —      | PE                 |
| `container-type: scroll-state`                  | 133    | —       | —      | PE                 |
| `anchor-size()`                                 | 125    | —       | 26     | PE (already gated with the rest of anchor positioning) |
| `position-visibility`                           | 125    | —       | 26     | PE                 |
| `::scroll-marker` / `::scroll-button()`         | 135    | —       | —      | PE, **experiment only** |
| `reading-flow` / `reading-order`                | 137    | —       | —      | PE (a11y-positive either way) |
| `sibling-index()` / `sibling-count()`           | 138    | —       | —      | PE                 |
| `interesttarget`                                | flag   | flag    | —      | watch-list, no work |

---

## Phase 1 — `appearance: base-select` on `NativeSelect`

**Problem.** `native-select.module.css` sets `appearance: none` and hand-draws a chevron
because the option list has never been stylable. The dropdown surface therefore ignores
`[data-theme]` entirely: a `terminal`-themed app opens an OS-grey listbox. That gap is the
reason `Select`, `Combobox` and `MultiSelect` all exist in richer form.

**Change.** Add a progressive block to `native-select.module.css`:

```css
@supports (appearance: base-select) {
  .select,
  .select::picker(select) {
    appearance: base-select;
  }
  /* ::picker(select), option, ::checkmark, ::picker-icon styled from tokens */
}
```

- The picker surface reuses the popover/menu token set (`--cascivo-color-surface`,
  `--cascivo-shadow-lg`, `--cascivo-radius-surface`) so it matches `Dropdown` visually.
- `position-try-fallbacks: flip-block` on the picker, matching `menu.module.css`.
- `@starting-style` + `allow-discrete` for the open transition, matching the house pattern.
- The custom `.chevron` span is **hidden** inside the `@supports` block (the UA supplies
  `::picker-icon`); it stays for every other browser. No DOM change, no prop change.

**Non-goals.** `Select`/`Combobox`/`MultiSelect` are untouched — they carry behaviour
(`onValueChange`, filtering, multi-value chips) that `<select>` does not have. This phase
makes the cheapest and most accessible option in the catalog look like the expensive ones,
it does not deprecate anything.

**Verify.** `pnpm layers:check`, `pnpm fallback:check`, component tests unchanged (jsdom sees
no `::picker`), manifest `tokens` list updated, `pnpm regen`.

---

## Phase 2 — Subgrid for cross-card alignment

**Problem.** Adjacent `Card`s in a `Grid` row cannot align their header/content/footer bands
when content lengths differ. `GridItem` already stretches (`display: grid; align-content:
stretch`), so the card fills the row — but its internal bands float wherever content puts
them. Every dashboard hits this.

**Change.**

- `Grid` gains an opt-in `alignRows` boolean. When set, `.grid` declares
  `grid-template-rows: repeat(var(--_grid-rows, 3), auto)` per implicit row band, and
  `.grid-item` becomes `grid-row: span var(--_grid-rows, 3); grid-template-rows: subgrid`.
- `Card` opts in via `&:has(> .header, > .content, > .footer)` already present: inside a
  subgrid item it sets `display: grid; grid-template-rows: subgrid; grid-row: span 3`.
- `settings-layout` gets the same treatment for label/control column alignment.

Subgrid is Baseline, so this needs no `@supports`; a `@supports (grid-template-rows: subgrid)`
guard is still cheap insurance for older Safari 15 and is included.

**Verify.** New `Grid` prop → `props-parity`, `prop-defaults-parity`, `dead-props`,
`example-props` all run from the manifest, so the `.meta.ts` update is mandatory.
Visual baselines regenerate.

---

## Phase 3 — Scroll-state container queries

**Problem.** `ScrollArea` runs a `useSignalEffect` scroll listener whose entire job is to
toggle four boolean attributes (`data-scroll-top/bottom/start/end`) that CSS then reads. The
same shape recurs in `DataTable`'s sticky header shadow and `apps/site`'s Header.

**Constraint discovered during design — read before implementing.** A container query styles
**descendants** of the container, never the container box itself. `ScrollArea` paints its
shadows as `box-shadow: inset` on the scroller `.root`, which is the container. So the
enhancement cannot be a drop-in: inside `@supports (container-type: scroll-state)` the
shadows must move to the scroller's own `::before`/`::after` (generated child boxes, which
*are* matched by the container's queries), positioned `sticky` at the block edges.

**Change.**

```css
@supports (container-type: scroll-state) {
  .root {
    container-type: scroll-state;
  }
  @container scroll-state(scrollable: top) {
    .root::before { opacity: 1; }
  }
  @container scroll-state(scrollable: bottom) {
    .root::after { opacity: 1; }
  }
}
```

- The existing `[data-scroll-*]` rules stay untouched as the fallback path.
- `scroll-area.tsx` wraps the listener registration in
  `if (CSS.supports('container-type: scroll-state')) return` so supporting browsers ship no
  listener at all.
- `clientJs` stays `'enhancement'` — the listener still exists for Firefox/Safari — but the
  manifest note records that Chromium runs it CSS-only.

**Risk.** This moves pixels on the most-used scroller in the catalog. It lands with its own
visual-baseline commit and a `bare-page:check` run.

**Also in scope:** `DataTable` sticky-header shadow, `apps/site` Header "stuck" state
(`@container scroll-state(stuck: top)`), replacing the sticky-detection branch there.

---

## Phase 4 — `field-sizing: content`

**Problem.** `Textarea` has a fixed `rows` and no autosize at all. Adopters hand-roll the
`scrollHeight` dance, which is exactly the thing this plan exists to delete.

**Change.** New `autosize?: boolean` on `Textarea`. When set, the root gets
`data-autosize`, and CSS applies:

```css
.textarea[data-autosize] {
  /* fallback: `rows` still governs — no behaviour change off-Chromium */
  field-sizing: content;
  min-block-size: calc(var(--_rows, 4) * 1lh);
  max-block-size: var(--cascivo-textarea-max-block-size, 20lh);
}
```

`rows` remains the fallback height everywhere, so the non-supporting rendering is exactly
today's. `min`/`max-block-size` are required — without them `field-sizing: content` collapses
an empty textarea to one line and grows it without bound.

**Also in scope:** the inline input inside `TagsInput` and `Combobox`, where
`field-sizing: content` sizes the input to its typed text instead of a fixed width.

---

## Phase 5 — Scroll-driven animation, second wave

Only `large-title-header` uses `animation-timeline` today. Two clear replacements:

1. **`apps/site/src/marketing/reveal.ts`** — an `IntersectionObserver` plus a
   `MutationObserver` (to catch lazily-mounted sections), ~40 lines, whose only output is a
   `data-revealed` attribute driving a CSS transition. Replace with
   `animation-timeline: view(); animation-range: entry 0% cover 20%;` behind
   `@supports (animation-timeline: view())`, keeping the JS as the fallback and skipping its
   registration when supported. The `MutationObserver` disappears entirely — CSS needs no
   rescan for late-mounted nodes.
2. **`apps/site` Header scroll-progress** — a `scroll` listener computing `--scroll-ratio`
   from `scrollY / (scrollHeight - innerHeight)`. Replace with
   `animation-timeline: scroll(root block)` on a `scaleX` keyframe.

**Explicitly out of scope.** `Toc` scrollspy and `InfiniteScroll` keep their
`IntersectionObserver`s: both produce **JavaScript state** (an active id; a fetch trigger),
not just styling, and scroll-driven animation cannot express either. `Carousel`'s listener is
Phase 7's problem, not this one.

Both changes must respect `prefers-reduced-motion` the way `large-title-header` already does.

---

## Phase 6 — `:has()` on `Field`

**Problem.** `field.module.css` contains zero `:has()`. Error, invalid and disabled styling is
threaded through props → `data-disabled` → cloned `aria-invalid` on the control. The a11y
wiring (`aria-describedby`, `aria-invalid`, `role="alert"`) genuinely needs the props and
stays. The **styling-only** half does not.

**Change.** Add to `.field`:

```css
&:has(:disabled) { opacity: 0.5; }              /* joins the existing [data-disabled] rule */
&:has([aria-invalid='true']) .description { color: var(--cascivo-color-text-muted); }
&:has(:user-invalid) { /* label + border react without a prop round-trip */ }
```

`:user-invalid`, **not** `:invalid` — `:invalid` matches a `required` field before the user
has touched it, which turns every fresh form red. This is the single most common mistake with
this feature and the reason the rule is written out here.

`input-group.module.css` already proves the pattern in-repo; this extends it to the component
every form is built from.

---

## Phase 7 — Finish the anchor-positioning set

Anchor positioning is adopted but incomplete. Three additions, all inside the existing
`@supports (anchor-name: --a) and (position-anchor: --a)` blocks so they inherit the gate:

1. **`anchor-size()`** — `dropdown.module.css` hard-codes `min-inline-size: 10rem`. Replace
   with `min-inline-size: anchor-size(self-inline)` so the panel matches its trigger, keeping
   `10rem` as the preceding static fallback. Same for `Combobox` and `MultiSelect` panels.
2. **`position-visibility: no-overflow`** on `Tooltip` and `HoverCard`, so a tip whose anchor
   scrolls out of a clipping ancestor hides instead of stranding itself mid-viewport.
3. **Named `@position-try` blocks** for flips the built-in keywords cannot express (a menu
   that should shift inline before it flips block).

**Follow-up, not this phase:** `packages/core/src/anchor.tsx`'s JS fallback registers a
*capturing* `window` scroll listener — the most expensive listener shape in the file. Record a
deletion trigger: when Firefox ships anchor positioning, the fallback branch and its listener
go, and `useAnchorPosition` becomes a pure style emitter.

---

## Phase 8 — Container-query breadth sweep

24 `@container` rules across 13 files, of which only 5 are components; 7 width-based `@media`
rules remain in package CSS. For a library whose thesis is "the component adapts to its slot",
the ratio is the wrong way round.

**Change.** Convert the 7 remaining component-level width `@media` rules to `@container`
(where the component owns or can declare a query container), and add
`scripts/checks/container-preference.test.ts` — a sibling of `breakpoint:check` that fails on
a **new** width-based `@media` in `packages/components` or `packages/layouts` unless the file
carries an explicit `/* viewport-query: <reason> */` opt-out. Viewport queries stay legal for
things that genuinely are viewport-scoped (`AppShell`'s drawer breakpoint).

---

## Phase 9 — Guard rails for everything above

Each phase adds a progressive property; without a check they rot silently.

- Extend `scripts/checks/css-fallback.ts` to require a static fallback for
  `appearance: base-select`, `field-sizing`, `text-box-trim`, `anchor-size()`, and
  `container-type: scroll-state` — the same rule it already applies to `contrast-color()`.
- Extend `scripts/checks/primitive-adoption.test.ts` with a rule that a component adding a
  raw `scroll` listener must gate it on `CSS.supports` when a CSS equivalent exists (an
  allowlist for the ones that genuinely produce JS state).
- `docs/COMPATIBILITY.md` gains a row per feature adopted, matching the table in §0.

---

## Phase 10 — Beyond the original list

Ordered by value, all small:

1. **`reading-flow: grid-order` / `reading-order`** — an **accessibility** item, not a
   flourish. `Masonry` and any reordering `Grid` currently have visual order ≠ DOM/tab order
   with no fix available at all. Chromium-only, but the fallback is today's behaviour, so
   this is strictly an improvement where supported.
2. **`text-box-trim: trim-both` / `text-box-edge: cap alphabetic`** — removes optical padding
   drift on `Button`, `Badge` and card headings. Meaningful for a system that ships a written
   spacing spec (`docs/specs/spacing.md`); pairs with it as the mechanism that makes the spec
   true optically, not just numerically.
3. **`::scroll-marker` / `::scroll-marker-group` / `::scroll-button()`** — the CSS-native
   carousel. `carousel.tsx` currently syncs its index from a `scroll` listener **plus a
   400 ms `setTimeout` guard** against programmatic scrolls; that guard is a real race, not a
   style choice. The CSS carousel removes both. **Prototype only** — Chromium-only, and the
   a11y semantics of `::scroll-marker` are still moving. Do not swap the shipped `Carousel`
   until Firefox or Safari ships.
4. **`sibling-index()` / `sibling-count()`** — no current pain in-repo (no `--index` inline
   styles found). Adopt only when a stagger-animation component arrives.
5. **`corner-shape`** — theme-level flourish. No plan.
6. **Interest invokers (`interesttarget`)** — would delete the hover/close `setTimeout` pairs
   in `Tooltip` and `HoverCard`. Behind a flag in every engine. **Watch-list; no work.**

---

## Recommended order

Phases 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9, then Phase 10 items 1–2. Rationale: Phase 1 is the
largest unexploited win and touches one file pair; Phase 2 is Baseline and needs no gate;
Phase 3 carries the most visual risk so it wants the earlier phases' baselines already
settled; Phases 6–8 are cleanup; Phase 9 locks the whole set in.
