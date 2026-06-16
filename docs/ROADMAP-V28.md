# cascivo — Roadmap v28: Theme Configurator (`/create`)

**Last updated:** 2026-06-16
**Status:** 🚧 Planning
**Plan documents:** `docs/superpowers/plans/2026-06-16-v28-master-plan.md` + tranches 1–6

---

## Vision

v27 made the landing instant and searchable. v28 gives developers a reason to share it.

The cascivo theme configurator lives at `/create` on the landing. It is a three-panel interactive
page: a control panel on the left lets the user tweak accent hue, border radius, surface mode, and
font family; a live preview in the center shows real cascivo components updating in real time; a
code panel on the right shows the complete CSS custom-property block they can drop straight into
their project. One "Share" button encodes the full configuration into the URL so any theme can be
bookmarked or sent to a teammate.

The closest public reference for this kind of tool is [ui.shadcn.com/themes](https://ui.shadcn.com/themes).
Shadcn's configurator lets users pick HSL color values, a border radius, and a mode (light/dark)
and generates a Tailwind CSS variables block. Our version adapts that idea to cascivo's model:
OKLCH color space, a single accent-hue knob that drives the full accent family, a separate surface
mode toggle that drives surface/foreground/border, and a radius knob that drives the entire
`--cascivo-radius-*` scale via `calc()`. Output is a `@layer cascade.theme { }` block that extends
`@cascivo/themes/light.css` or `dark.css` — users only override what they changed.

> Concept: **"Your theme in 30 seconds, shareable in one click."** A developer lands on `/create`,
> clicks the "warm amber" preset, adjusts the radius to pill-shaped, copies the CSS, and pastes it
> into their project. Total time: under 30 seconds. Share link: one click.

No new library components are added. All work touches `apps/landing` only.

---

## What changes

### Feature 1 — `/create` route and page scaffold

A new top-level route `/create` is added to the landing SPA. It is lazy-loaded like every other
non-home page. The page title is "Create a theme — cascivo". A "Create" link is added to the
primary nav links in `Header.tsx` (visible on desktop between "Examples" and the search icon).
The route is prerendered (head-only) for SEO. The `ROUTE_HEAD` and `PRERENDER_ROUTES` entries are
added to `route-head.ts`.

The page layout is a CSS Grid: three equal columns on `lg` viewports (`64rem+`), two columns on
`md` (controls + preview stacked on left, code on right), and a single column on mobile (controls
→ preview → code stacked vertically). The grid uses `@container` on a wrapper div so the layout
adapts to the container, not the viewport.

### Feature 2 — Signal store, CSS generator, and URL state

All configurator state lives in a single `ThemeConfig` signal in
`apps/landing/src/pages/create/store.ts`. The fields are:

```ts
type ThemeConfig = {
  baseMode: 'light' | 'dark' // surface/foreground/border scale
  accentHue: number // OKLCH hue, 0–360
  accentChroma: number // OKLCH chroma, 0.05–0.3
  radiusBase: number // rem, 0–1.5 (6 stops)
  fontFamily: 'system' | 'geometric' | 'humanist' | 'transitional' | 'mono'
  presetId: string | null // which preset was last applied, or null
}
```

`css-gen.ts` is a pure function `configToCSS(config: ThemeConfig): string` that produces the
complete `@layer cascade.theme { [data-theme="custom"] { } }` block. It generates:

- The full `--cascivo-color-accent-*` family from `accentHue` and `accentChroma`
- `--cascivo-radius-base` plus the six derived radius tokens via `calc()` strings
- `--cascivo-font-sans` from the `fontFamily` key
- Comment at the top of the block showing which base theme to import

`url-state.ts` encodes/decodes the config to/from the URL hash as a compact base64url string.
On mount, if a hash is present, it is decoded and loaded as the initial config. Every signal write
triggers a `history.replaceState` call to keep the URL current (debounced 300 ms to avoid
flooding the history API).

### Feature 3 — Presets

`presets.ts` ships ten named configurations, one for each cascivo built-in theme (light, dark,
warm, flat, minimal, midnight, pastel, brutalist, corporate, terminal). Each preset is a
`ThemeConfig` extracted from the corresponding theme's CSS token values. Loading a preset fires
`config.value = preset.config` which immediately re-renders the preview and regenerates the code.

The preset tiles render as a horizontal scroll row above the control sliders — each tile is a
50 × 36 px colour swatch pair (background + accent) with the theme name as a label below it. The
active preset gets a visible ring; manually changing a control sets `presetId: null` ("Custom").

### Feature 4 — Control panel

`ControlPanel.tsx` is the left column. From top to bottom:

**Preset row** — 10 tiles, horizontally scrollable with scroll-snap.

**Base mode** — a two-option `Toggle` (light / dark). Sets `baseMode`.

**Accent color** — two `<input type="range">` sliders:

- _Hue_ (0–360). A 24-stop hue preview strip rendered as a CSS linear-gradient background on the
  track (using `oklch(0.65 0.2 <hue>)` steps) shows the colour sweep.
- _Chroma_ (0–0.3, step 0.01). A gradient strip on the track goes from gray to the current hue at
  full chroma so the user sees the saturation effect directly.
- A 32 × 32 px live swatch to the right of both sliders shows the resolved `oklch(...)` value as a
  filled circle.

**Border radius** — a six-stop discrete `<input type="range">` (0, 0.25, 0.375, 0.5, 0.75, 1.5
rem). Tick labels below the track read: "0" / "sm" / "md" / "lg" / "xl" / "pill".

**Font family** — a `Select` component with five options:
| Key | Value written to `--cascivo-font-sans` |
|---|---|
| `system` | `ui-sans-serif, system-ui, -apple-system, ...` (current default) |
| `geometric` | `'Futura', 'Century Gothic', ui-sans-serif, ...` |
| `humanist` | `'Gill Sans', 'Trebuchet MS', ui-sans-serif, ...` |
| `transitional` | `'Optima', 'Candara', ui-sans-serif, ...` |
| `mono` | `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, ...` |

All five are safe web font stacks with no external network requests. The font change is visible
immediately in the preview panel because the preview inherits `font-family` from the injected
custom CSS block.

**Reset button** — a ghost `Button` at the bottom of the panel that restores the config to the
`light` preset and clears the URL hash.

### Feature 5 — Preview panel

`PreviewPanel.tsx` is the center column. It renders a realistic mini-app mockup built entirely from
cascivo components. A `<style data-cascivo-create>` element is injected into `document.head` and
its `textContent` is updated (not replaced) whenever the config signal changes.

The preview container carries `data-theme="create-custom"` so the generated CSS is scoped to the
preview only. The page's own theme (from `theme.ts`) remains untouched.

The preview contains six component groups, each labelled:

1. **Buttons** — primary, secondary, ghost, destructive (all four variants, inline row)
2. **Form** — email `Input`, password `Input`, `Checkbox` ("I agree to terms"), submit `Button`
3. **Status** — `Alert` in info, success, and warning variants stacked vertically
4. **Card** — an `Elevated` card with header, two `Badge` pills (one accent, one neutral), a short
   paragraph, and a footer row with "Cancel" (ghost) and "Confirm" (primary) buttons
5. **Toggle** — three `Toggle` switches labelled "Notifications", "Marketing", "Analytics"
6. **Select** — a `Select` dropdown labelled "Plan" with four options

A thin vertical divider separates each group. The groups are arranged in a two-column CSS Grid on
`md+` and a single column on mobile.

The preview has a frame: a `1px` border using `var(--cascivo-color-border)`, `8px` border-radius,
and a white-noise texture background at 3 % opacity so it reads as a "screen" rather than a
coloured rectangle. A label "Preview — updates live" sits in the top-left corner of the frame.

### Feature 6 — Code output panel

`CodePanel.tsx` is the right column. It has two tabs (`Tabs` component from cascivo):

**Tab 1 — CSS**

A `<pre>` block with monospace styling showing the complete generated CSS. The block is
syntax-highlighted with a pure CSS approach: no syntax-highlighting library. Three spans wrap the
three lexical categories (`property-name`, `value`, `comment`), each colored with semantic tokens.
The block is scrollable (max-height 60 vh with `overflow-y: auto`).

A `Button` ("Copy CSS") uses `navigator.clipboard.writeText` to copy the block text. On success
the button label changes to "Copied!" for 1.5 s then resets — driven by a `useSignal(false)`.

A `Button` ("Download theme.css") creates a `Blob` of the CSS text, generates an object URL, and
programmatically clicks a hidden anchor to trigger a file download. No server involved.

**Tab 2 — Usage**

A static code block showing the three-line integration pattern:

```css
/* in your global CSS */
@import '@cascivo/themes/light.css'; /* or dark.css */
@import './theme.css'; /* your downloaded file */
```

```tsx
/* wrap your app */
<div data-theme="custom">{/* your cascivo components */}</div>
```

A "Copy" button copies the usage snippet.

**Share link row** — below the tabs, a "Share" `Button` (icon: link) calls
`navigator.clipboard.writeText(window.location.href)` so the current URL (which always encodes
the config via the hash) is on the clipboard. Label changes to "Link copied!" for 1.5 s.

---

## Why these changes and not others

- **Theme configurator is the highest-value landing addition after search.** A developer evaluating
  cascivo can now see their brand colours in 30 seconds without writing a single line of CSS. That
  turns an abstract claim ("fully themeable") into a tangible proof.
- **OKLCH is the right colour model.** HSL hue shifts produce perceptually uneven results; a blue
  and a yellow at the same HSL saturation look dramatically different in apparent brightness. OKLCH
  delivers perceptually uniform lightness and chroma, which means a single hue knob produces a
  coherent accent family without secondary adjustments.
- **One hue knob, not twelve colour pickers.** Shadcn's configurator exposes every semantic colour
  individually, which is powerful but overwhelming for a first impression. The cascivo model starts
  from a complete base theme and lets the user change _one knob_ (hue) to produce a coherent
  palette. Advanced users who need per-token control edit the downloaded CSS file.
- **URL hash state, not a share button that requires a server.** Encoding config in the URL hash
  means no backend, no rate limits, no auth — and the back button always restores the previous
  configuration. This is the approach used by design tools like Radix themes and Open Props.
- **Pure web font stacks, no Google Fonts.** Making the configurator offline-capable and privacy-
  preserving matters for developers who test on planes or behind strict CSPs. System font stacks
  cover the five major typographic personalities without a network request.
- **`<style>` injection, not shadow DOM.** CSS custom properties pierce shadow DOM, but cascivo
  components use `data-theme` on an ancestor container, not shadow root scoping. Injecting a
  `<style>` tag and scoping its rules to `[data-theme="create-custom"]` is simpler, more reliable
  across all browsers, and exactly the pattern users will apply in their own projects.

---

## Workstreams

| #   | Workstream                        | Tranche | Summary                                                                |
| --- | --------------------------------- | ------- | ---------------------------------------------------------------------- |
| A   | Route + page scaffold             | T1      | Add `/create` route, nav link, SEO head, empty page layout             |
| B   | Store + CSS generator + URL state | T2      | ThemeConfig signal, configToCSS, URL hash encode/decode, presets       |
| C   | Control panel                     | T3      | Preset row, mode toggle, hue/chroma sliders, radius stops, font Select |
| D   | Preview panel                     | T4      | `<style>` injection, component showcase, live update on signal change  |
| E   | Code output panel                 | T5      | CSS tab + copy/download, Usage tab, share link row                     |
| F   | Gate                              | T6      | Full CI gate across all changes                                        |

---

## Decisions baked in

1. **Config is always in the URL hash.** Every slider change calls `history.replaceState` (debounced
   300 ms). The page is bookmarkable at all times. No `localStorage` persistence — the URL is the
   persisted state.
2. **`data-theme="create-custom"` scopes the preview.** This sentinel value never appears in
   `@cascivo/themes`; it is generated only by the configurator. The page's own theme (driven by
   `theme.ts`) applies to everything else.
