# Trade Showcase — Layout & Chrome Adjustments Spec

**Status:** Approved plan, ready for implementation
**Date:** 2026-07-03
**Scope:** Four adjustments to the shipped `apps/examples/trade` showcase (see
`docs/specs/trading-dashboard-showcase.md` for the original spec). Plus two small, opt-in
enhancements to shared code that the adjustments require.
**Audience:** Implementing agent (Opus). Follow CLAUDE.md rules throughout — signals only,
`useSignals()` first in render-reading components, i18n for all strings, canonical breakpoint
literals only, `pnpm ready` green before every commit.

The four user-reported issues, from a 1700×1130 screenshot of the running app:

1. The navbar (ShellHeader) has a background color; it should be transparent while keeping its
   contents legible.
2. The side nav should be removed; its menu items (Trading, Research) move into the navbar.
3. The avatar profile panel is clipped on the right (its right portion is outside the visible
   area and it grows an internal horizontal scrollbar), and it should start below the avatar
   instead of overlapping the header.
4. The dashboard cards are unbalanced — large dead space under the order ticket, panels pushed
   below the fold. The grid should fill the whole viewport with no scrollbar.

---

## 1. Verified root causes (do not re-diagnose; these were confirmed against source)

### R1 — Header background

`packages/components/src/shell-header/shell-header.module.css` line 8 sets
`background: var(--cascivo-color-surface)` (plus a `border-block-end`). `ShellHeader` accepts a
`className` prop (`shell-header.tsx`, `ShellHeaderProps`), and unlayered app CSS beats
`@layer cascivo.component`, so an app class can neutralize both. The blocker is only that the
kit `AppShell` (`apps/examples/kit/src/app-shell.tsx`) does not forward any header className.

### R2 — Side nav is hardcoded in the kit

`apps/examples/kit/src/app-shell.tsx` always renders `sideNav={<SideNav …/>}` and always passes
`onMenuClick` (which is what makes ShellHeader render the burger — `shell-header.tsx` renders the
menu button only when `onMenuClick` is provided). The layouts `AppShell`
(`packages/layouts/src/app-shell/app-shell.tsx` line 98) already renders the `.nav` grid area
**only when `sideNav` is passed**, and the shell's nav column is `auto`
(`app-shell.module.css`: `/ auto minmax(0, 1fr) auto`), so omitting it collapses the column to
zero — no layout work needed there.

`ShellHeader` already has a `nav?: ShellHeaderNavItem[]` prop that renders header links. One gap:
`ShellHeaderNavLink` is `{ label, href, active? }` — plain `<a href>` with **no `onClick`**, so a
SPA-style section switch (or a stubbed item) can't intercept navigation.

### R3 — Profile panel clipping and vertical offset (two distinct bugs)

`packages/components/src/header-panel/header-panel.module.css`:

- The panel is `position: fixed; inset-inline-end: 0;
  inline-size: var(--cascivo-shell-panel-inline-size, 20rem)`, and its `.body` has
  `padding: var(--cascivo-space-3)` and `overflow-y: auto`.
- **Bug (a) — horizontal clipping:** the app's inner wrapper
  (`apps/examples/trade/src/sections/TopBar.module.css`, `.panel`) sets
  `inline-size: min(20rem, 86vw)` — i.e. the same 20rem as the *outer* panel, which after the
  body's 2×`space-3` padding leaves only ~17.5rem of content box. The inner content therefore
  overflows horizontally; since `.body` sets `overflow-y: auto`, `overflow-x` computes to `auto`
  as well → the internal horizontal scrollbar, with the cards' right edges cut off. (The panel
  itself is *not* off-viewport; its content is wider than the panel.)
- **Bug (b) — vertical offset:** the panel anchors at
  `inset-block-start: var(--cascivo-shell-header-block-size, 3rem)` (token default `3rem`,
  `packages/tokens/src/index.css:290`). But the app's real header is the kit **mock banner +
  ShellHeader** — taller than 3rem — so the panel overlaps the banner/header instead of starting
  below the avatar. The banner has no fixed height (`padding-block` + text), so no static token
  can describe the true offset.
- Additionally, the panel is a **full-height right rail** (`inset-block-end: 0`,
  `border-inline-start`), whereas the requested design is a **floating card below the avatar**.

### R4 — Unbalanced grid / page scrolling

The layouts shell is already viewport-locked (`app-shell.module.css`: `.shell { block-size:
100dvh; overflow: hidden }`) and `.main { overflow-y: auto }` is the only scroll container. The
app grid (`apps/examples/trade/src/App.module.css`) is **content-height**: the chart is fixed at
`height={360}` (`PriceChart.tsx`), Time & Sales has a fixed `ScrollArea height="18rem"`, the
orders table paginates 10 rows — so column heights are whatever their content happens to be,
`.main` scrolls, and nothing fills the viewport. Removing the side nav (R2) also frees the left
rail width the current template assumed.

