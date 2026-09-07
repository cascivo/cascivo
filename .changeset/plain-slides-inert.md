---
'@cascivo/react': minor
'@cascivo/i18n': minor
---

`Carousel` stops hiding focusable content from assistive technology, and honours the
reduced-motion preference it claimed to. All existing props keep their shape.

**Inactive slides were `aria-hidden` while still being tabbable.** They stay in the layout and
remain scroll-reachable, so `aria-hidden` declared them non-existent to a screen reader while
every link and button inside them was still in the tab order — the canonical
`aria-hidden-focus` violation (WCAG 4.1.2, and 2.4.3 for the focus order). They use `inert`
now, which removes exposure and focusability together. The manifest claimed
`wcag: '2.2-AA'` throughout.

**Reduced motion was never honoured.** The stylesheet had a
`@media (prefers-reduced-motion: reduce) { .track { scroll-behavior: auto } }` rule, but the
paging call passed `behavior: 'smooth'` to `scrollTo`, and a JS scroll option overrides CSS —
so the rule could not take effect, and it was overriding a property `.track` never set in the
first place. The preference is read directly now.

Also fixed:

- **`NaN` index on a zero-width track.** `Math.round(scrollLeft / clientWidth)` is `0/0` in
  jsdom, during hydration before layout, and inside a `display: none` ancestor. The `NaN`
  propagated into `onIndexChange` and every `i === active.value` comparison.
- **A mapped child list collapsed into a single slide.**
  `<Carousel><Intro />{items.map(…)}</Carousel>` arrives as `[<Intro/>, [...]]`, and the
  `Array.isArray` check made the entire mapped list one slide. It uses `Children.toArray`.
- **Arrow keys moved only the roving tabindex,** leaving the displayed slide behind, although
  the manifest has always listed them. They move the slide.
- **The region and the indicator group had the same name** ("Carousel"); the indicators are
  named separately, as APG specifies.
- A controlled `index` never reached the roving tabindex, so the tabbable indicator stayed on
  slide 0.
- `slideRefs` was populated every render and never read.

New: `autoplay` (milliseconds between advances). It always renders a play/pause control — APG
requires one for anything that rotates by itself — and additionally pauses on hover, on focus
within the carousel, while the tab is hidden, and under `prefers-reduced-motion`. The track is
`aria-live="polite"` while the user drives it and `"off"` while it rotates, so an
auto-advancing region does not talk over itself.

Styling: added the `@media (pointer: coarse)` block (there was none). The indicator hit area
reaches the target minimum through a pseudo-element, so the 10px visual mark — which failed
WCAG 2.2 SC 2.5.8's 24px floor outright — is unchanged while the target is not.

Tests go from 3 to 20.
