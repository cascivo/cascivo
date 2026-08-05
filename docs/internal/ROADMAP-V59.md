# cascivo — Roadmap v59: Platform-Idiomatic Components — a `data-platform` Axis for iOS 26 and Material 3 Expressive

**Last updated:** 2026-08-05
**Status:** 🟡 Accepted, in progress — see "Decisions taken" below. T4 (the missing primitives) runs
**first**; the platform axis follows; the app runtime is out of scope permanently.
**Question asked:** _"What would it mean for cascivo to also build components like the mobile components
in iOS and Android — the way Ionic Framework does?"_
**Builds on:** the 12-theme semantic layer keyed on `[data-theme]` (`packages/themes/src/*.css` in
`@layer cascivo.theme`), the canonical layer order (`packages/tokens/src/layers.css`), the mobile-first
authoring rules already mandated in `CLAUDE.md` (canonical breakpoint scale, `--cascivo-target-min-coarse`,
"never hide content"), and the manifest → `registry.json` → MCP/llms regeneration chain.

> **Method.** Per CLAUDE.md "Think Before Coding": study the incumbents, verify every claim against what
> `main` already ships, then separate **already-done** from **genuine gap** from **does-not-fit** — and
> state the interpretations rather than silently picking one. Findings are tagged `C-n` (already
> covered / does not fit) and `M-n` (genuine gap, merits work).

---

## 0. The three things "mobile components" could mean

The request is ambiguous in a way that changes the size of the work by two orders of magnitude. Naming
the readings first, because picking one silently would be the expensive mistake:

| # | Reading | What ships | Rough size |
| - | ------- | ---------- | ---------- |
| **I1** | **Platform skin.** The 196 components already in the registry _look and move_ like iOS or like Android, selected by an attribute. | A CSS axis + a token contract. No new components. | 1 package, ~6 weeks |
| **I2** | **Mobile component set.** The ~7 primitives that a phone app needs and cascivo genuinely lacks (nav stack, large-title header, wheel picker, infinite scroll, reorder list, virtual list, list-header/note). | New registry components. | ~7 components |
| **I3** | **App runtime.** Router outlet, page stack with memory management, gesture-driven swipe-back, hardware back-button handling, Capacitor plugin bridge, status-bar/keyboard/haptics APIs. | A framework. | A different product |

**This proposal recommends I1 + I2 and explicitly rejects I3.** The reasoning is in §6; the short version
is that I3 is where Ionic actually lives, it requires owning routing and a native runtime, and it is
irreconcilable with cascivo's two load-bearing constraints — *"no config hell, no wrapper components, no
hidden magic"* and *owned code you copy-paste*. You cannot copy-paste a router outlet into someone's
project and have them own it.

---

## 1. The incumbents — what they actually are

Three frameworks were studied in depth. A note on selection: the historically obvious third pick,
**Onsen UI**, is not a credible comparison in 2026 — its last stable release is **2.11.2, January 2021**,
with a single active contributor and a shut-down community forum. **Quasar** is Vue-only and Material-only,
so it does not exercise the dual-platform problem. The three below are the ones with something to teach.

### 1.1 Ionic Framework — the reference implementation

The thing to actually learn from Ionic is not its component list; it is **`mode`**.

Ionic detects the runtime platform and writes a class + attribute onto the document root —
`<html class="md" mode="md">` — then scopes every component's platform-specific CSS behind
descendant selectors (`.ios ion-badge { … }`). iOS devices get `ios`, everything else including desktop
web gets `md`. Crucially, **platform ≠ mode**: mode is overridable in app config, per-app and per-component.
That separation — *the detected environment is a default, not a constraint* — is the single best idea in
the space, and it is the one this proposal steals wholesale.

The rest of Ionic is a bigger surface than a design system:

- **~100 components** across routing (`ion-router-outlet`, `ion-nav`, `ion-back-button`), layout
  (`ion-app`, `ion-content`, `ion-header`, `ion-footer`, `ion-split-pane`), inputs, overlays, and
  mobile-specific behaviour (`ion-refresher`, `ion-infinite-scroll`, `ion-item-sliding`, `ion-reorder`,
  `ion-picker-column`).