---

## 2. Design decisions (made; do not re-litigate)

- **Kit `AppShell` gets small opt-in props** rather than the trade app forking its own shell.
  The kit is internal shared code; defaults must keep the other five demos byte-identical.
- **`ShellHeaderNavLink` gains an optional `onClick`** — the minimal package change enabling
  header nav in SPA demos. No `disabled` flag, no new item kinds.
- **`HeaderPanel` (the shared component) is NOT changed.** Both R3 bugs are fixable from the app
  via the supported `--cascivo-shell-panel-inline-size` custom property and the existing
  `className` prop (unlayered app CSS wins over `@layer cascivo.component`).
- **Panel top offset is measured at open time** from the avatar button's
  `getBoundingClientRect().bottom` inside the existing click handler (event-driven — no hooks,
  no ResizeObserver) and delivered as a CSS custom property. Custom properties inherit through
  the DOM tree into top-layer popovers, so a wrapper `<div style={{'--trade-panel-top': …}}>`
  around `<HeaderPanel>` works.
- **Full-viewport, no-scroll layout applies at `64rem`+ only.** Below that the current stacked,
  page-scrolling layout is correct and stays (seven panels cannot fit a phone viewport).
  Width literals only from the canonical scale (`40rem`, `64rem`, `80rem`).
- **Chart height becomes measured, not fixed**, via a small app-local `useElementSize` helper
  (ResizeObserver inside `useSignalEffect`, returns a size signal — same pattern the charts
  package uses internally for width in `useChartSize`).

---

## 3. Phase A — shared-code enhancements (opt-in, zero behavior change by default)

### A1 `ShellHeaderNavLink.onClick`

`packages/components/src/shell-header/shell-header.tsx`:

```ts
export interface ShellHeaderNavLink {
  label: string
  href: string
  active?: boolean
  /** Intercept navigation (SPA section switch). Forwarded to the <a>. */
  onClick?: (e: ReactMouseEvent<HTMLAnchorElement>) => void
}
```

Forward `onClick` onto the rendered `<a>` in the nav-list branch (the `key={item.href}` contract
is unchanged — hrefs must stay unique, e.g. `#trading` / `#research`). Update
`shell-header.meta.ts` prop docs. Test: a nav link with `onClick` fires the handler and can
`preventDefault()` (assert no navigation / handler called via testing-library `fireEvent.click`).

### A2 Kit `AppShell` — header nav, header className, optional side nav

`apps/examples/kit/src/app-shell.tsx`:

- New props, all optional:

  ```ts
  headerNav?: ShellHeaderNavItem[]   // forwarded to ShellHeader `nav`
  headerClassName?: string           // forwarded to ShellHeader `className`
  ```

- Render the side nav **conditionally**: when neither `navItems` nor `navGroups` is provided,
  omit the layouts `sideNav` slot entirely **and** omit `onMenuClick`/`menuExpanded` (this hides
  the burger — ShellHeader only renders it when `onMenuClick` exists). The layouts shell's `auto`
  nav column then collapses to zero (verified, `app-shell.tsx:98`).
- All five existing demos pass `navItems`/`navGroups` and no new props → their rendered output is
  unchanged. State this in the PR and verify by running the kit/demo test suites.