3. **Generated CSS extends, not replaces, the base theme.** The output block contains only the
   tokens the user changed (accent family, radius, font). It imports from `@cascivo/themes/light.css`
   (or `dark.css`) to supply the rest. This keeps the output concise and composable.
4. **Font families are system stacks only.** No Google Fonts `@import`. The five stacks cover
   geometric sans, humanist sans, transitional sans, and monospace personalities without a network
   request. If a specific system font in the stack is absent, the browser falls through to the
   next one gracefully.
5. **No live code runner in the preview.** The preview shows real cascivo components, not a
   simulated screenshot or iframe. Components mount once and re-style as CSS changes — no React
   remounting needed.
6. **Syntax highlighting is CSS-only.** The code panel wraps token categories in `<span>` elements
   and colours them with semantic tokens. No Prism, no highlight.js, no build-time transform. The
   CSS block is short enough (≈40 lines) that manual wrapping in `css-gen.ts` is trivial.
7. **Presets extracted from existing theme CSS at build time.** `presets.ts` contains hardcoded
   `ThemeConfig` objects derived from the token values in `packages/themes/src/*.css`. If a theme
   file changes, the preset must be updated manually. A comment in `presets.ts` says which theme
   file each preset mirrors.
8. **All work is in `apps/landing`.** No published packages change. No new `@cascivo/*` packages.
   The configurator is a landing feature, not a reusable component.

