# Modern CSS adoption — closing the remaining platform gaps

**Status: Phases 1–9 implemented 2026-08-29.** Phase 10 items 1–2 remain. Every support
claim below was verified empirically in Chromium 141 via Playwright probes, not read off a
support table — three of them turned out to be wrong on first reading, and one uncovered a
live bug (§Phase 7).

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

**Change, as implemented.**

- `Grid` gains an opt-in `alignRows` boolean. Every direct child spans three implicit row
  tracks and adopts them with `grid-template-rows: subgrid`.
- `Card` stamps `data-cascivo-card` (a new published style hook), which `grid.module.css`
  targets one level down so the tracks pass through a wrapping `GridItem`.
- The `@supports` guard is **required, not insurance**: `grid-row: span 3` without a working
  `subgrid` would leave two empty tracks under every card, so the block is not decomposable.

**Defect found by measuring rather than eyeballing.** A subgrid inherits its parent's `gap`,
so the grid's own `gap={4}` was re-applied *between* each card's header, content and footer —
16px of dead space per seam. `row-gap: 0` on both subgrid levels is load-bearing. Measured
before: two footers 100px apart. After: both at the same y.

`settings-layout` was **not** changed — its label/control alignment is a separate shape and
folding it in would have widened this phase without a measurement to justify it.

**Verify.** New `Grid` prop → `props-parity`, `prop-defaults-parity`, `dead-props`,
`example-props` all run from the manifest, so the `.meta.ts` update is mandatory.
Visual baselines regenerate.

---

## Phase 3 — Scroll-state container queries

**Problem.** `ScrollArea` runs a `useSignalEffect` scroll listener whose entire job is to
toggle four boolean attributes (`data-scroll-top/bottom/start/end`) that CSS then reads. The
same shape recurs in `DataTable`'s sticky header shadow and `apps/site`'s Header.

**Constraint, verified.** A container query styles **descendants**, never the container box
itself. `ScrollArea` paints its shadows as `box-shadow: inset` on the scroller `.root`, which
*is* the container. A browser probe settled the open question: a container's own
`::before`/`::after` **are** matched by its own `scroll-state` query. So the shadows move to
two zero-height `position: sticky` pseudos at the block edges — no DOM change, no wrapper.

**Second constraint, verified.** `scroll-state(stuck: …)` is asked **of the sticky element**,
not of the scroller. `DataTable`'s container is therefore the `thead th`, and — since a
container cannot style itself — the shadow is painted on `th::after`. A probe confirmed
`container-type: scroll-state` works on a real sticky `<th>` despite its `table-cell`
display.

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

**Change, as implemented.** Add to `.field`:

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

**A live bug, found by probing rather than by reading.** Six declarations in `Dropdown` and
`Tooltip` used `inset-area`. That property was renamed to `position-area`, and Chromium 141
**no longer accepts the old name** — `CSS.supports('inset-area', …)` returns `false`. Every
anchored placement in both components was therefore dead CSS, silently falling back to the
UA's default top-layer position. Safari 26 never shipped the old name either.
`multi-select.module.css` already used `position-area`, which is what made the inconsistency
visible. All six are renamed; verified applying afterwards (`positionArea` computes to
`"end span-start"` where it previously computed to nothing).

Beyond that fix, three additions, all inside the existing
`@supports (anchor-name: --a) and (position-anchor: --a)` blocks so they inherit the gate:

1. **`anchor-size()`** — `dropdown.module.css` hard-coded `min-inline-size: 10rem`, so a
   full-width trigger opened a narrow panel hanging off one edge. Now
   `max(10rem, anchor-size(self-inline))`: matches a wide trigger, keeps the floor for an
   icon-sized one, with the static `10rem` preceding it as the fallback.
2. **`position-visibility: anchors-visible`** on `Tooltip` and `HoverCard` — **not**
   `no-overflow`, which the first draft had. `no-overflow` hides the tip when *the tip*
   overflows; the actual failure is the anchor scrolling out from under it while the tip,
   being in the top layer, is not clipped by the anchor's scroller and stays painted over
   unrelated content. `anchors-visible` is the one that ties the two together.
3. **Named `@position-try` blocks** — deferred. `multi-select` already has one
   (`--bottom-start`); no other component has a placement the built-in keywords cannot
   express, so adding the machinery now would be speculative.