Tests (kit has none of its own today; colocate in the trade app or add a kit test following the
repo's existing patterns): shell without `navItems` renders no `<nav>` sidebar and no burger;
`headerNav` items appear inside the header's nav landmark.

---

## 4. Phase B — trade app changes

### B1 Transparent header (issue 1)

- `App.tsx`: pass `headerClassName={styles['transparentHeader']}` to the kit `AppShell`.
- `App.module.css`:

  ```css
  .transparentHeader {
    background: transparent;
    border-block-end-color: transparent;
  }
  ```

  (Unlayered app CSS overrides the component layer.) The header's text, icon buttons, and the
  `end` slot all use foreground tokens and remain legible on the app's dark background; hover
  states (`--cascivo-color-bg-subtle`) still render. Keep the mock banner untouched — it is a
  separate element above the ShellHeader. Verify legibility in all three kit themes
  (dark/light/warm) since the toggle cycles them; the header sits on `--cascivo-color-bg` in
  every theme, so token-colored content stays visible — confirm visually, don't assume.

### B2 Side nav → header nav (issue 2)

- `App.tsx`: drop `navItems`; pass instead

  ```ts
  headerNav: [
    { label: t(msg.navTrading), href: '#trading', active: true, onClick: (e) => e.preventDefault() },
    { label: t(msg.navResearch), href: '#research', onClick: (e) => { e.preventDefault(); toast({ title: t(msg.navResearchHint) }) } },
  ]
  ```

  (`msg.navResearchHint` already exists: "Research is not part of this demo". The toast keeps the
  stub honest instead of a dead link.) Note the toast call must come from a component inside
  `ToastProvider` — build the array inside `App()` which already is.
- With no `navItems`, A2 removes the sidebar and burger automatically. Delete nothing else — the
  `SideNavItem` import goes away; remove it (orphan created by this change).

### B3 Profile panel — clipping + anchor below avatar (issue 3)

`sections/TopBar.tsx` + `TopBar.module.css`:

1. **Kill the width overflow (R3a):** inner `.panel` gets `inline-size: auto` (fill the body's
   content box). Delete the `min(20rem, 86vw)` line. Nothing inside may set a fixed inline size.
2. **Size and float the panel** via a new class passed to `<HeaderPanel className={…}>`:

   ```css
   .profilePanel {
     --cascivo-shell-panel-inline-size: min(23rem, calc(100vw - 2 * var(--cascivo-space-3)));
     inset-block-start: var(--trade-panel-top, calc(var(--cascivo-shell-header-block-size) + var(--cascivo-space-2)));
     inset-block-end: auto;
     inset-inline-end: var(--cascivo-space-3);
     max-block-size: calc(100dvh - var(--trade-panel-top, 6rem) - var(--cascivo-space-3));
     border: 1px solid var(--cascivo-color-border);
     border-radius: var(--cascivo-radius-overlay, 0.75rem);
   }
   ```

   The custom property on the outer panel element is the *supported* width knob
   (`header-panel.module.css` reads it on itself); the inset/border overrides convert the
   full-height rail into a floating card. The slide-in `translate` animation still works.
3. **Anchor below the avatar (R3b):** measure at open. In the avatar button's `onClick`, before
   toggling `profileOpen`, read the button's rect and store
   `panelTop = rect.bottom + 8` in a signal; render the wrapper as

   ```tsx
   <div style={{ display: 'contents', '--trade-panel-top': `${panelTop.value}px` } as CSSProperties}>
     <HeaderPanel className={styles['profilePanel']} …>
   ```

   Custom properties inherit into the top layer through the DOM tree, so the fixed-position
   popover sees the value. `display: contents` keeps the wrapper out of layout. (Signal write in
   an event handler — no hooks needed.)
4. Sanity: with the transparent header (B1) the panel now floats over page content — its own
   `--cascivo-color-surface` background (from the component) must remain; do not override it.

### B4 Full-viewport balanced grid at `64rem`+ (issue 4)

Restructure `App.module.css`'s `.grid` for `@media (min-width: 64rem)`; base/`40rem` behavior is
unchanged (stacked, page scroll, bottom-sheet ticket).

**Structure change in `App.tsx`:** replace the flat area-grid children with three explicit
column wrappers so each column can flex its panels independently:

```
<div grid>
  <div col colTicket>   OrderTicket
  <div col colCenter>   PriceChart, OrdersTable
  <div col colRight>    InstrumentSummary, Orderbook, TimeAndSales
```

Below `64rem` the three wrappers become plain stacked blocks (`display: contents` is NOT
suitable — keep them as normal divs and let the base styles stack their children full-width; the
current `grid-template-areas` for base/`40rem` are replaced by simple stacking of the three
wrappers, with the md two-up refinement applied *inside* `colRight` via its own grid).

**CSS at `64rem`+:**

```css
.grid {
  block-size: 100%;                     /* fill .main exactly */
  display: grid;
  grid-template-columns: 20rem minmax(0, 1fr) 23rem;
  gap: var(--cascivo-space-3);
  padding: var(--cascivo-space-3);
  overflow: hidden;
}
.col { display: flex; flex-direction: column; gap: var(--cascivo-space-3); min-block-size: 0; }
.colCenter > :first-child { flex: 1 1 62%; }   /* chart */
.colCenter > :last-child  { flex: 1 1 38%; }   /* orders */
.colRight  > :nth-child(1) { flex: 1 1 40%; }  /* summary */
.colRight  > :nth-child(2) { flex: 1 1 34%; }  /* orderbook */
.colRight  > :nth-child(3) { flex: 1 1 26%; }  /* tape */
.colTicket > :only-child   { flex: 1; }
```

Every panel Card must tolerate being height-constrained:

- All section panels get `min-block-size: 0; overflow: hidden` at `64rem`+ and scroll
  **internally**: OrderTicket body, InstrumentSummary body, Orderbook ladder, and the OrdersTable
  wrapper each get `overflow-y: auto` on their scrollable region (or an explicit `ScrollArea`).
  Keep `stickyHeader` on the DataTable so its header pins while the rows scroll.
- **Chart fills its flex share:** add `src/useElementSize.ts` — a helper that attaches a
  ResizeObserver inside `useSignalEffect` to a ref'd element and exposes
  `{ width, height }` signals (mirror the signal discipline of `useChartSize` in
  `packages/charts/src/core/use-chart.ts`; no `useState`/`useEffect`). In `PriceChart`, wrap the
  `<Candlestick>` in a `flex: 1; min-block-size: 0` div, measure it, and pass
  `height={Math.max(240, measured.height.value)}` instead of the fixed `360`. Subtract nothing —
  the measured div contains only the chart (header/controls/DataZoom sit outside it). Guard the
  first render (observer not yet fired) with the 240 floor. Below `64rem` keep a sensible
  fallback (the measured value works there too since the base layout gives the div natural
  height — if it collapses, fall back to 360; verify).
- **Time & Sales:** replace `ScrollArea height="18rem"` with a flex-fill (`height="100%"` inside
  a `flex: 1; min-block-size: 0` panel body) so the tape takes exactly its 26% share.
- **Orders:** keep `pagination={{ pageSize: 10 }}`; the cell scrolls when constrained.

**No-scroll acceptance:** at `64rem`+ the `.main` element must not scroll — `.grid` is exactly
`100%` of it and every child clamps. Do not set `overflow: hidden` on `.main` itself (it's
shared shell CSS); the guarantee comes from the grid not overflowing.

### B5 Tests to update/add (app)

- Existing `OrderTicket.test.tsx` / store tests are unaffected — verify they still pass.
- Add a `TopBar` test: opening the profile sets `--trade-panel-top` from the avatar rect (assert
  the wrapper's style attribute), and the panel content wrapper has no fixed `inline-size`.
- Add a smoke assertion for `useElementSize`: returns signals and disposes its observer on
  unmount (jsdom lacks ResizeObserver — stub it in `src/setup.ts` like the popover stubs).

---

## 5. Acceptance criteria (verify with headless Chromium against `vp preview`, as before)

At **1440×900** and **1728×1130**, dark theme:

1. Header: `getComputedStyle(shellHeader).backgroundColor` is transparent (`rgba(0, 0, 0, 0)`);
   brand, theme toggle, LIVE/Pause, portfolio pill, and avatar all visibly rendered.
2. No sidebar `<nav>` and no burger button; "Trading" (active, `aria-current="page"`) and
   "Research" render inside the header's nav landmark; clicking Research fires the stub toast
   and does not navigate.
3. Profile panel opened via avatar: `panel.getBoundingClientRect().right ≤ innerWidth`;
   `panel.top` equals avatar `rect.bottom + 8` (±2px); the panel `.body` has
   `scrollWidth ≤ clientWidth` (no internal horizontal scrollbar); all card right edges visible;
   Escape/light-dismiss and focus restore still work.
4. Layout: `document.scrollingElement.scrollHeight ≤ innerHeight`; the shell `.main` region has
   `scrollHeight ≤ clientHeight + 1`; all seven panels' bounding boxes lie fully inside the
   viewport; no dead band under the order ticket; chart + volume + DataZoom visible without
   clipping; tape and orders scroll internally.
5. Below `64rem` (e.g. 390×844): unchanged behavior — page scrolls, ticket opens as bottom
   sheet, no horizontal overflow.
6. Other demos (deploy/pay/flow/track/pulse): kit changes are opt-in — spot-check one demo
   renders its sidebar + burger exactly as before.
7. Gates: `pnpm ready` and `pnpm ready:ci` exit 0; `pnpm breakpoint:check` passes (only
   40/64/80rem literals); regen drift clean; all shell-header/kit/app tests green.

## 6. Execution order

```
A1 ShellHeaderNavLink.onClick + test + meta          → vp run @cascivo/components#test
A2 Kit AppShell headerNav/headerClassName/optional sideNav → demos' tests still green
B1 Transparent header                                → visual check, 3 themes
B2 Header nav items, sidebar gone                    → a11y: nav landmark, aria-current
B3 Profile panel width + measured top + floating card → Playwright checks (criterion 3)
B4 Viewport grid + useElementSize + chart/tape/orders fill → criterion 4 at both sizes
B5 Tests, then pnpm ready && pnpm ready:ci           → commit/push
```

## 7. Out of scope

- Any change to the shared `HeaderPanel`, `Sheet`, or layouts `AppShell` CSS (the Sheet
  `bottom`-variant bug and the candlestick x-axis label crowding remain separately-tracked
  issues from the original build).
- Mobile/tablet redesign — only the `64rem`+ composition changes.
- The mock banner stays (fixed-height treatment was considered and rejected; the measured
  panel-top makes the banner height irrelevant).