---

## Definition of Done

### Route + scaffold (T1)

- [ ] `https://cascivo.com/create` renders the page (no 404). _Verify: T1._
- [ ] "Create" link appears in the primary nav on desktop. _Verify: T1._
- [ ] `<title>Create a theme — cascivo</title>` in the prerendered HTML. _Verify: T1._
- [ ] `pnpm exec vp check` exits 0. _Verify: T1._

### Store + CSS generator (T2)

- [ ] `configToCSS({ baseMode: 'light', accentHue: 250, accentChroma: 0.2, radiusBase: 0.375, fontFamily: 'system', presetId: 'light' })` returns a string containing `@layer cascade.theme` and `[data-theme="create-custom"]`. _Verify: T2 unit test._
- [ ] URL hash is updated within 300 ms of changing any config value. _Verify: T2._
- [ ] Loading the page with a valid hash pre-populates the config (checked in a unit test over `hashToConfig → configToHash` round-trip). _Verify: T2 unit test._
- [ ] All 10 presets produce valid `ThemeConfig` objects (checked by schema test). _Verify: T2 unit test._
- [ ] `pnpm exec vp check` exits 0. _Verify: T2._

### Control panel (T3)

- [ ] All six control groups render without overflow at 320 px. _Verify: T3._
- [ ] Moving the hue slider from 0 → 180 changes the accent swatch colour visibly. _Verify: T3._
- [ ] Clicking a preset tile sets `config.presetId` to the preset's id and updates all sliders to
      the preset's values. _Verify: T3._