**Follow-up, not this phase:** `packages/core/src/anchor.tsx`'s JS fallback registers a
*capturing* `window` scroll listener — the most expensive listener shape in the file. Record a
deletion trigger: when Firefox ships anchor positioning, the fallback branch and its listener
go, and `useAnchorPosition` becomes a pure style emitter.

---

## Phase 8 — Container-query breadth sweep

**The premise was wrong, and the finding is the useful part.** The plan assumed the 7
remaining width `@media` rules in package CSS were unconverted debt. Reading all seven shows
every one is legitimately viewport-scoped and `@container` would match nothing:

| File | Why the viewport is right |
| --- | --- |
| `modal`, `alert-dialog` | top-layer `<dialog>` — no ancestor contains it |
| `dock` | `position: fixed` screen-level bottom bar — it has no slot |
| `toast` | portalled; the container version shipped first and **never matched** |
| `app-shell` ×3 | the page frame — nothing above it to query |

So the conversion work is zero. What was missing is not the conversion but the **record**:
four of the seven carried no rationale, so the next reader had to re-derive it (and `toast`
only carries one because someone got it wrong first).

**Change, as implemented.** `scripts/checks/container-preference.test.ts` fails on any width
`@media` in `packages/components` or `packages/layouts` that is not preceded by a
`viewport-query: <reason>` comment. All seven now carry one. Wired into `pnpm meta:check` and
available standalone as `pnpm container-preference:check`.

---

## Phase 9 — Guard rails for everything above

Each phase adds a progressive property; without a check they rot silently.

- Extend `scripts/checks/css-fallback.ts` to require a static fallback for
  `appearance: base-select`, `field-sizing`, `text-box-trim`, `anchor-size()`, and
  `container-type: scroll-state` — the same rule it already applies to `contrast-color()`.
- `docs/COMPATIBILITY.md` gains a row per feature adopted, matching the table in §0. **Done.**

**The extended `fallback:check` paid for itself on first run**, flagging two declarations
neither the plan nor the review had noticed: `multi-select`'s `position-area` was ungated
(reading as though it always applied, when in fact it is dropped without anchor positioning),
and this plan's own `field-sizing: content` had no `@supports` wrapper. Both are now gated.

**Not done, deliberately:** the proposed `primitive-adoption` rule about gating new `scroll`
listeners on `CSS.supports`. The honest version needs an allowlist of every listener that
produces JS state rather than styles (`Carousel`, `LogViewer`, `WheelPicker`, `DataTable`'s
virtualiser, the code editor), and an allowlist that large is a list of exceptions pretending
to be a rule. Revisit if a second listener-for-styling case appears.

---

## Phase 10 — Beyond the original list

Ordered by value, all small:

1. **`reading-flow`** — **investigated, then dropped: it has no call site here.** The premise
   was that `Masonry` diverges visual order from DOM order. It does not, in any browser
   shipping today:
   - Chromium 141 supports **neither** masonry syntax (`CSS.supports('grid-template-rows',
     'masonry')` and `('display','masonry')` are both `false`), so `Masonry` always takes its
     multi-column fallback — and that fallback is column-major, where DOM order and visual
     order agree by construction. Both `@supports` blocks in `masonry.module.css` are
     currently inert in Chrome.
   - The only other `order`/`*-reverse` sites are `input-group`'s addon (`pointer-events:
     none`, not focusable), `fab`'s icon-and-label inside one button, and `chat-bubble`'s
     avatar. None is a focus-order divergence.

   `reading-flow` is worth revisiting the day a masonry syntax actually ships, and not before
   — adding it now would be guarding a path with a feature nobody has.

2. **`text-box-trim: trim-both` / `text-box-edge: cap alphabetic`** — **open decision, not an
   implementation detail.** Measured against the built stylesheet: `Button` and `Badge` do not
   move at all (both have explicit `block-size`/padding, so trimming the half-leading changes
   nothing). The effect lands entirely on auto-height text — headings, card titles, stacked
   paragraphs — where it tightens vertical rhythm across the whole catalog at once.

   That makes it a typographic decision about the system's rhythm, with a Chromium-only
   split (supporting browsers would render slightly tighter than the rest), rather than a
   defect being fixed. It wants a human signing off on the look and a visual-baseline
   regeneration, so it is deliberately left unimplemented here.
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
