# Assistive-Technology Support Matrix

## Introduction

This matrix records assistive-technology (AT) test results for the representative component set defined in `at-methodology.md`. Testing was performed manually; stacks not available in the current environment are marked `not tested`. Results are point-in-time — re-run when components change.

---

## Result Key

| Symbol | Meaning |
|---|---|
| ✅ pass | Role, name, state announced correctly; all APG keys work as expected |
| ⚠️ partial | Most criteria pass; one quirk noted (e.g. double-announcement) |
| ❌ fail | One or more required announcement or key missing |
| — not tested | Stack unavailable in test environment |

---

## Test Stacks

| Column | Screen Reader | Browser | Platform |
|---|---|---|---|
| NVDA+Firefox | NVDA 2024.x | Firefox | Windows |
| NVDA+Chrome | NVDA 2024.x | Chrome | Windows |
| JAWS+Chrome | JAWS 2024 | Chrome | Windows |
| VoiceOver+Safari | VoiceOver | Safari | macOS |

---

## Results

| Component | NVDA+Firefox | NVDA+Chrome | JAWS+Chrome | VoiceOver+Safari |
|---|---|---|---|---|
| Button | — not tested | — not tested | — not tested | — not tested |
| Checkbox | — not tested | — not tested | — not tested | — not tested |
| Radio | — not tested | — not tested | — not tested | — not tested |
| Toggle (switch) | — not tested | — not tested | — not tested | — not tested |
| Slider | — not tested | — not tested | — not tested | — not tested |
| Tabs | — not tested | — not tested | — not tested | — not tested |
| Accordion | — not tested | — not tested | — not tested | — not tested |
| Modal | — not tested | — not tested | — not tested | — not tested |
| Dropdown | — not tested | — not tested | — not tested | — not tested |
| Tooltip | — not tested | — not tested | — not tested | — not tested |
| Toast | — not tested | — not tested | — not tested | — not tested |
| BarChart | — not tested | — not tested | — not tested | — not tested |

---

## Known AT Quirks

These are documented quirks from published ARIA APG research that implementers should watch for when running real tests. They are not confirmed cascade bugs — they are known screen-reader behaviors that testing should verify or rule out.

1. **JAWS + Modal:** JAWS requires `aria-modal="true"` on the dialog element to engage virtual-buffer suspension. Cascade Modal sets this. Verify during testing whether the dialog title is double-announced on focus entry.

2. **VoiceOver + aria-live:** VoiceOver can miss rapid `aria-live="polite"` updates if they fire within ~50ms of each other. Cascade chart tooltip uses a single live region updated on ArrowKey — this should be fine, but confirm during testing that value announcements are not dropped.

3. **NVDA + role=switch:** NVDA announces `role="switch"` as "toggle button" in some versions. This is acceptable — the state ("pressed" / "not pressed") is still announced correctly. Not a cascade bug.

4. **VoiceOver + combobox:** Native `<select>` on macOS VoiceOver is announced as "pop-up button" — this is UA behavior, not a cascade bug. Cascade Dropdown uses `role="menu"` + `role="menuitem"`, not combobox; confirm role announcement matches expectation during testing.

---

## Next Steps

To populate real results, run the methodology from `at-methodology.md` on each stack. Record pass / partial / fail per cell as testing is completed. File issues for any `fail` cells. Re-test after fixes. Update this matrix with each release cycle.

Cells remain `not tested` until a contributor with the required environment (physical Windows or macOS machine with the screen reader installed) runs the protocol and records observations.