- [ ] "Reset" restores the light preset and clears the URL hash. _Verify: T3._
- [ ] `pnpm breakpoint:check` exits 0. _Verify: T3._

### Preview panel (T4)

- [ ] `<style data-cascivo-create>` exists in `document.head` while `/create` is mounted. _Verify: T4._
- [ ] `<style data-cascivo-create>` is removed from `document.head` when the user navigates away. _Verify: T4._
- [ ] Changing the hue slider updates the accent colour of the primary `Button` in the preview without a page reload. _Verify: T4._
- [ ] Changing the radius slider updates the `border-radius` of the preview `Card` without a page reload. _Verify: T4._
- [ ] All six component groups render with no accessibility violations (axe). _Verify: T4._
- [ ] `pnpm breakpoint:check` exits 0. _Verify: T4._

### Code output panel (T5)

- [ ] "Copy CSS" writes the generated CSS to the clipboard. After clicking, the button label reads "Copied!" for ≥1 s. _Verify: T5._
- [ ] "Download theme.css" triggers a file download named `theme.css`. _Verify: T5._
- [ ] "Share" copies `window.location.href` to the clipboard. After clicking, the button label reads "Link copied!" for ≥1 s. _Verify: T5._
- [ ] The Usage tab renders the three-line CSS and the JSX import snippet. _Verify: T5._
- [ ] `pnpm exec vp check` exits 0. _Verify: T5._

### Gate (T6)

- [ ] `pnpm exec vp check` exits 0.
- [ ] `pnpm build` exits 0.
- [ ] `pnpm exec vp run -r check` exits 0.
- [ ] `pnpm test` exits 0.
- [ ] `pnpm regen && pnpm exec vp check --fix && git diff --exit-code` exits 0.
- [ ] `pnpm breakpoint:check` exits 0.

---

## Non-goals (explicitly out of scope)

| Claim                                            | Substance                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **No per-token colour pickers**                  | Users change accent hue + chroma. Full per-token editing is for `theme.css` post-download. |
| **No Google Fonts**                              | System font stacks only. No external network requests from the configurator.               |
| **No AI-assisted theme generation**              | "Generate a theme from a brand description" is a future AI feature. Out of scope for v28.  |
| **No theme gallery / community**                 | Sharing a link is the social surface; a hosted gallery is deferred.                        |
| **No dark-mode preview toggle inside the panel** | `baseMode` (light/dark) is a control in the panel. No separate preview-only override.      |
| **No component state interaction**               | Preview components are static (no clicking a Button to see loading state, etc.).           |
| **No npm publish of the configurator**           | The configurator is landing-only; it is not a reusable package.                            |

---

## Deferred

- **AI theme generation.** A Claude-powered flow: "I'm building a fintech app with navy and gold
  branding" → the MCP server generates a `ThemeConfig` and the configurator loads it via URL hash.
  Deferred — requires `/create` to be stable first.
- **Hosted theme gallery.** A page listing user-submitted themes (saved configs) with a "Use this"
  link. Requires a backend. Deferred post-v28.
- **Component state interaction in preview.** Let users click components to see interactive states
  (hover, focus, loading, disabled). Adds motion and shows the FSM layer. Deferred — significant
  interaction design.
- **Export to Figma variables.** Generate a Figma Variables JSON from the config so designers can
  use the same tokens. Deferred — requires Figma API knowledge.
- **Per-token advanced mode.** A collapsible "Advanced" section exposing every `--cascivo-*`
  semantic token as an editable field. Deferred — the simple knob flow must prove itself first.
