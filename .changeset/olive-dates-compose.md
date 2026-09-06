---
'@cascivo/react': minor
'@cascivo/i18n': minor
---

`DatePicker` is rebuilt as a typed field plus a composed `Calendar`, replacing a weaker
hand-rolled copy of the grid. All existing props keep their shape.

**It could not be typed into.** The field was a `<button>`, so a date already known could
only be reached by paging a grid — something the manifest itself listed as a reason _not_ to
use the component. The field is an `<input role="combobox">` that parses ISO and the locale's
numeric form (`18/03/2026`, `03/18/2026`, `18.03.26`), commits on Enter or blur, and rejects
unreadable or out-of-bounds input rather than coercing it.

**Arrow keys did nothing until a value was set.** `handleGridKeyDown` opened with
`if (!current) return`, and the active date seeded from the selection, so on a fresh
`<DatePicker />` every arrow key was inert.

**The popup neither took nor returned focus.** Opening left focus on the trigger, so the grid
was unreachable without tabbing into it; closing dropped focus on `<body>` (WCAG 2.4.3).

**The grid was a second copy of Calendar.** `getWeekStart` and `getMonthGrid` were duplicated
byte-for-byte and the whole month table re-implemented, so every fix had to be made twice and
in practice was not: this copy had no real focus movement, no min/max clamping on the
keyboard, no disabled-day skipping, `aria-pressed` on day buttons instead of `aria-selected`,
no explicit `role="gridcell"`/`role="row"`, and its `role="dialog"` was permanently mounted
with all thirty day buttons in the DOM while closed. It now renders `<Calendar>` and inherits
every one of those behaviours.

Also fixed: `ArrowDown` opens the popup (the combobox pattern's required key, listed in the
old manifest but never implemented); dismissal moved to the shared `DismissableLayer`,
replacing a raw `document.addEventListener('mousedown')` — DatePicker leaves the
`primitive-adoption` allowlist; the 📅 and ✕ literal glyphs became masked icons.

New: `typeable` (set false for the previous button-only trigger, which then supports
Delete/Backspace to clear — impossible before), `disabledDate` for rejecting individual dates
the bounds allow, `format` for the displayed value, `showToday`, `name` for native form
submission, `required`, and controlled `open`/`onOpenChange`.

Styling: added the `@media (pointer: coarse)` block (there was none — the field, clear and
open buttons were all under 44px), reduced-motion and forced-colors blocks.

Date parsing moves to a pure `parse-date.ts` with 16 unit tests covering locale component
order, two-digit years and impossible dates like 30 February, which `Date.UTC` otherwise
rolls silently into March. Component tests go from 13 to 55.