- **Web Components via Stencil**, with framework bindings (`@ionic/react`, `@ionic/vue`,
  `@ionic/angular`). Shadow DOM means styling reaches internals only through CSS custom properties and
  CSS Shadow Parts — Ionic 8.8's headline feature was *adding more `::part()` hooks* to Content, Datetime,
  Item, List, Range, Select and Toast, which tells you how constrained the styling surface had become.
- **Capacitor** as the native runtime — 80+ plugins for camera, filesystem, geolocation, haptics, push.
- **Behavioural ownership**: swipe-back gesture on `IonRouterOutlet` (`swipeGesture`), Android hardware
  back button, safe-area handling wired into `ion-header`/`ion-footer`/`ion-tabs`.

**Where it is weak, on the record.** WebView rendering costs it on complex list views and older devices;
the abstraction adds bundle weight and makes web-to-native debugging painful; Portals and Appflow are
paywalled. The Shadow DOM + `::part()` styling model is the structural version of the same complaint — you
customise through the holes the vendor drilled.

### 1.2 Framework7 — the fidelity benchmark

Actively maintained (**v9.1.2, July 2026**) and the highest-fidelity iOS reproduction in the space. Its
model is View → Router → Page: a hierarchical page stack with real per-platform transitions, driven by
CSS variables for theming, available for vanilla JS, React, Vue and Svelte. ~60+ components including
things nobody else bothers with — photo browser, wheel picker, text editor, smart select.

What Framework7 demonstrates is that **fidelity is mostly geometry and motion, not colour**. Its iOS theme
and Material theme share a colour system; what differs is corner radius, control height, list separator
insets, header layout, transition curve and gesture affordance. That observation is what makes I1
tractable at all — see §4.1.

Its cost is the mirror of Ionic's: to get the fidelity you adopt the whole framework, including its router
and its app shell. It is not a library you add to an existing React app.

### 1.3 Konsta UI — the architecturally closest analogue

Konsta is the most interesting comparison because it is the one that **deliberately does less**. From the
author of Framework7: 40+ pre-styled iOS + Material components for React/Vue/Svelte, an `App` component
that establishes the theme, `useTheme` to read it — and *no routing, no navigation stack, no gesture
handling, no Cordova/Capacitor story*. Its own docs position it as something you use *inside* a parent
framework like Ionic or Framework7.

That is almost exactly the I1 + I2 boundary this proposal draws. The instructive difference is
implementation: Konsta is **Tailwind-based**, so its platform switch resolves at build time into utility
classes, and consumers customise by editing markup. cascivo's constraints forbid Tailwind outright
(*"Modern CSS only — no Tailwind, no CSS-in-JS"*), and cascivo already has a runtime-switchable attribute
axis that Konsta lacks. So cascivo can do the same job with a strictly better mechanism: a CSS custom
property cascade under a cascade layer, switchable at runtime, scopable to a subtree.

### 1.4 Scoreboard

| | Ionic 8 | Framework7 v9 | Konsta UI | cascivo today |
| - | ------- | ------------- | --------- | ------------- |
| Platform switch | `mode` class on `<html>` | build/config theme | `App theme=` (Tailwind) | **none** |
| Component count | ~100 | ~60 | ~40 | **196** |
| Styling escape hatch | CSS vars + `::part()` | CSS vars | edit Tailwind classes | **owned source + tokens + `data-cascivo-*`** |
| Routing / page stack | ✅ owns it | ✅ owns it | ❌ | ❌ |
| Native runtime | ✅ Capacitor | ✅ Capacitor/Cordova | ❌ | ❌ |
| Shadow DOM | ✅ (constrains styling) | ❌ | ❌ | ❌ |
| SSR / RSC | partial | ❌ | partial | ✅ (`clientJs` tiers) |
| iOS 26 Liquid Glass | ❌ declined | ❌ | ❌ | ❌ |
| Material 3 Expressive | ❌ | ❌ | ❌ | ❌ |

