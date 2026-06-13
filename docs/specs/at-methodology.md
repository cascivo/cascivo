# Assistive-Technology Testing Methodology

## 1. Overview

This document defines cascade's assistive-technology (AT) testing methodology.

Testing covers a **representative subset** of components — one per APG pattern plus high-risk overlay components — not all components in the system. This is explicitly representative, not exhaustive. Components not in the representative set are considered lower-risk; they follow the same APG patterns and inherit AT compatibility from those patterns.

AT testing in this environment is **manual only**. Results cannot be captured headlessly or in CI. Any cell in the results matrix (`at-matrix.md`) that was not run against a given stack is marked `not tested` — this indicates the stack was unavailable, not that the test passed.

---

## 2. Test Stacks

| Stack | Screen reader | Browser | Platform | Role |
|---|---|---|---|---|
| NVDA + Firefox | NVDA 2024.x | Firefox | Windows | Primary |
| NVDA + Chrome | NVDA 2024.x | Chrome | Windows | Secondary |
| JAWS + Chrome | JAWS 2024 | Chrome | Windows | Secondary |
| VoiceOver + Safari | VoiceOver | Safari | macOS | Primary |
| VoiceOver + iOS | VoiceOver | Safari | iOS 17 | Stretch |

**Primary** stacks must be run before a component is considered AT-reviewed. **Secondary** stacks are run where capacity allows. **Stretch** stacks are aspirational for the current cycle.

---

## 3. Per-Component Test Protocol

For each component under test, on each applicable stack, perform the following steps in order. Record pass / fail / not tested per step per stack in `at-matrix.md`.

### Step 1 — Navigate to component

Use the AT's browse/reading mode to reach the component:

- **NVDA**: arrow keys (browse mode); Tab to reach interactive elements
- **JAWS**: arrow keys, or H (headings) / B (buttons) / F (form fields) for quick nav
- **VoiceOver macOS**: VO+arrow to navigate; VO+Shift+M for menu; Tab for interactive elements
- **VoiceOver iOS**: swipe right to advance through elements

**Pass criterion**: AT reaches the component without skipping it or announcing it as plain text.

### Step 2 — Confirm role announcement

**Pass criterion**: AT announces the ARIA role matching the component's `accessibility.role` from its `component.meta.ts` (e.g., "button", "checkbox", "dialog", "tab").

### Step 3 — Confirm name announcement

**Pass criterion**: AT announces an accessible name — the visible label text, `aria-label`, or the target of `aria-labelledby`. Anonymous interactive elements (no name) are a fail.

### Step 4 — Confirm state announcement

**Pass criterion**: AT announces all relevant states at the time of focus:

- Checkbox / Radio / Toggle: "checked" or "unchecked"
- Accordion / Dropdown: "expanded" or "collapsed"
- Tabs: "selected" (active tab)
- Disabled controls: "dimmed" (VoiceOver) or "unavailable" / "grayed" (NVDA/JAWS)
- Modal: "web dialog" or equivalent

### Step 5 — Verify keyboard interaction

Test each key listed in `accessibility.keyboard` in the component's `component.meta.ts`. All APG-required keys must produce the expected behavior:

- **Enter / Space**: activate buttons, checkboxes, toggles, accordion triggers
- **Arrow keys**: move within radio groups, tab lists, sliders, menus
- **Escape**: close modals, dropdowns, tooltips
- **Home / End**: jump to first/last in sliders, menus where applicable

**Pass criterion**: Every listed key produces its documented effect.

### Step 6 — Verify state changes are announced after interaction

After pressing a key that changes state, AT must announce the new state without requiring the user to re-navigate to the element.

**Pass criterion**: AT announces the updated state (e.g., "checked", "expanded", "Tab 2, selected") immediately following the interaction.

### Step 7 — Verify no AT traps

**For non-modal components**: Tab and Shift+Tab must exit the component. AT must not become stuck cycling within the component's internal tab stops.

**For Modal**: Focus must be trapped inside the dialog. Tab cycles through focusable elements within the modal only. Shift+Tab wraps to the last focusable element. Escape closes the modal and returns focus to the trigger. `aria-modal="true"` must be set so VoiceOver respects the trap.

**Pass criterion**: Focus behaves as described for the component type.

---

## 4. Representative Set

The table below lists the components selected for AT review. Selection criteria:

- One component per distinct APG pattern (validates the pattern implementation)
- All overlay / live-region components regardless of pattern (highest interaction risk)
- Components with custom keyboard handling not covered by APG patterns

| APG Pattern | Component | Risk | Rationale |
|---|---|---|---|
| button | Button | High | Most common interactive element; baseline for all patterns |
| checkbox | Checkbox | High | Tristate potential; state announcement critical |
| radio | Radio | High | Arrow-key group navigation; `role="radiogroup"` required |
| switch | Toggle | Medium | `role="switch"` vs `role="checkbox"` AT variance |
| slider | Slider | Medium | Custom arrow-key handling; value announcement |
| tabs | Tabs | High | Arrow-key navigation; selected state; panel association |
| accordion | Accordion | Medium | Expanded/collapsed state; `aria-controls` association |
| dialog-modal | Modal | High | Focus trap; `aria-modal`; return-focus on close |
| menu | Dropdown | High | `role="menu"` + `role="menuitem"`; arrow nav; Escape |
| tooltip | Tooltip | High | `role="tooltip"`; `aria-describedby`; hover + focus trigger |
| — | Toast | High | Live region (`role="status"` or `aria-live`); no focus required |
| — | Chart (BarChart) | Medium | Custom keyboard; `role="img"` or table fallback; description |

### Components excluded from the representative set

**Native elements** — AT compatibility is provided by the browser, not cascade:

- Input, Textarea, Select

**Display-only, no interaction** — no keyboard test needed; role and name still verified visually:

- Avatar, Badge, Card, Separator, Spinner

These components are not lower priority for correctness — they are lower priority for AT keyboard testing specifically because they have no keyboard interaction surface.

---

## 5. Known Environment Constraints

AT testing requires a physical Windows or macOS machine with the screen reader installed and configured. It cannot run in CI or Docker.

**Implications:**

- Results in `at-matrix.md` reflect manual testing sessions run by contributors who have the required environment.
- Cells marked `not tested` mean the stack was unavailable during the testing cycle, not that the component passed or failed on that stack.
- The Windows stacks (NVDA, JAWS) require a licensed Windows environment. NVDA is free; JAWS requires a license.
- VoiceOver on iOS requires a physical iOS 17+ device.

**Recommended testing workflow:**

1. Run the docs app locally (`pnpm dev --filter @cascade-ui/docs`).
2. Navigate to the component's page in Storybook or the docs app.
3. Enable the AT and run each step in Section 3 against each Primary stack.
4. Record results in `at-matrix.md` immediately.
5. Retest on Secondary stacks where available.

**When AT testing is triggered:**

- New component added to the representative set
- `accessibility.role`, `accessibility.keyboard`, or ARIA attributes changed in an existing component
- CSS changes that affect focus visibility or `data-state` attributes used in ARIA mappings
