# cascade — Roadmap v4: Console-Grade UI Shell

**Last updated:** 2026-06-11
**Status:** Shipped 2026-06-11 — all five tranches complete on `feature/v4-shell`
**Decisions baked in:** ShellHeader is a NEW component, the existing Header stays for marketing pages · SideNav is upgraded in place (API-additive) · all floating pieces build on the v3 `usePopover` primitive · compound wiring uses the established `createContext` + `Context.Consumer` render-prop pattern (never the `useContext` hook) · shell state is a plain signals object (`createShellState`), no React context

This document is the ground truth for v4. Like v1–v3, it is structured so an agent can pick up any milestone and execute it without additional context. Gap analysis source: `@carbon/react` UI Shell (Header, HeaderName, HeaderNavigation, HeaderMenu, HeaderMenuButton, HeaderGlobalBar, HeaderGlobalAction, HeaderPanel, Switcher, SideNav, SideNavItems, SideNavMenu, SideNavLink, rail variant, SkipToContent) compared against cascade `main` (2026-06-11).

---

## Vision

v3 made cascade deep and distinctive. v4 makes it the system you build a real **console application** with — the IBM Cloud / AWS Console / Grafana class of app: dense navigation, multiple panels, dropdown menus in the header, an icon rail when the nav is collapsed.

> Composing a production console shell with cascade must take minutes, not days — and the result must match or beat Carbon's UI Shell in capability, keyboard support, and visual quality.

One workstream serves that sentence: **the UI Shell family** — a header with dropdown navigation and global icon actions, a side nav that collapses to an icon rail with flyouts, right-side panels (app switcher, notifications, contextual aside), and an AppShell that wires them together responsively.

Everything inherits the standing cross-cutting rules: signals not hooks, CSS-only motion, manifests + registry + MCP + llms.txt regeneration in the same PR (drift gate), i18n built-in strings (en + de), perf budgets in CI.

---

## Current State (start of v4) — verified on `main` 2026-06-11

