# Assistive-Technology Support Matrix

## Introduction

This matrix records assistive-technology (AT) test results for the representative component set defined in `at-methodology.md`. Testing was performed manually; stacks not available in the current environment are marked `not tested`. Results are point-in-time — re-run when components change.

---

## Result Key

| Symbol       | Meaning                                                              |
| ------------ | -------------------------------------------------------------------- |
| ✅ pass      | Role, name, state announced correctly; all APG keys work as expected |
| ⚠️ partial   | Most criteria pass; one quirk noted (e.g. double-announcement)       |
| ❌ fail      | One or more required announcement or key missing                     |
| — not tested | Stack unavailable in test environment                                |

---

## Test Stacks

| Column           | Screen Reader | Browser | Platform |
| ---------------- | ------------- | ------- | -------- |
| NVDA+Firefox     | NVDA 2024.x   | Firefox | Windows  |
| NVDA+Chrome      | NVDA 2024.x   | Chrome  | Windows  |
| JAWS+Chrome      | JAWS 2024     | Chrome  | Windows  |
| VoiceOver+Safari | VoiceOver     | Safari  | macOS    |

---

## Results

| Component       | NVDA+Firefox | NVDA+Chrome  | JAWS+Chrome  | VoiceOver+Safari |
| --------------- | ------------ | ------------ | ------------ | ---------------- |
| Button          | — not tested | — not tested | — not tested | — not tested     |
| Checkbox        | — not tested | — not tested | — not tested | — not tested     |
| Radio           | — not tested | — not tested | — not tested | — not tested     |
| Toggle (switch) | — not tested | — not tested | — not tested | — not tested     |
| Slider          | — not tested | — not tested | — not tested | — not tested     |
| Tabs            | — not tested | — not tested | — not tested | — not tested     |
| Accordion       | — not tested | — not tested | — not tested | — not tested     |
| Modal           | — not tested | — not tested | — not tested | — not tested     |
| Dropdown        | — not tested | — not tested | — not tested | — not tested     |
| Tooltip         | — not tested | — not tested | — not tested | — not tested     |
| Toast           | — not tested | — not tested | — not tested | — not tested     |
| BarChart        | — not tested | — not tested | — not tested | — not tested     |

---

## Known AT Quirks

These are documented quirks from published ARIA APG research that implementers should watch for when running real tests. They are not confirmed cascade bugs — they are known screen-reader behaviors that testing should verify or rule out.

1. **JAWS + Modal:** JAWS requires `aria-modal="true"` on the dialog element to engage virtual-buffer suspension. Cascade Modal sets this. Verify during testing whether the dialog title is double-announced on focus entry.

2. **VoiceOver + aria-live:** VoiceOver can miss rapid `aria-live="polite"` updates if they fire within ~50ms of each other. Cascade chart tooltip uses a single live region updated on ArrowKey — this should be fine, but confirm during testing that value announcements are not dropped.

3. **NVDA + role=switch:** NVDA announces `role="switch"` as "toggle button" in some versions. This is acceptable — the state ("pressed" / "not pressed") is still announced correctly. Not a cascade bug.

4. **VoiceOver + combobox:** Native `<select>` on macOS VoiceOver is announced as "pop-up button" — this is UA behavior, not a cascade bug. Cascade Dropdown uses `role="menu"` + `role="menuitem"`, not combobox; confirm role announcement matches expectation during testing.

---

## Automation

NVDA (Windows) and VoiceOver (macOS) are now driven in CI by guidepup — see
`.github/workflows/a11y-at.yml` and `apps/storybook/scripts/at-sweep.mjs`. Each
nightly run walks every component's Storybook story, records the spoken phrases,
and writes a first-pass grade (`pass` when the expected role/state is announced,
`partial` when something is announced but the keyword is missing, `fail` on
silence) into `apps/site/src/marketing/pages/accessibility/at-results.json`. The
accessibility page renders that file; until a run lands and is committed, every
cell reads `pending`.

The grade is a regression guard, not a substitute for lived AT use — a human
reviews the logged phrases and confirms/adjusts each cell. JAWS is licensed and
cannot run on hosted runners, so the `JAWS+Chrome` column stays a manual
spot-check using the methodology below.

## Next Steps

Run the methodology from `at-methodology.md` for the manual JAWS column and to
confirm the automated NVDA/VoiceOver grades. Record pass / partial / fail per
cell, file issues for any `fail`, re-test after fixes, and refresh each release.
