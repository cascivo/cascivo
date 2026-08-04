---
'@cascivo/react': minor
---

Rebuild `Accordion` and `Collapsible` on native `<details>`/`<summary>`.

Both were hand-rolled signal state machines: a `<button>` carrying `aria-expanded` and
`aria-controls`, next to a panel CSS collapsed to zero height. With JavaScript disabled the
panels were in the DOM but could never be opened — the content was unreachable. Both are now
`clientJs: 'enhancement'`: the open panel renders at first paint, the disclosure works with
JS off, and find-in-page expands a collapsed section for free.

The button role, the expanded state, and Enter/Space activation now come from the platform
rather than from ARIA. `role="region"` and `aria-labelledby` on the panel stay — they are
additive and do not collide with native semantics.

**Breaking — the rendered DOM changed.** The public component API is unchanged, so no markup
you write needs editing, but anything reaching _into_ these components does:

| Before                                       | After                                 |
| -------------------------------------------- | ------------------------------------- |
| `<div class="item">` wrapping the pair       | `<details class="item">`              |
| `<h3><button class="trigger">`               | `<summary class="trigger"><h3>`       |
| `aria-expanded` on the trigger               | native; the attribute is gone         |
| `AccordionTrigger` ref → `HTMLButtonElement` | ref → `HTMLElement` (the `<summary>`) |

- **Tests** querying `getByRole('button', { name })` or asserting `aria-expanded` must read
  `details.open` instead. Note that jsdom exposes neither the button role nor `aria-expanded`
  for a `<summary>`, and does not activate one on Enter/Space — all three are jsdom gaps, not
  behaviour changes; real browsers do all of it.
- **CSS** selecting `.trigger` or `[data-state]` still works — both are preserved — but a
  selector written against the `<button>`/`<div>` element names needs updating.
- `Collapsible`'s `disabled` is now enforced in the enhancement layer (`aria-disabled` plus a
  cancelled click), because `<details>` has no native disabled state. With JS off, a disabled
  `Collapsible` is still operable. That is an honest degradation of a prop that never had a
  platform equivalent.

`type="single"` additionally emits `<details name>`, so exclusivity survives with JS off. The
JS exclusivity logic is retained rather than delegated to the browser, since it is what
actually drives state once hydrated.

Open/close animates via `::details-content` (Baseline since September 2025) with
`content-visibility` sequenced by `transition-behavior: allow-discrete`; `calc-size()` layers
on as a Chromium-only enhancement behind a static fallback, so Firefox and Safari snap open
instead of sliding.

The platform behaviour is covered by a new browser canary (`pnpm no-js:check`) that mounts
server HTML, never hydrates it, and drives it with a real keyboard — proving the base layer
works with no JavaScript at all, which no jsdom test structurally can.