| Piece                  | State                                                                                                                                               | Gap vs Carbon UI Shell                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Header` (components)  | brand slot, flat link list, actions slot, sticky                                                                                                    | No dropdown nav menus, no global icon-action bar, no hamburger, no skip-to-content, no brand prefix                                                  |
| `SideNav` (components) | items with optional icons, ONE level of grouping (inline expand), rail mode hides labels via CSS, `title` attr as tooltip, built-in collapse toggle | Rail mode has no flyout for groups (sublinks unreachable), no real tooltips, no expand-on-hover, items without icons vanish in rail, no footer slot  |
| `AppShell` (layouts)   | header / sideNav / aside grid slots, left collapse with `persistedSignal`                                                                           | Aside is not collapsible, no mobile drawer (nav simply squeezes), no shared shell state for header buttons to drive, no skip-link target, no scrim   |
| Right panels           | `Sheet` exists (modal-ish slide-over)                                                                                                               | No non-modal header-attached panel (Carbon HeaderPanel), no app Switcher                                                                             |
| `Menu` / `Popover`     | v3 primitives on CSS Anchor Positioning + Popover API — solid foundation                                                                            | — (this is what we build on)                                                                                                                         |
| `@cascade-ui/icons`    | 36 icons                                                                                                                                            | Missing console staples: Bell, Home, Dashboard, Users, AppSwitcher/Grid, HelpCircle, LogOut, Folder, Server, Terminal, Database, Shield, Activity, … |

---

## Phase 1 — ShellHeader (the console header)

**Goal:** a single header component with everything a console top bar needs. Carbon equivalent: Header + HeaderName + HeaderNavigation + HeaderMenu + HeaderMenuButton + HeaderGlobalBar + HeaderGlobalAction + SkipToContent.

### Milestone 1.1 — ShellHeader component (`packages/components/src/shell-header/`)

- [ ] **Brand with prefix** — `brand: { prefix?, name, href? } | ReactNode` (Carbon's "IBM **Cloud**" pattern; prefix regular weight, name semibold).
- [ ] **Nav with dropdown menus** — `nav: (link | { label, items })[]` discriminated by `items`. Dropdown entries render a trigger button + anchored panel built on `usePopover` (`role="menu"`, items `role="menuitem"`). Keyboard: Enter/Space/ArrowDown opens and focuses first item; ArrowUp/Down cycle; Escape closes and restores trigger focus. A menu containing an `active` child renders the trigger in active state.
- [ ] **Global icon actions** — `actions: { id, label, icon, active?, onClick }[]` rendered as a right-aligned bar of 40×40 icon buttons (tooltip = `label`, `aria-pressed` when `active`). This is what opens notification/switcher panels in Phase 3.
- [ ] **Hamburger menu button** — rendered when `onMenuClick` is provided; `aria-expanded` from `menuExpanded` prop. Drives the AppShell drawer/collapse in Phase 4.
- [ ] **Skip to content** — visually-hidden link, visible on focus, `href` defaults to `#cascade-main`; opt out with `skipToContentHref: false`.
- [ ] **End slot** — `end: ReactNode` for free-form content (user avatar menu, theme switcher).
- [ ] i18n strings `cascade.shellHeader.*` (en + de); `labels` prop overrides per instance.
- [ ] Fixed height via `--cascade-shell-header-block-size` (default `3rem`, Carbon's 48px).

### Milestone 1.2 — quality bar

- [ ] axe-core clean (Storybook a11y story with `play` opening a dropdown).
- [ ] All dropdown motion via `@starting-style` + `allow-discrete` (house style); zero JS positioning (anchor positioning via `usePopover`).
- [ ] The existing `Header` is untouched and documented as the marketing/landing header; docs cross-link the two.

---

## Phase 2 — SideNav v2 (the icon rail done right)

**Goal:** collapse must produce a genuinely usable icon rail — icons render alone, every item stays reachable, groups open as flyouts.

### Milestone 2.1 — Rail mode rework (`packages/components/src/side-nav/`, in place, API-additive)

- [ ] **Icons-only rail** — collapsed state renders icon-only items centered in a `--cascade-sidenav-rail-inline-size` (default `3rem`) rail. Labels are removed from the layout (not just visually hidden behind overflow).
- [ ] **Icon fallback** — items without an `icon` render the first grapheme of their label in a styled circle so nothing disappears in rail mode.
- [ ] **Tooltips in rail** — rail items get real tooltips (existing `Tooltip` component), not `title` attributes.
- [ ] **Group flyouts in rail** — a collapsed group opens its sublinks in an anchored flyout panel (built on `usePopover`, `role="menu"`); Enter/Space/click opens, arrows navigate, Escape closes and restores focus. Today sublinks are unreachable in rail mode — this is the critical fix.
- [ ] **Expand-on-hover** — opt-in `expandOnHover` prop: the rail expands to full width as an overlay while hovered (CSS-only width transition, `position: absolute` overlay so content doesn't reflow). Carbon rail parity.
- [ ] **Footer slot** — `footer: ReactNode` rendered above the collapse toggle (sign-out link, version tag).
- [ ] Existing API (`items`, `collapsed`, `defaultCollapsed`, `onCollapsedChange`, labels) unchanged — strictly additive.

### Milestone 2.2 — Icon set expansion (`packages/icons`)

- [ ] ~24 new console-staple icons via the existing `createIcon` factory: Bell, Home, Dashboard, Users, Grid (app switcher), HelpCircle, LogOut, Folder, File, Filter, BarChart, Globe, Lock, Server, Terminal, Database, Key, Shield, CreditCard, Inbox, Tag, Zap, Layers, Activity.
- [ ] All 24 in the icons docs page + Storybook grid story; tree-shaking verified (importing one icon must not pull the others into a bundle).

---

## Phase 3 — Right-side surfaces

**Goal:** the right edge of a console: transient header panels (notifications, app switcher) and a persistent collapsible aside.

### Milestone 3.1 — HeaderPanel (`packages/components/src/header-panel/`)

- [ ] Non-modal panel anchored under the header at the inline-end edge: `position: fixed`, `inset-block-start: var(--cascade-shell-header-block-size)`, full remaining height, `--cascade-shell-panel-inline-size` (default `20rem`) wide.
- [ ] `popover="auto"` → light-dismiss + Escape for free; slide-in via `@starting-style`.
- [ ] Props: `open`, `onClose`, `label` (aria-label), `children`. Focus moves into the panel on open and returns to the invoker on close.
- [ ] Pairs with ShellHeader actions: an action with `active: true` shows pressed state while its panel is open.

### Milestone 3.2 — Switcher (`packages/components/src/switcher/`)

- [ ] App/product switcher list for use inside a HeaderPanel (Carbon Switcher/SwitcherItem/SwitcherDivider): `items: ({ label, href, active?, icon? } | { divider: true })[]`.
- [ ] `role="list"`; active item `aria-current="page"`; keyboard = plain links (no roving focus needed).

### Milestone 3.3 — Collapsible aside (lands in Phase 4's AppShell)

- [ ] The AppShell `aside` slot becomes collapsible with its own persisted state — see Milestone 4.1.

---

## Phase 4 — AppShell v2 (wiring + responsive)

**Goal:** the shell that assembles everything, owns the responsive behavior, and exposes state the header can drive.

### Milestone 4.1 — Shell state + collapsible aside (`packages/layouts/src/app-shell/`)

- [ ] **`createShellState(options?)`** — exported factory returning a plain signals object `{ sideNavCollapsed, sideNavOpen, asideOpen, toggleSideNav(), toggleAside() }`. No React context. `persistKey` persists `sideNavCollapsed` and `asideOpen` via `persistedSignal` (`<key>.sidenav`, `<key>.aside`).
- [ ] `toggleSideNav()` resolves breakpoint at call time (`matchMedia('(min-width: 64rem)')`): desktop → toggles `sideNavCollapsed`; mobile → toggles the `sideNavOpen` drawer.
- [ ] AppShell accepts `state?: ShellState` (creates one internally when omitted — existing zero-config behavior preserved); existing props keep working unchanged.
- [ ] **Collapsible aside** — `asideOpen` drives the right column (`--cascade-shell-aside-inline-size`, default `18rem`); animated open/close.
- [ ] `main` region gets `id="cascade-main"` + `tabIndex={-1}` — the ShellHeader skip-link target.

### Milestone 4.2 — Responsive behavior

- [ ] Below `64rem`: side nav becomes a fixed overlay drawer (closed by default) with a scrim; scrim click and Escape close it; ShellHeader's hamburger opens it. Above: current grid behavior.
- [ ] Aside hides below `64rem` (consoles relegate detail panels on mobile; revisit on demand).
- [ ] All transitions CSS-only; `prefers-reduced-motion` collapses them to instant.

### Milestone 4.3 — Console block (the dogfood proof)

- [ ] `block/console-app` (`packages/layouts/src/blocks/`): ShellHeader (brand prefix, two dropdown nav menus, notification + app-switcher + help actions), SideNav (icons, one nested group, rail collapse), HeaderPanel × 2 (notifications list, Switcher), collapsible aside (details panel), content = PageHeader + DataTable. The "build me a console" one-liner — and the Carbon-parity demo.
- [ ] Block appears in registry, docs blocks page, and Storybook.

---

## Phase 5 — Integration & Gates

- [ ] Every new/changed component: manifest, registry, schema enum, componentMap, MCP, llms.txt, stories (default + a11y), docs demo, i18n strings en + de — same-PR drift gate.
- [ ] axe-core: zero violations on ShellHeader (menu open), SideNav (rail + flyout open), HeaderPanel (open), console-app block.
- [ ] Visual regression baselines for the console-app block in all five themes.
- [ ] Bundle budget: `@cascade-ui/react` stays < 60 KB gzip after the shell family lands (raised from 50 KB — recorded decision; the shell family is the single biggest component cluster shipped to date).
- [ ] v4 Definition of Done checklist mirrors this doc; final tranche verifies line by line.

### Carbon-parity acceptance checklist (the DoD core)

A console built from the `console-app` block must have, working end to end with keyboard + screen reader:

1. Header brand with prefix · 2. top-nav dropdown menus · 3. global icon actions · 4. notifications panel · 5. app switcher panel · 6. skip-to-content · 7. left nav with icons · 8. nested nav group · 9. collapse to icon rail showing **icons only** · 10. rail flyout for nested groups · 11. expand-on-hover rail (opt-in) · 12. collapsible right aside · 13. mobile drawer with scrim · 14. state persisted across reloads.

---

## Sequencing & Tranche Sketch

| Tranche | Content                                                                        | Depends on               |
| ------- | ------------------------------------------------------------------------------ | ------------------------ |
| T1      | ShellHeader (Phase 1)                                                          | — (Menu/Popover from v3) |
| T2      | SideNav v2 rail rework + icons expansion (Phase 2)                             | — (parallel to T1)       |
| T3      | HeaderPanel + Switcher (Phase 3.1 + 3.2)                                       | — (parallel to T1/T2)    |
| T4      | AppShell v2: shell state, collapsible aside, responsive, console block (Ph. 4) | T1, T2, T3               |
| T5      | Integration sweep, parity checklist, DoD verification (Phase 5)                | all                      |

Open questions for the human before T1 planning:

1. ShellHeader vs upgrading Header in place — proposal is a NEW component (marketing header and console header have diverging needs); confirm.
2. Bundle budget raise 50 → 60 KB gzip for `@cascade-ui/react` — confirm, or shell family ships as copy-paste-only (not in the prebuilt package)?
3. Aside on mobile: hidden entirely (proposal) or bottom sheet?