---

## 2. Why now — the 2026 inflection

Both platform design languages re-based within 15 months of each other, and **every incumbent's "iOS
theme" is now visually stale**.

**Apple — Liquid Glass (iOS 26).** A system-wide redesign built on translucent materials, with reworked
navigation and tab bars. Apple requires apps to fully support it by **September 2026** — one month from
this document's date.

**Google — Material 3 Expressive (May 2025).** The headline is a **physics-based motion system**: springs
defined by stiffness/damping with Spatial and Effect token families, in two schemes (Standard and
Expressive), replacing duration+easing as the primary motion model. Plus 35 new shapes and shape morphing.

**And the incumbent declined the work.** Ionic has stated it is **not planning to ship an official Liquid
Glass theme**, aiming instead to provide *"the underlying architecture that enables developers to implement
these types of design systems themselves"* — deferred to Ionic 9. The iOS 26 feature request
(`ionic-team/ionic-framework#30466`) is open, unassigned, labelled `needs: investigation`, with no branch
or PR. Community CSS libraries and Capacitor plugins have filled the vacuum.

So the gap is specific and dated: **there is no maintained component library that ships a current iOS 26 or
Material 3 Expressive presentation.** That is the opening. It is also a warning — see §6.2 on the treadmill.

---

## 3. Verified against `main` — what cascivo already has

Checked against the working tree, not from memory.

### C-1 — Mobile-*responsive* is already mandated and enforced. Not the gap.

`CLAUDE.md` already requires mobile-first authoring: base styles target 320px, a canonical
`sm/md/lg/xl` breakpoint scale enforced by `pnpm breakpoint:check`, `@container` preferred over `@media`,
≥44px touch targets under `@media (pointer: coarse)` via `--cascivo-target-min-coarse` (10 component
stylesheets use it), and an explicit ban on `display:none`-on-mobile. `env(safe-area-inset-*)` is already
consumed by `alert-dialog`, `dock`, `fab`, `bottom-sheet`, `modal` and `action-sheet`.

