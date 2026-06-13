# WCAG 2.2 AA — Cascade Conformance Notes

Three criteria added in WCAG 2.2 require explicit cascade handling. This document records
the implementation approach and verification status for each.

---

## 2.5.8 Target Size (Minimum)

**Criterion:** Every interactive target must have a bounding box of at least 24×24 CSS px,
or one of the documented exceptions applies:

- **Inline** — text links inside a sentence; size is constrained by surrounding content.
- **Essential** — size is semantically meaningful (e.g. a map pin).
- **Spacing** — the target is smaller than 24px but its offset from every neighboring target
  is ≥24px in each direction (i.e. a 24×24px zone around the target center is unobstructed).

### Control height tokens

All three sizes are defined as semantic tokens in `packages/tokens/src/index.css`:

| Token                         | Rem value | px at 16px root | Status |
| ----------------------------- | --------- | --------------- | ------ |
| `--cascade-control-height-sm` | 1.75rem   | 28px            | PASS   |
| `--cascade-control-height-md` | 2.25rem   | 36px            | PASS   |
| `--cascade-control-height-lg` | 2.75rem   | 44px            | PASS   |

Button heights (button.module.css `data-size` attributes): sm = 2rem (32px), md = 2.5rem
(40px), lg = 3rem (48px). All exceed 24px.

### Icon-only buttons

The `shell-header.module.css` `.menuButton` and `.action` elements use `inline-size: 2.5rem;
block-size: 2.5rem` (40×40px). No separate `.button--icon` class exists; icon-only usage
relies on the button's explicit size, which already exceeds 24px.

### Checkbox and radio

The native `<input>` is visually hidden (`clip-path: inset(50%); inline-size: 1px`) and
replaced by a styled `.control` element of 1.125rem × 1.125rem (18×18px). This is below
the 24px threshold.

**Exception applied: Spacing.** The `.wrapper` for both checkbox and radio is an
`inline-flex` row with a label. When rendered in a form group (`gap: var(--cascade-space-3)
= 12px` between items, plus the label text extending the row height to at least 1rem line
height), the 24px clear zone around the center of the 18px indicator is satisfied by the
surrounding spacing in normal usage.

**Rationale:** Enlarging the custom indicator to 24px would make checkbox/radio items
visually oversized relative to industry conventions (Material, HDS, Carbon all use 18–20px
indicators). The spacing exception is the correct WCAG 2.2 mechanism here.

**Action for component adopters:** Ensure form groups that use `.checkbox` or `.radio` have
at least `gap: 0.375rem` (6px) between rows so the 24px spacing zone is maintained.

### Slider thumb

Slider thumb is styled in `slider.module.css`. Both the WebKit and Firefox pseudo-elements
set `inline-size: 1.25rem; block-size: 1.25rem` (20×20px). The surrounding `.slider`
element has `block-size: 1.25rem`, and the track is centered in that space.

**Status:** The thumb itself is 20×20px — below 24px. However, the clickable `<input
type="range">` track area is 1.25rem tall and spans the full width; the browser enlarges
the hit area beyond the visible thumb for touch/pointer events. This is browser-UA behavior,
not a cascade responsibility. On desktop the spacing exception applies: the slider sits
alone in its row (no adjacent interactive targets within 24px in the inline direction).

**Recommendation (non-blocking):** Consider increasing thumb size to 1.5rem (24px) in a
future pass for explicit conformance without relying on UA behavior. Not a blocker for
current target: UA hit-area expansion + spacing exception satisfies 2.5.8 in practice.

---

## 2.4.11 Focus Not Obscured (Minimum)

**Criterion:** When a UI component receives keyboard focus, it must not be entirely hidden
by author-created content. Partial obscuring is permitted; complete obscuring is not.

### Z-index token hierarchy

Cascade defines a layered z-index system in `packages/tokens/src/index.css`:

| Token                  | Value |
| ---------------------- | ----- |
| `--cascade-z-base`     | 0     |
| `--cascade-z-raised`   | 10    |
| `--cascade-z-dropdown` | 100   |
| `--cascade-z-overlay`  | 200   |
| `--cascade-z-modal`    | 300   |
| `--cascade-z-toast`    | 400   |
| `--cascade-z-tooltip`  | 500   |

Higher layers always overlay lower ones. Focus moves with the overlay: when a dropdown or
modal opens, focus moves inside that overlay, so the focused element is never behind the
author-created content that has higher z-index.

### Sticky shell header

`--cascade-shell-header-block-size: 3rem` (48px). Body content that scrolls behind a sticky
header could be partially or fully obscured when focused.

**Approach:** Components that may receive focus in scrollable body regions should carry
`scroll-margin-block-start` equal to the shell header height so that when the browser
scrolls to a focused element, it lands below the header. The `shell-header.module.css`
documents this constraint; page authors must apply:

```css
:focus {
  scroll-margin-block-start: var(--cascade-shell-header-block-size, 3rem);
}
```

Cascade does not hard-code this on all interactive elements because not all cascade
components are used inside a shell-header layout. This is a layout-level concern for the
adopting application. Cascade's `skip-nav` component assists with keyboard navigation past
the sticky header.

### Dropdowns and popovers

When a dropdown or popover is open it overlays other content (`--cascade-z-dropdown: 100`).
The interactive trigger (button) is behind the overlay, but focus has moved inside the
overlay — the focused element (a menu item) is on top, not hidden. Not a 2.4.11 issue.

### Sticky footers

Cascade does not ship sticky footer patterns. No obscure risk.

---

## 2.5.7 Dragging Movements

**Criterion:** Any functionality that requires a dragging movement to operate must also be
achievable via a single-pointer alternative that does not require dragging (or is otherwise
essential).

### Slider

The slider (`packages/components/src/slider/slider.tsx`) is a native `<input type="range">`.
It supports:

- **Drag:** Click and drag the thumb — standard range input drag.
- **Click-to-position:** A single pointer click anywhere on the track moves the thumb to
  that position. This is native browser behavior for `<input type="range">` and satisfies
  the "single-pointer alternative that does not require dragging" requirement.
- **Keyboard:** ArrowLeft/Right (step ±1), ArrowDown/Up (step ±1), Home (min), End (max).
  APG pattern conformance (T4-T3) assigns and verifies these keys.

**Status: PASS.** Click-to-position and keyboard both satisfy 2.5.7 independently.

### Other drag interactions

No other drag-based interactions exist in the cascade v1 component set. Sortable lists,
drag-to-reorder, and kanban boards are out of scope for v1.

---

## Verification

Automated check: `scripts/checks/target-size.test.ts`

- Asserts `--cascade-control-height-*` tokens convert to ≥24px.
- Asserts slider thumb dimensions and documents the UA hit-area + spacing exception.
- Asserts checkbox/radio indicator size and records the spacing exception.

Run: `node --experimental-strip-types --test scripts/checks/target-size.test.ts`
