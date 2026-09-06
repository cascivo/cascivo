---
'@cascivo/react': minor
'@cascivo/i18n': minor
---

`Calendar`'s keyboard navigation never moved focus. All existing props keep their shape.

**Arrow keys only rotated a roving `tabIndex`.** Real DOM focus stayed on the
previously-focused button, and the moment a key crossed a month boundary that button
unmounted and focus fell to `<body>` — the user was ejected from the widget mid-navigation.
Every key in the manifest was in that position: the whole keyboard model was inert for anyone
relying on focus.

Fixing it surfaced a second problem. React reuses the day buttons positionally across months,
so simply leaving focus alone is not neutral either: the focused node survives the re-render
and now shows a different date. Paging from 18 March put focus on **22 April** — the same
grid slot. The focus move is therefore deferred a task (Preact signal effects run
synchronously on write, before React commits) and re-queried by date.

Also fixed:

- **Navigation was unbounded.** Arrows and PageUp/PageDown walked straight past `min`/`max`
  into months where every day was `aria-disabled`, and could park the cursor on a day Enter
  silently ignores. Movement is clamped, skips disabled days in the direction of travel, and
  the prev/next buttons disable at the bounds.
- **`aria-selected` sat on the `<td>`** while focus landed on the inner `<button>`, so the
  selected state was never announced. It is on the button now, and omitted rather than
  serialised as `"false"` on the other thirty cells.
- **"Today" could be a day early.** `new Date()` is an instant, and it was compared through
  `getUTC*` getters, so east of UTC+12 `aria-current="date"` marked yesterday. Today is read
  from the local calendar.
- **The month label was itself the live region** _and_ the grid's `aria-label`, so paging
  mutated the accessible name of the container focus sits inside. The announcement moved to a
  separate visually-hidden status region.
- **A changed controlled `value` did not move the view.** The view seeded once at mount, so
  `<Calendar value={september} />` after rendering June stayed on June with the selection
  off-screen.
- Clicking a day left the roving cursor behind, so a subsequent arrow continued from wherever
  it had been rather than from the click.
- `addMonths` rolled 31 January into 3 March instead of clamping to 28/29 February.

New: `showToday` (a button that jumps the view and focuses today — which finally uses the
`calendar.today` catalog string, dead since it was added), `showWeekNumbers` (ISO-8601), and
`ariaLabel`/`label` for naming the grid.

Styling: added the `@media (pointer: coarse)` block (there was none — day cells were 36px and
nav buttons 32px), a reduced-motion block, and forced-colors rules for selection, today and
disabled days.

The date arithmetic moves to a pure `calendar-date.ts` with 33 unit tests covering month
boundaries, leap years, locale week starts, clamping and disabled-day skipping. Component
tests go from 10 to 36.