**cascivo's components already work on a phone.** The gap is not *mobile* — it is *platform-idiomatic*.
Framing this correctly matters, because the naive version of this project ("make the components mobile
friendly") is already done and would produce a lot of motion with no product.

### C-2 — The mobile *overlay and navigation* primitives largely exist.

Mapping Ionic's mobile-specific surface onto the registry:

| Ionic | cascivo | Status |
| ----- | ------- | ------ |
| `ion-action-sheet` | `action-sheet` | ✅ |
| `ion-modal` (sheet/breakpoints) | `bottom-sheet` (detents, drag, `@starting-style`) | ✅ |
| `ion-tab-bar` | `dock` (safe-area aware) | ✅ |
| `ion-menu` | `drawer` | ✅ |
| `ion-segment` | `segmented-control` | ✅ |
| `ion-refresher` | `pull-to-refresh` | ✅ |
| `ion-item-sliding` / `ion-item-option` | `swipe-item` | ✅ |
| `ion-fab` / `ion-fab-list` | `fab` | ✅ |
| `ion-searchbar` | `search` | ✅ |
| `ion-chip` | `tag` | ✅ |
| `ion-loading` | `spinner` / `inline-loading` | ✅ |
| `ion-split-pane` | `app-shell` / `resizable` | ✅ |
| `ion-list` / `ion-item` | `list` / `item` / `contained-list` / `structured-list` | ✅ |

`bottom-sheet` in particular is already ahead of the field — detents, pointer-tracked drag with
`translate: 0 max(0px, calc(var(--_sheet-y) + var(--_sheet-drag)))`, `@starting-style` enter, and a
`[data-dragging]` transition kill-switch.

### M-1 — Seven mobile primitives are genuinely missing.

Verified absent from every package: `nav-stack`, `page`/`navbar`, `large-title`, `wheel-picker`/`picker`,
`infinite-scroll`, `reorder`/`sortable`, `virtual-list`. These are the I2 set. Notably **`large-title`**
(the iOS collapsing header) — Ionic implements it with JavaScript and an IntersectionObserver; CSS
scroll-driven animations do it on the compositor with **no JavaScript at all**, which is a direct,
demonstrable expression of cascivo's CSS-native thesis.

### M-2 — There is no platform axis, and no place to put one.

`data-theme` is the only presentational axis. It carries colour *and* geometry *and* motion, all in
`@layer cascivo.theme`. There is no way to say "iOS geometry, corporate colours" — which is exactly the
combination a real adopter wants.

### M-3 — Motion tokens cannot express springs.

`--cascivo-motion-enter` / `--cascivo-motion-exit` are duration+easing pairs. M3 Expressive's model is
stiffness/damping springs. CSS can express a spring — sample it into a `linear()` easing function — but
that is a generated token family that does not exist today.

### C-3 — Liquid Glass's translucency collides with a non-negotiable.

WCAG 2.2 AA is a hard floor in `CLAUDE.md`. `backdrop-filter` blur over arbitrary scrolling content gives
you no contrast guarantee, and `forced-colors: active` discards the effect entirely. This is not a blocker,
but it means every translucent surface needs an opaque fallback keyed on `prefers-reduced-transparency`,
`prefers-contrast` and `forced-colors` — and the existing `fallback:check` contract (static value first,
progressive value second) is the right shape to enforce it.

### C-4 — Routing, gestures-as-navigation, and the native bridge do not fit.

Swipe-back, hardware back button, page-stack memory management and Capacitor plugins all require owning
navigation. cascivo deliberately does not — it registers the *consumer's* link component via
`setLinkComponent()` precisely so it never has to. Any of these would also be `clientJs: 'required'`,
regressing the SSR/RSC story that the `clientJs` tiers exist to advertise. **These stay out.**

---

## 4. The proposal — a `data-platform` axis

### 4.1 The rule that keeps this linear instead of multiplicative

The entire proposal rests on one invariant, and it must be enforced mechanically or the matrix explodes:

> **Platform owns geometry, motion and interaction affordance.
> Theme owns colour.
> Neither writes the other's properties.**

| Axis | Owns | Example properties |
| ---- | ---- | ------------------ |
| `data-theme` (12 values) | colour, elevation tint | `--cascivo-color-*`, `--cascivo-shadow-*` |
| `data-platform` (3 values) | geometry, motion, affordance | `--cascivo-radius-*`, control block-size, list separator inset, `--cascivo-motion-*`, ripple vs highlight |

With that rule the two axes compose without a combinatorial surface: **12 + 3**, not 12 × 3. Without it,
you get 36 hand-maintained theme files and a `parity.test.ts` nobody can keep green. The §5 guard
(`platform:check`) exists to enforce exactly this — a platform stylesheet that sets a
`--cascivo-color-*` property fails the build.

The Framework7 study in §1.2 is what justifies believing the rule holds: iOS and Material fidelity really
does live in radius, height, separator inset, header layout and transition curve.

### 4.2 Mechanism

A new package, **`@cascivo/platform`**, mirroring `@cascivo/themes` exactly so there is nothing new to learn:

```
packages/platform/src/
  base.css        # declares the platform token contract with web-default values
  ios.css         # [data-platform='ios']       — iOS 26 / Liquid Glass
  material.css    # [data-platform='material']  — Material 3 Expressive
  web.css         # [data-platform='web']       — today's cascivo look, explicit
  all.css
  parity.test.ts  # every platform file defines the identical token set
```

```html
<html data-theme="dark" data-platform="ios">
```

Scoped to any subtree, same as `data-theme`. Absent attribute → `web`, so **every existing consumer is
byte-for-byte unaffected**. Runtime detection is *opt-in* and lives in userland or a one-line
`platformSignal()` in `@cascivo/react` mirroring the existing `themeSignal()` — never automatic. This is
Ionic's platform ≠ mode separation, kept.

### 4.3 Layer placement — the one architectural decision

The canonical order is `reset < base < tokens < component < theme < blocks < override`. Platform CSS must
beat component defaults (it is re-tuning geometry the component chose) but must **not** beat theme, or a
platform file could override brand colour. Given §4.1 forbids platform from writing colour at all, the
insertion is unambiguous:

```
cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.platform,
  cascivo.theme, cascivo.blocks, cascivo.override
```

This is a real migration with a known blast radius — the statement is emitted from
`packages/tokens/src/layers.css` (source of truth), `packages/cli/src/commands/create.ts` (scaffold),
`packages/mcp/src/server.ts`, `scripts/llms/generate.ts`, the `@cascivo/react` prepend, and is documented
in `docs/AI-RULES.md`, `docs/THIRD-PARTY-CSS.md` and `docs/CSS-LAYERS-PITFALL.md`. All of it is caught by
`layer-order.test.ts` if missed, which is the argument for doing it in one tranche with nothing else in it.

### 4.4 How a component participates

**A component reads platform tokens. It does not contain `[data-platform='…']` selectors.**

```css
/* ✅ button.module.css — unchanged structure, platform-aware values */
@layer cascivo.component {
  .button {
    border-radius: var(--cascivo-control-radius);
    min-block-size: var(--cascivo-control-height-md);
    transition: background-color var(--cascivo-motion-press);
  }
}
```

```css
/* ✅ platform/src/ios.css */
@layer cascivo.platform {
  [data-platform='ios'] {
    --cascivo-control-radius: 0.625rem;
    --cascivo-control-height-md: 2.75rem;
    --cascivo-motion-press: 120ms var(--cascivo-ease-ios-standard);
  }
}
```

The narrow exception is structural difference that no token can express — a Material ripple origin, an
iOS list separator inset from the label rather than the row edge. Those get a `[data-platform]` rule
**inside the platform package**, never inside the component, so a copy-pasted component stays
platform-agnostic and an adopter who never installs `@cascivo/platform` carries zero mobile CSS.

That last clause is the packaging requirement: **platform CSS is never in `styles.css`.** A web adopter
must not pay bytes for iOS geometry they will never render.

---

## 5. Tranches

Each tranche is independently shippable and independently revertible.

**T1 — The axis, with zero component changes.**
Insert `cascivo.platform` into the canonical order and every emitter. Create `@cascivo/platform` with
`base.css` declaring the token contract and `web.css` reproducing today's values exactly.
→ _Verify:_ `layers:check`, `unlayered:check`, `css-contract:check` pass; visual baselines are byte-identical
(proof the axis is inert when unused).

**T2 — The platform token contract.**
Author `ios.css` and `material.css` against the geometry/motion contract. Generate M3 spring `linear()`
easings (M-3). Author Liquid Glass translucency with mandatory opaque fallbacks under
`prefers-reduced-transparency` / `prefers-contrast` / `forced-colors` (C-3).
→ _Verify:_ new `platform:check` — (a) every platform file defines the identical token set; (b) **no
platform file sets any `--cascivo-color-*` property** (§4.1); (c) `fallback:check` on every translucent
declaration; (d) contrast assertions on the opaque fallbacks.

**T3 — Retrofit the twenty highest-value components.**
Button, Input, Textarea, Toggle, Checkbox, Radio, Slider, Select, Search, SegmentedControl, List/Item,
Card, Header, Modal, ActionSheet, BottomSheet, Dock, Alert, Toast, FAB — replace hardcoded geometry with
platform tokens. No structural change, no prop change, no manifest change beyond `tokens`.
→ _Verify:_ `computed:check`, `meta:check` (props-parity, style-hooks); visual baselines unchanged for
`web`; new baselines for `ios`/`material` on this set only.

**T4 — The missing primitives (M-1).**
In value order: `LargeTitleHeader` (scroll-driven, zero JS — the showcase), `ListHeader`/`Note`,
`InfiniteScroll`, `ReorderList`, `WheelPicker`, `VirtualList`. `NavStack` is deliberately last and may be
dropped — see §6.1.
→ _Verify:_ the standard component gate — `apg:check`, `primitives:check`, `dead-props:check`,
`client-js-parity`, mobile sweep at 320/360/390/414.

**T5 — The AI layer.**
Add `platforms?: ('web' | 'ios' | 'material')[]` to `ComponentMeta`, with a parity guard asserting a
declared platform really has rules in the platform package (both directions — the same shape as
`style-hooks` and `client-js-parity`). Regenerate `registry.json`, `llms/*`, `context/*`. Add a
`platform` argument to the MCP `scaffold` tool and a `get_platform_tokens` tool. Document in
`docs/PLATFORMS.md` and catalogue `platformSignal()` in `docs/HEADLESS.md` (required by
`primitive-docs.test.ts`).
→ _Verify:_ `pnpm regen && git diff --exit-code`; `meta:check`; `docs-routes`, `doc-urls`, `llms`.

**T6 — Proof, not claims.**
`apps/examples/mobile-app` — one phone-shaped demo, both platforms, running in a browser. Plus
`docs/USING-WITH-CAPACITOR.md` showing cascivo inside a Capacitor WebView with correct safe areas —
**as a guide, not as a dependency.** cascivo never imports Capacitor.
→ _Verify:_ `bare-page:check`, `framework-matrix` (no ✅ without a real example app or CI job).

---

## 6. Costs, risks, and the case against

Stating these plainly, because the go/no-go turns on them more than on the design.

### 6.1 `NavStack` is the thin end of I3

A page stack with platform transitions is the single most requested thing in this space and the reason
people reach for Ionic. It is also the component that drags routing in behind it. A version that only
animates between children the consumer controls — no routing, no history, `clientJs: 'required'`, using
the View Transitions API — is defensible. **A version that owns history is not, and would break the
copy-paste ownership model.** If T4 cannot hold that line, drop `NavStack` and ship the other six.

(Relevant constraint: `@view-transition` cross-document is Chromium-only — Firefox 144 and Safari 18
ignore the at-rule — so any transition work must degrade to an instant swap, not a broken one.)

### 6.2 The visual-QA surface multiplies, and it is already large

`visual-baselines:check` requires a committed PNG per (component × theme) — 3 themes × 192 components
= **576 baselines today**. Adding two platforms to even the T3 subset of 20 components adds 120 more, and
a naive "all components × all platforms" reading would take the total past 1,700. T3 is deliberately
scoped to twenty components for this reason, and the baseline matrix must stay explicitly
enumerated rather than derived — otherwise the nightly Visual regression workflow rots red, which is
exactly the failure the guard was written to prevent.

### 6.3 The fidelity treadmill

Shipping "iOS 26 accurate" is a standing commitment to re-chase Apple and Google annually. Ionic — with a
funded team — looked at that commitment and declined it. cascivo should only take it on if the platform
token contract is genuinely thin (§4.1), so an OS refresh is a values edit in two files rather than a
sweep across 192 components. **If T2 cannot be authored without touching component source, the invariant
is wrong and the project should stop there.**

### 6.4 The honest counter-argument

cascivo is a *web* design system whose thesis is modern CSS, signals, and AI-legible manifests. iOS/Material
skinning is orthogonal to all three. The strongest case against is that this is a **different product**
wearing the same package name, and that the same effort spent on the accessibility conformance report and
the theme-builder handoff already in `ROADMAP.md` compounds for every adopter rather than for the subset
shipping phone apps.

The counter to the counter is §2: the timing is unusually good, the incumbent has publicly stepped back,
and — uniquely — cascivo can implement the platform axis *without a runtime*, because it has a runtime
attribute cascade where Konsta has build-time utility classes and Ionic has Shadow DOM. If the answer is
ever yes, it is yes now.

---

## 7. Decisions taken

Answering §0 and §7's three questions, 2026-08-05:

**I2 — the seven primitives: accepted, and promoted to first.** The original tranche order put T4
after the axis; that was wrong. `InfiniteScroll`, `VirtualList`, `ListHeader`/`Note` and `ReorderList`
are justified without reference to iOS or Android at all — they are gaps against shadcn and Carbon in a
196-component system, so none of the work can be stranded by a later decision on the axis.
`LargeTitleHeader` leads because it is the clearest demonstration of the CSS-native thesis: Ionic drives
the same collapse with JavaScript and an IntersectionObserver, and a scroll-driven animation does it on
the compositor with `clientJs: 'none'`.

**I3 — the app runtime: rejected, permanently.** Recorded here so `NavStack` scope creep has something to
be measured against. cascivo already delegates navigation to the consumer's router via `setLinkComponent()`;
I3 reverses a deliberate architectural stance rather than filling a gap. No routing, no page-stack memory
management, no hardware back-button handling, no Capacitor plugin bridge — in this roadmap or a successor.

**I1 — the platform axis: the mechanism is accepted, the fidelity skins are not yet.** §6.4's counter-argument
stands and is not answered by §2's market timing: someone who needs pixel-accurate iOS 26 chrome is building a
hybrid app and would still need Ionic or Framework7 for the router and the native bridge, both of which ship a
skin too. What survives that critique is the axis itself — `data-theme` today conflates colour, geometry and
motion across 12 themes, so "corporate colours, compact geometry" is not expressible, and that is a real
limitation for adopters who will never render an iOS control.

So T1 ships (it is nearly inert), and **T2 is a time-boxed spike whose deliverable is a yes/no on the §4.1
invariant, not a shipped `ios.css`.** No public commitment to iOS 26 fidelity until that spike returns. If the
invariant holds the skins become cheap and can be decided then with better information; if it does not, §6.3
already says stop — one tranche spent instead of four.

**What would change the I1 answer:** evidence of adopter demand. `ROADMAP.md` notes that real integration
reports have shaped several items; a report asking for platform-idiomatic presentation outweighs the reasoning
above, because it replaces market timing with evidence. None was found in the repository — the issue tracker
was not searched.

### Implementation log

- **2026-08-05 — T4.1 `LargeTitleHeader` shipped.** `clientJs: 'none'`: the collapse is a CSS scroll-driven
  animation, so the header is complete in server-rendered HTML and never hydrates. The title is a real
  `h1`–`h3`; the copy mirrored into the sticky bar is `aria-hidden`, so it is announced once. Degrades on two
  axes — where `animation-timeline` is unsupported the mirror stays hidden and the header is a plain sticky bar
  above a heading, and under `prefers-reduced-motion` the reveal snaps via `steps(1, jump-end)` instead of
  interpolating.

  **It owns the scroll container, and that was not the first design.** The header initially rendered a wrapper
  with the bar `position: sticky` inside it, on the assumption that the consumer's scrolling region would be the
  ancestor. It is not: sticky is bounded by its containing block, so a bar nested in a short header wrapper
  unsticks the moment the wrapper scrolls out — the bar has to be a **direct child of the scroller**. jsdom
  evaluates neither `position: sticky` nor `animation-timeline`, so every unit test passed against the broken
  version and the scroll-0 visual baseline was pixel-identical to the fixed one; it was caught only by driving
  a real Chromium, scrolling, and reading computed styles. Taking ownership of the scroll container (the shape
  `PullToRefresh` already uses, and Ionic's `ion-content`) makes both the sticky bar and the
  `scroll(nearest block)` timeline correct by construction rather than by instruction.

  **Verified in Chromium**, since no committed test can assert it: at `collapseDistance: 48` the mirror reads
  opacity `0.00` at scroll 0, `0.50` at scroll 24, `1.00` at scroll 200, the hairline interpolates over the same
  range, and the bar's offset from the scroller top stays `0` throughout.

- **2026-08-05 — T4.2 `ListHeader`/`Note` dropped, not built.** Re-verified against `main` before writing
  it: `ContainedList` already ships a labelled header with an action slot — that is `ion-list-header` — and
  `ItemDescription` covers `ion-note`'s secondary-text role. The M-1 list in §3 was wrong to include it;
  this entry is C-2, already shipped. Building it would have duplicated two existing components.

- **2026-08-05 — T4.3 `InfiniteScroll` shipped.** Renders a real button and auto-activates it with an
  `IntersectionObserver`, rather than the bare sentinel Ionic uses — so the next page is reachable by
  keyboard and by screen reader, not only by scrolling. Re-entry is guarded on a loading flag, so a sentinel
  still in view after a short page cannot loop. Per the CLAUDE.md reactivity rule, the observer callback
  reads plain refs (it fires outside the tracking scope, where a signal would be redundant and a tick stale).
  The nested `Spinner` is `aria-hidden`: it carries its own `role="status"`, so leaving it live announced
  the loading state twice.

- **2026-08-05 — T4.4 `ReorderList` shipped.** Fully keyboard-operable reordering — Space/Enter to pick up,
  Arrows to move, Space/Enter to drop, Escape to restore the order captured at pick-up — which is exactly
  what pointer-only `ion-reorder` has no equivalent for. Every transition is announced through a polite
  live region with the item name and its position out of the total. Pointer drag reflows rows as the
  pointer crosses their midpoints, so there is no ghost element to keep in sync. `onValueChange` follows
  the array-valued convention already set by `TagsInput` and `MultiSelect`.

- **2026-08-05 — T4.5 `VirtualList` shipped**, taken ahead of `WheelPicker` because it is a gap that stands
  regardless of the platform axis, where `WheelPicker` is purely platform-idiomatic. Fixed row height keeps
  positions arithmetic rather than measured. Each rendered row carries `aria-setsize`/`aria-posinset` for
  the **full** collection, so AT announces "row 3 of 10000" rather than the size of the rendered window —
  the defect that makes naive virtualization unusable with a screen reader. Writing the tests exposed that
  deriving the window end from a clamped start widened it by the whole overscan at the top of the list;
  the range is now anchored on the first visible row.

---

## 8. What this proposal needs

All three questions are answered in §7. What remains open is the one §7 deliberately left open: whether the
§4.1 invariant survives contact with a real `ios.css`. T2 is the experiment that settles it, and this document
is the record either way — of why the skins were cheap, or of why the project was stopped.

Remaining T4: `WheelPicker`. `NavStack` stays last and droppable per §6.1.

---

## Sources

- [Ionic — Platform Styles](https://ionicframework.com/docs/theming/platform-styles) · [UI Components](https://ionicframework.com/docs/components) · [ionic-framework on GitHub](https://github.com/ionic-team/ionic-framework)
- [Announcing Ionic Framework 8.8](https://ionic.io/blog/announcing-ionic-framework-8-8) · [feat: ios 26 style support #30466](https://github.com/ionic-team/ionic-framework/issues/30466)
- [Framework7 Documentation](https://framework7.io/docs/) · [framework7 releases](https://github.com/framework7io/framework7/releases)
- [Konsta UI — React](https://konstaui.com/react) · [Konsta vs Framework7 discussion](https://github.com/konstaui/konsta/discussions/107)
- [Onsen UI release history](https://changelogs.md/github/onsenui/onsenui/) · [Onsen UI — LFX Insights](https://insights.linuxfoundation.org/project/onsenui-onsenui)
- [M3 Expressive — New Motion System](https://m3.material.io/blog/m3-expressive-motion-theming) · [Material Design 3 — Motion](https://m3.material.io/styles/motion/)
- [iOS 26 & Liquid Glass design](https://support.spotme.com/hc/en-us/articles/49966586899475-New-iOS-26-Liquid-Glass-design) · [Most iOS 26-accurate CSS library for Ionic](https://medium.com/@rdlabo/introducing-the-most-ios-26-accurate-css-library-for-web-development-1ee5a5433dbf)
- [MDN — View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) · [MDN — `@view-transition`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition)
- [MDN — CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
- [Ionic Review (2026) — MakerStack](https://makerstack.co/ionic-review/) · [Ionic vs React Native 2026](https://www.thefrontendcompany.com/posts/ionic-vs-react-native)
