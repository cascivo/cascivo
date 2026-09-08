# An email render target for cascivo

**Status: implemented, Phases 1–4** (Phase 4 less the registry and MCP integration; Phase 5
is a release-time manual pass by nature). Shipped: `@cascivo/email` — the token resolver, the
vendored conformance oracle, twenty table-based primitives, `renderEmail`, three templates,
the client simulator, React Email interop — plus `apps/email-preview`, twelve visual
baselines, and the guards behind `pnpm email:check`.

The findings in §1 were measured against the tree on 2026-09-08 and are unchanged. §11 records
what building it corrected in the design below, and what is still outstanding.

**Origin:** [React Email](https://react.email/) (Resend, MIT) — "build and send emails using
React". An adopter using it alongside cascivo asked whether cascivo could render email content
itself. This document answers: yes, but not by any transform of the existing components.

**Scope:** a new `@cascivo/email` package (authored primitives + renderer), a resolved-token
pipeline, an `apps/email-preview` dev app that doubles as the test fixture, and four offline
test layers. Explicitly **out of scope**: charts in email, a send/provider integration, and any
paid rendering service.

**Constraints accepted up front,** as stated by the project owner:

1. **No third-party service** for client testing. Tradeoffs are acceptable; a vendor bill is not.
2. **Output size must be minimal and provably so** — not merely small, but visible and enforced.
3. **Browser preview at multiple screen sizes ships from the beginning**, not as a later phase.

---

## 1. Verified findings

Measured against `packages/components/src` (143 `*.module.css` files) and `registry.json`
(198 components, 12 blocks, 3 templates) unless noted.

### 1.1 No component CSS survives an email client [verified]

Counts are files containing the feature, out of 143:

| Feature | Files | Email status |
| --- | ---: | --- |
| `var(--…)` | 141 | Unsupported in Gmail and Outlook Windows |
| logical properties (`padding-inline`, `margin-block`, …) | 110 | Email needs physical `left`/`right` |
| `gap:` | 100 | Unsupported in Outlook Windows |
| `display: flex` | 94 | ~56% client support; absent in Outlook 2007–2019 |
| `@media` | 67 | Not inlinable — must be hoisted to a `<style>` block |
| `position: absolute` | 45 | Unreliable across clients |
| `@supports` | 16 | Unsupported |
| `display: grid` | 16 | Unsupported |
| `:has()` | 15 | Unsupported |
| `color-mix()` | 13 | Unsupported |
| `@container` | 9 | Unsupported |
| `clamp()` | 5 | Unsupported |

**Only 4 of 143 files use none of** flex / grid / `gap` / `var(--` / `@media` / `@container` /
`:has()`. So 139 of 143 stylesheets contain at least one feature that fails in a major client.

Three further structural blockers:

- Every component is a **CSS Module** — hashed class names in an external stylesheet, wrapped in
  `@layer cascivo.component`. The layer cascade (`reset < base < tokens < component < theme <
blocks < override`, `packages/tokens/src/layers.css`) has no email analogue: with no layer
  support, everything is unlayered and specificity is all that remains.
- Theme tokens are **`oklch()`** throughout `packages/themes/src`. Unsupported. They must resolve
  to sRGB hex at build time.
- The aggregate stylesheet is **~328 KB** (`scripts/checks/css-contract.test.ts:31`). Gmail clips
  at ~102 KB. Shipping the stylesheet is not an option at any size discount.

**Conclusion: the component TSX and CSS are not reusable, and no transform derives email markup
from them.** A flex row must become `<table role="presentation"><tr><td>`; that shape is not
recoverable from the source.

### 1.2 Most of the catalog has no email meaning anyway [verified]

By `meta.clientJs` across all 213 registry entries:

| Tier | Count |
| --- | ---: |
| `none` | 70 |
| `enhancement` | 67 |
| `required` | 61 |
| unclassified | 15 |

Email has no JavaScript, so `required` is out entirely and `enhancement` degrades to its base
layer. Only the 70 `clientJs: 'none'` entries have any conceptual mapping — and of those, perhaps
20 correspond to something a transactional email actually contains (Button, Card, Heading, Text,
Link, Separator, List, Badge, Avatar, Stat, `section/hero`, `section/cta`, `section/page-footer`,
`layout/columns`, `layout/section`, `layout/spacer`, `layout/center`).

The field is defined at `packages/core/src/types.ts:132` and is already the right discriminator —
it does not need extending for this purpose.

### 1.3 A renderer-agnostic UI spec already exists [verified]

`packages/render/src/types.ts:37` defines `ViewConfig`: a serializable JSON component tree
(`ComponentNode` at `:26` — `{ component, props, bind, events, children }`) with i18n `$t` refs
and `$data`/`$state` binding. `packages/render/src/component-map.ts` maps **112** component names
onto `@cascivo/react` implementations, and is explicitly hand-maintained.

This is the asset that makes an email target strategically interesting rather than merely
possible: the same JSON can drive two renderers.

### 1.4 The SSR path is already proven [verified]

`packages/react/package.json` exposes a `node` export condition (`./dist/node/index.js`) — the
CSS-free twin guarded by `css-contract:check`. `packages/react/vite.config.ts:225` documents that
there is deliberately **no** blanket `'use client'` banner, so per-file directives survive. An
email renderer running under Node has a supported entry point today.

### 1.5 Token resolution is already half-done, by hand [verified]

`packages/theme-kit/src/css.ts:11` (`BASE_LIGHT`) and `:61` (`BASE_DARK`) carry hand-copied
"resolved concrete values from `packages/themes/src/light.css` + primitives". That is exactly the
resolution step the email target needs — but duplicated by hand, still in `oklch()`, and covering
two themes of twelve. A real resolver would subsume it.

### 1.6 Assets are SVG-only [verified]

`packages/icons/src/single` contains **444** icon components, all inline SVG. Outlook Windows does
not render SVG. Charts (`chart/sparkline`, `chart/kpi`, `chart/meter`) are SVG/DOM likewise.

### 1.7 The testing idioms this needs already exist in the repo [verified]

- `apps/site/test/visual.spec.ts` — screenshot tests derived from `registry.json`, 3 themes per
  component, committed PNG baselines, `maxDiffPixelRatio: 0.03`
  (`apps/site/playwright.config.ts`), clock and timezone pinned for determinism.
- `scripts/checks/visual-baselines.test.ts` — guards baseline coverage in both directions so a
  rename cannot orphan a PNG.
- `scripts/checks/sparkline-subpath-size.test.ts` — a committed byte budget measured against the
  real built artifact, with the failure mode documented in the header.
- `scripts/checks/css-fallback.ts` (`fallback:check`) — asserts a static fallback declaration
  immediately precedes a progressive one.

Each maps directly onto something the email target needs. Nothing here has to be invented.

### 1.8 What React Email actually provides [verified by documentation]

Three layers:

1. **~15 primitives** — `Html`, `Head`, `Body`, `Container`, `Section`, `Row`, `Column`, `Text`,
   `Heading`, `Button`, `Link`, `Img`, `Hr`, `Preview`, `Markdown` — rendering table-based markup
   with inline styles. `Section`/`Row`/`Column` are `<table><tbody><tr><td>`; the long-running
   [issue #309](https://github.com/resend/react-email/issues/309) about `Column` inside `Section`
   emitting extra `<td>`s exposes the table machinery directly.
2. **`render()`** — `renderToStaticMarkup` plus an XHTML Transitional doctype, MSO conditional
   comments, `target="_blank"` on links, and optional `plainText` (via `html-to-text`) and
   `pretty`.
3. **`<Tailwind>`** — a class-to-inline-style inliner. Documented holes: media queries cannot be
   inlined, complex selectors (`space-*`, the typography plugin) are unsupported, and
   `pixelBasedPreset` exists because `rem` is not universally supported.

It is a rendering library, not a design system. That is the gap cascivo would fill.

---

## 2. What is reusable

| Asset | Reusable? | Note |
| --- | --- | --- |
| Component TSX | **No** | DOM shapes are incompatible (§1.1) |
| Component CSS | **No** | 139/143 files contain a fatal feature |
| `@cascivo/core` signals / FSM | **No** — and irrelevant | Email is static. `@cascivo/email` gets a near-zero runtime dependency footprint as a result. |
| Design tokens | **Yes, after resolution** | oklch → sRGB, `var()` flattened, per theme |
| `ComponentMeta` manifest | **Yes** | New `category: 'email'`; all AI surfaces regenerate |
| `ViewConfig` JSON spec | **Yes** | Second renderer target (§1.3) |
| Registry / CLI / MCP / docs plumbing | **Yes** | `cascivo add email/<name>` needs no new machinery |
| `@cascivo/i18n` catalogs | **Yes** | Same `t(builtin.…)` contract |
| Playwright + baseline + budget idioms | **Yes** | §1.7 |
| a11y guard suite (APG, focus, roving) | **No** | Email a11y is a different, smaller checklist |

---

## 3. Architecture decision

| Option | Shape | Verdict |
| --- | --- | --- |
| **A.** Emit React Email JSX | cascivo spec → `@react-email/components` | Cheapest, but cedes the design system to another project's primitives and adds a heavy dependency. Keep as an **interop escape hatch**, not the product. |
| **B.** Email twin of the catalog | Email variant of all 70 static components | Too large; most have no email meaning; violates one-manifest-one-truth. |
| **C.** Small authored primitive set + shared spec | ~20 email primitives, plus `ViewConfig` → email renderer | **Chosen.** Bounded scope, fits the existing architecture, and delivers something React Email structurally cannot. |

The product claim under C must be worded precisely. **Not** "cascivo components, for email" — that
promise cannot be kept and would generate support load indefinitely. The claim is:

> **cascivo tokens and the cascivo spec, rendered for email.** The design language carries over;
> the components are a deliberately smaller, email-native set.

The differentiator, stated plainly: **one `ViewConfig` renders to both the product UI and a themed
transactional email, from one design system.** No other tool in this space does that.

---

## 4. Limitations

### 4.1 Hard and unavoidable

1. **A second component catalog.** ~20 primitives, each with tsx + `.meta.ts` + snapshot tests +
   docs. Authored, not generated.
2. **No JavaScript.** 61 `required` entries are out; 67 `enhancement` degrade. CSS-only disclosure
   (the checkbox hack) works in roughly Apple Mail alone and is not worth shipping.
3. **No runtime theming.** Custom properties are unsupported in Gmail and Outlook Windows, so
   `data-theme` switching is impossible. Theme becomes a **render-time argument** resolved to
   literal hex. Dark mode is client-controlled — Gmail and Outlook.com force their own inversion —
   and only partially steerable via `color-scheme` and a `prefers-color-scheme` block.
4. **Icons.** All 444 are inline SVG (§1.6). Outlook Windows needs a rasterized PNG with an
   absolute URL or a CID attachment. That is an asset-hosting problem, not a code problem.
5. **Charts are cut from v1.** Same rasterization + hosting requirement, far more surface.
6. **Web fonts do not load** in Gmail or Outlook. `--cascivo-font-sans` (`ui-sans-serif`) does not
   resolve; email-safe stacks must be explicit.
7. **RTL inverts a repo rule.** `rtl:check` (`package.json:119`) bans physical `left`/`right` in
   shipped CSS. Email requires physical properties plus `dir` attributes. The check needs an
   explicit path exemption for `packages/email`, recorded in the check's own header.
8. **The a11y guard suite does not transfer.** APG patterns, focus rings, roving focus, keyboard
   maps are meaningless here. Email a11y is: `role="presentation"` on layout tables, `alt` on every
   image, `lang` on `<html>` and `<body>`, real heading order, body text ≥14px. New guards.

### 4.2 The one thing that cannot be tested in-house

**Outlook 2007–2019 and Outlook desktop on Windows** render with the Word engine — a proprietary,
Windows-only binary. No open-source emulator exists. Nothing written here will render it, and
`wkhtmltoimage` and similar are not substitutes; claiming otherwise would be worse than admitting
the gap.

The mitigation is architectural rather than a test, and is stronger for it — see §5.3.

---

## 5. Testing with no third-party service

The unlock: **[caniemail](https://github.com/hteumeuleu/caniemail) is MIT-licensed and publishes a
machine-readable [`data.json`](https://www.caniemail.com/api/data.json)** — versioned
(`api_version`, `last_update_date`) with a full `stats` matrix of client → platform → version →
`y`/`n`/`a`/`u`. Vendor a pinned snapshot into the repo with attribution. That is a data file, not
a dependency and not a service.

Four layers, all offline and deterministic.

### 5.1 Layer 1 — conformance lint against the vendored matrix

Parse the rendered HTML; extract every CSS property, value function, element and attribute; look
each up; fail against a declared support floor:

> Must be `y` in Outlook Windows, Gmail, Apple Mail and Outlook.com — **or** sit inside an MSO
> conditional — **or** have a static fallback declaration immediately preceding it.

That last clause is the shape `fallback:check` already enforces
(`scripts/checks/css-fallback.ts`), so the idiom is familiar. This layer catches flex, `gap`,
`var()`, `oklch`, `:has()`, `@container`, grid, `position`, SVG, web fonts — every category in
§1.1.

Pin the snapshot. Add `pnpm email:caniemail:refresh` plus a drift test, so a data refresh is a
reviewed commit rather than a silent behavioural change.

### 5.2 Layer 2 — structural invariants

Pure assertions on the output string. No `class=` anywhere. No `<style>` outside the single
allowlisted head block. Every layout `<table>` carries `role="presentation"` and
`cellpadding="0" cellspacing="0" border="0"`. Every `<img>` has `alt`, explicit `width`/`height`
and an absolute `src`. Every `<a>` is absolute. XHTML Transitional doctype. `lang` and `dir` on
both `<html>` and `<body>`. MSO conditionals balanced and correctly nested. Zero `oklch(`,
`var(--` or `rem` in inline styles.

### 5.3 Layer 3 — client simulation

This substitutes for a commercial rendering service, and it is cheap because the vendored matrix
already says what to do.

For a target client, derive a **CSS filter** from the matrix, strip every declaration that client
does not support, render the stripped HTML in Chromium, and screenshot it.

This does not emulate the client. It asks the question that actually matters: *does this layout
survive when `gap`, `flex` and `var()` are deleted?* That is the real failure mode, and it is
caught deterministically with committed baselines. Layer on the known Gmail transformations
(`<style>` handling, `position` removal, class rewriting) as a "Gmail normalizer".

**And it is what buys down §4.2.** Because the generator is constrained so it *cannot emit*
Word-hostile markup — tables-only layout, padding only on `<td>`, explicit `width` on every table
and cell, MSO conditionals around buttons and containers, no reliance on `border-radius` — the
Outlook Windows failure is prevented by construction and enforced by Layer 1. A test that cannot
exist is replaced by a bug that cannot be generated.

Residual coverage for Outlook Windows: a **release-time manual checklist** — five templates, one
Windows machine, eyeball, done. Per release, not per PR.

### 5.4 Layer 4 — visual baselines

Point the existing machinery (§1.7) at email fixtures: committed PNGs, coverage guarded in both
directions, clock and timezone pinned.

One free upgrade: run the same screenshots under Playwright's **WebKit** engine as well as
Chromium. WebKit is a good proxy for Apple Mail and iOS Mail, and it costs nothing.

### 5.5 The escape hatch that costs one function

**`.eml` export** from the preview. Drag it into any real client on any real device. It is the
cheapest possible bridge to true client testing, needs no service, and covers the long tail
(Yahoo attribute stripping, Outlook.com dark-mode inversion) that no offline layer can reach.
Each quirk found becomes a regression test the day it is reported.

### 5.6 Honest coverage statement

Roughly **85–90% of the regression surface** is covered deterministically and offline. The
residual is Outlook Windows pixel fidelity and long-tail client quirks. The trade — no "90 real
client screenshots" confidence, occasional production surprises — is accepted deliberately in
exchange for zero vendor cost and fully offline CI. Given the constrain-by-construction approach,
that is a good trade; it should be stated in the docs rather than glossed.

---

## 6. Size contract

### 6.1 Minimization

- **Eliminate nested tables.** This is where the bytes are. A normalization pass: a `Section`
  wrapping a single child that is already a table emits no table of its own. Largest single win.
- Shorthand over longhand (`padding: 8px 16px`, not four declarations).
- Drop declarations equal to the inherited or default value.
- `0` not `0px`; three-digit hex where lossless.
- Collapse inter-tag whitespace; `pretty: false` by default.
- No `id`, no `data-*`, no framework artifacts, no comments except MSO conditionals.
- The head `<style>` block carries only what genuinely cannot inline (media queries,
  `prefers-color-scheme`), dead-code-eliminated against the selectors actually present.

### 6.2 Making it provable

- `renderEmail()` returns `{ html, text, stats }` where `stats` is
  `{ bytes, encodedBytes, clipRisk, nodeCount, maxTableDepth, byComponent }`.
- **Per-template byte budgets declared in meta**, enforced by `pnpm email:size:check` — the
  `sparkline-subpath-size.test.ts` pattern applied to a new target: a committed budget measured
  against the real artifact, with the failure mode documented in the header.
- `cascivo email analyze <template>` prints byte attribution per component, so "why is this 40 KB"
  has an answer.
- A live size gauge in the preview UI with the clip lines drawn on it.

### 6.3 The measurement detail most tools get wrong

[Gmail clips at ~102 KB](https://github.com/hteumeuleu/email-bugs/issues/41), but the threshold
applies to the **encoded message body**, not the raw string. Base64 inflates by roughly a third;
quoted-printable much less. **Budget against `encodedBytes` after applying the transfer encoding**,
or the check under-reports by ~33% and green CI ships clipped mail.

Mobile clips lower — [reportedly ~20 KB on iOS Gmail and ~75 KB on other
mobile](https://www.beehiiv.com/support/article/4413255394583-ways-to-manage-email-weight-and-avoid-gmail-clipping).
Three budget tiers, not one; templates default to the strict tier.

---

## 7. Preview app

`apps/email-preview` → package name `@cascivo/email-preview` (satisfies the
name-ends-with-directory rule enforced by `scripts/checks/app-package-names.test.ts`). Vite app,
watches a template directory, HMR.

**Structural requirement: render into an `<iframe srcdoc>`, never into the page.** cascivo's own
CSS uses `@layer` and would otherwise cascade into the preview and make it lie.

Features:

1. **Viewport switcher** — 320 / 375 / 414 / 600 (canonical email width) / 1024 (desktop reading
   pane). Iframe width, not browser zoom.
2. **Client tabs** — Gmail, Apple Mail, Outlook Web, Outlook Windows (approx). Each applies the
   §5.3 CSS filter before injecting. The Outlook Windows tab carries a visible *approximation*
   badge; the UI must never claim fidelity the harness does not have.
3. **Theme switcher** across all twelve cascivo themes — the capability React Email structurally
   cannot offer.
4. **Dark-mode simulation** using the inversion heuristics Gmail and Outlook.com apply.
5. **Live size gauge** with the three clip lines (§6.3) and per-component attribution.
6. **Compatibility panel** — Layer 1 results inline: property, verdict, failing clients.
7. **Source / plain-text / raw-MIME tabs**, plus copy-HTML and **download `.eml`** (§5.5).

Deliberately **not** included: send-test. That is a provider dependency; `.eml` download serves
the need better and costs nothing.

**Why this is Phase 2 and not Phase 4:** those iframes are exactly what the Layer 3 and Layer 4
tests drive. The preview app *is* the test fixture. Built once, the client-simulation and visual
layers come almost free on top of it — and the preview can never drift from what CI checks,
because they are one code path. Building it later means building the harness twice.

---

## 8. Phases

| Phase | Contents | Verified by |
| --- | --- | --- |
| **1** | Token resolver (oklch → sRGB, `var()` flattening, per-theme JSON, subsuming §1.5) + vendored caniemail snapshot | Golden file per theme; `email:tokens:check`; contrast re-check against resolved hex |
| **2** | ~20 primitives **and** the preview app, together. The iframe harness lands here. | HTML snapshot per component × theme; Layer 2 invariants |
| **3** | `renderEmail()` + `stats` + `emailComponentMap` (`ViewConfig` → email) + all four test layers | `email:size:check`; Layers 1–4 green |
| **4** | `cascivo add email/*`, templates (`welcome`, `password-reset`, `receipt`, `digest`, `invite`), MCP `scaffold_email`, `cascivo:email` skill, docs, React Email interop adapter | `docs-routes:check`, `meta:check`, `doc-urls:check` |
| **5** | Release-time Outlook Windows checklist; quirk regressions as reported | Manual, per release |

Primitive set for Phase 2:

`Html · Head · Preview · Body · Container · Section · Row · Column · Spacer · Hr · Heading ·
Text · Link · Button · Img · Card · Badge · Alert · List · Footer`

Authoring rules established before the first component:

- Every layout table carries `role="presentation"` and `cellpadding/cellspacing/border="0"`.
- MSO conditional comments for `Button` padding and `Container` width.
- Props follow the existing vocabulary contract (`docs/AI-RULES.md`): `variant` not
  `kind`/`shape`/`type`; `items` for collections; the type named after the prop.
- Each ships a `.meta.ts` with `category: 'email'`, so `registry.json`, `llms/<name>.md`,
  `context/<name>.md` and the docs site all regenerate through `pnpm regen` unchanged.

---

## 9. Open risks

1. **The oklch → sRGB conversion invalidates the existing contrast guards.** Those assert against
   oklch lightness values. Resolved-hex palettes need their own AA re-check, or the email target
   can ship palettes that quietly fail contrast while `pnpm ready` stays green. This is the single
   most likely way to ship a real defect from Phase 1.
2. **P3 gamut loss.** Some theme accents will shift visibly when clamped to sRGB. Whether that is
   acceptable per theme is a design call, not a technical one, and should be reviewed with the
   twelve palettes side by side before Phase 2 starts.
3. **Layer 3 fidelity is unproven.** The CSS-filter approach is sound in principle but has not
   been built here. If the filtered render turns out to diverge materially from real clients, the
   fallback is Layers 1, 2 and 4 plus the `.eml` workflow — still useful, but a weaker story than
   §5.6 claims. Treat §5.6's 85–90% as an estimate until Phase 3 measures it.
4. **`ViewConfig` → email may not carry as far as it looks.** The 112-entry `componentMap` is
   mostly interactive components with no email counterpart, so the shared-spec story is real only
   for content-shaped views. Worth prototyping in Phase 3 before it is claimed in marketing.

---

## 10. Sources

- React Email — <https://react.email/docs/introduction>, `/docs/utilities/render`,
  `/docs/components/tailwind`, `/docs/cli`
- `Column` inside `Section` emits extra `<td>` — <https://github.com/resend/react-email/issues/309>
- Can I email (MIT) — <https://github.com/hteumeuleu/caniemail>,
  <https://www.caniemail.com/api/data.json>
- Flexbox support — <https://www.caniemail.com/features/css-flex-direction/>
- CSS custom properties support — <https://www.caniemail.com/features/css-variables/>
- Gmail 102 KB clipping — <https://github.com/hteumeuleu/email-bugs/issues/41>
- Mobile clipping thresholds —
  <https://www.beehiiv.com/support/article/4413255394583-ways-to-manage-email-weight-and-avoid-gmail-clipping>


---

## 11. What implementation changed

The design in §1–§10 stood up, with four corrections worth recording. Each was found by
building the thing, not by reasoning about it.

### 11.1 The lint's strictness was wrong at first [corrected]

§5.1 proposed blocking anything not `y` in every floor client. That rejected `font-size`,
`padding`, `text-align` and `width` — the four most basic declarations in any email — because
Can I email uses `a` plus a prose footnote for "works, with a caveat": `padding` is `a #1 #2`
in Outlook Windows precisely because it applies to `<td>` and not to `<div>`.

**Only `n` blocks.** The caveats are enforced instead by structural assertions over our own
output ("layout padding appears only on `<td>`"), which can be precise where an attempt to
interpret footnote #1 cannot. `untested` is silent — `<td>`, `<a>` and `<h1>` are absent from
the matrix because they are foundational, and reporting them as unsupported would be false.

### 11.2 §9.1's risk was real, and was two risks [corrected]

Resolving to sRGB did surface contrast failures, in two distinct classes:

- **A resolver bug.** `--cascivo-color-text-on-accent` was taking the static `oklch(1 0 0)`
  fallback rather than the `contrast-color()` upgrade the themes declare inside `@supports`,
  giving white labels on light accents (2.66:1 on dark, midnight, pastel). Resolving
  `contrast-color()` at build time fixes it, and is strictly better than any client could
  manage — no email client will ever compute it.
- **Pre-existing product debt, since fixed.** `--cascivo-color-text-muted` failed AA in the
  shipped oklch source. Recorded as a baseline at first, then fixed at source once the scope
  was measured. It was worse than the email guard could see: checking `surface` and
  `surface-2` as well as `background` — a caption in a `Card` sits on one, a nested one on
  the other — put ten of twelve themes below AA, pastel at 2.37:1, and caught two themes
  (arcade, flat) that pass against the background and fail on a surface.

  Lightness only was adjusted, so no theme changed character.
  `scripts/checks/muted-text-contrast.test.ts` is the lasting guard and covers all twelve
  themes on all three surfaces. Blast radius on the web product was small and measured: 319
  of 326 dark/warm site baselines were unchanged, and the 7 that moved are the components
  that render muted text prominently.

A third finding was mine, not the themes': the guard first read `--cascivo-color-accent` for
link contrast. That is the **fill** token; `--cascivo-color-accent-text` is the one four
themes restate for type, and `accent-text-contrast.test.ts` already guarantees it.

### 11.3 §5.6's coverage estimate held, but not for the reason given [confirmed with a caveat]

The offline layers did catch the great majority of defects. What the estimate understated is
how many were found by **driving the preview in a browser** rather than by the unit layers:

- `renderEmail` used `Buffer`, which is Node-only, and took the whole preview down.
- The lint fixture was a hand-made subset and reported the primitive set clean while the real
  templates carried five blocked findings.
- Both the linter and the simulator split style attributes on `;`, which cuts through the
  `&#x27;` entity React emits around quoted font names. Every simulated preview rendered in
  Times New Roman. Seventy-seven unit tests were green throughout, because they asserted on
  slug values and never on reconstructed CSS.

The lesson generalises: a conformance layer that inspects its own intermediate values, rather
than the artifact a client receives, can be thoroughly green and thoroughly wrong. Layer 3 is
worth more than §5.3 credited it with — not as a client approximation, but as the only layer
that exercises the pipeline end to end.

### 11.4 §9.4 was right to doubt the shared-spec story [outstanding]

`ViewConfig` → email is **not implemented**, and the doubt recorded in §9.4 is why. The
112-entry `componentMap` is overwhelmingly interactive components with no email counterpart,
so the mapping would be thin enough that claiming "one spec, two targets" would oversell it.
It stays a design option, not a shipped capability, until a content-shaped subset earns it.

### 11.5 An email is a message, not a document [added]

§8's phase table stopped at rendering HTML, which was short by everything a mailer actually
needs. `renderEmail` now returns `{ subject, html, text, preheader, stats }`, templates export
their own subject, and `assertSendable` gates the four failures that only appear once the mail
has arrived. `buildMessage` produces a real `multipart/alternative` envelope, which is also
what makes the `.eml` escape hatch in §5.5 a tested code path rather than UI glue.

Deriving the text part properly turned up two defects the HTML-only view could not see: the
whole `<head>` survived into it, so every text alternative opened with the `<title>` and then
the same words again as the heading; and quoted-printable existed twice — a hand-rolled cost
model in the size accounting and the real encoder — agreeing to within 3%. A budget checked
against an estimate and delivered against an encoder is not a budget.

### 11.6 Registry and MCP integration [outstanding]

Phase 4's `cascivo add email/*` and MCP `scaffold_email` are not implemented. Adding email
entries to `registry.json` activates twenty-odd guards that assume a DOM component with a
docs route, an APG pattern and a site visual baseline. Doing it properly means extending the
registry schema and those guards to understand an entry that has none of those — its own
change, and not one to make halfway.

The AI surfaces that do not need the registry are shipped: `skills/cascivo-email`,
`docs/RECIPE-EMAIL.md`, and `docs/EMAIL-CLIENT-SUPPORT.md` generated from the same data the
lint reads.
