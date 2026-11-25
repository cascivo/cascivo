# htmx + SolidJS + cascivo: gap analysis (no React)

Date 2026-11-25. Read-only analysis; no code changed. Counts come from `packages/css/contract.json`,
`registry.json`, `packages/elements/src/manifest.ts` and `crates/cascivo-html`. "Not checked" marks
claims I did not verify in code.

Priority: **P0** blocks a real htmx+Solid app, **P1** blocks parity with the React stack, **P2** polish.
Effort: **S** < 1 day, **M** 1-3 days, **L** > 3 days.

## 1. Coverage: React components vs cv-* / element / Solid

Registry: 214 components (146 contract units + 68 non-unit items), 12 blocks, 3 templates.

| Layer | Count | Note |
| ----- | ----- | ---- |
| Contract units (`cv-*` CSS + `data-*`) | 146 | static 65, native 21, behaviour 60 |
| Units with a Rust `.cv` emitter | 80 of 86 static+native | 6 allowlisted: code-snippet, indicator, inline-citation, input-group, qr-code, relative-time |
| Units with a light-DOM element | 7 tags: cv-menu, cv-tabs, cv-form, cv-combobox, cv-date-picker, cv-dialog, cv-toaster | cover ~8 of the 60 behaviour units |
| Solid component wrappers | 0 | `@cascivo/solid` has `defineIsland`, `cv-*` JSX typings, a Vite preset. No component library. |
| Not in the contract at all | 68 | below |

| Group (no cv-* contract) | Items | htmx/Solid path today |
| ------------------------ | ----- | --------------------- |
| Charts | 25 | `.cv` has 7 SVG charts (bar, line, ...); 18 chart types have none. `@cascivo/charts` is React-only. |
| Flow (diagram canvas) | 10 | none |
| Layout | 14 (app-shell, grid, flex, stack-likes, split-view, settings-layout, ...) | none as `cv-*`; adopters hand-write CSS |
| Sections / marketing | 6 (hero, cta, feature-grid, ...) | partly via cascivo-web templates; not checked per item |
| Editor | 2 (code-editor, highlight) | none |
| Blocks (page-level) | 10 | React only; `.cv` has page examples, no block parity |
| brand/logo | 1 | none |

Behaviour units (60) with no element, by need:

- **Popover family, CSS+native, may already work without JS (not checked):** popover, tooltip, toggletip, hover-card, toggle, toggle-group, segmented-control, swap, copy-button.
- **Need real JS:** data-table (sort/select/virtual), tree-view, virtual-list, infinite-scroll (htmx `revealed` may cover), reorder-list, resizable, carousel, calendar, time-picker, wheel-picker, color-picker, multi-select, tags-input, otp-input, file-uploader, editable, command-menu, context-menu, menubar, navigation-menu, drawer/sheet/bottom-sheet/action-sheet, pull-to-refresh, swipe-item, streaming-text, terminal, log-viewer.
- **Server-driven candidates (need server docs, not an element):** pagination, filter, side-nav, shell-header, header-panel.

## 2. Missing features vs the React stack

| # | Gap | Pri | Eff | Pkg |
| - | --- | --- | --- | --- |
| F1 | Elements for the 50+ behaviour units without one; start with the htmx-relevant set: data-table, pagination/filter (server-driven), drawer/sheet, popover/tooltip checks, multi-select, tags-input, command-menu, file-uploader, tree-view | P0 (top 6) / P1 | L | A |
| F2 | Elements and `@cascivo/solid` are `private: true`; the starter links them from a checkout. Adopters cannot `npm i` them | P0 | M | D |
| F3 | `cascivo add` / MCP / `llms.txt` know nothing of `@cascivo/css`, elements or Solid (only a mention in `scripts/llms/generate.ts`). No scaffold for the htmx+Solid stack except the cargo starter | P0 | M | D |
| F4 | No Solid component layer: Solid devs get typings and `defineIsland` only. Missing: typed wrappers over `classes`, form helpers, `useCascivoI18n`, theme toggle, signals bridge to `@cascivo/core` | P1 | L | B |
| F5 | Charts: 18 of 25 types have no SVG path outside React (`.cv` has 7). Server-side SVG for the rest, or a Solid chart island over `@cascivo/charts` | P1 | L | E (Rust) or B (Solid island) |
| F6 | Layouts / sections / flow / editor have no `cv-*` contract (68 items); G1/G3 gates cannot cover them | P1 | L | E |
| F7 | Forms: `cv-form` handles errors/422/double-submit. Missing: cv-field wiring for select/checkbox-group/radio-group/textarea errors, file upload multipart in `cascivo-server`, field arrays, async/server validators beyond 422 (not checked) | P1 | M | C |
| F8 | Routing: htmx `hx-boost` + `hx-push-url` handled by hand; no documented nested layout/partial-vs-full pattern, no active-nav marking (`aria-current`) helper, no `View` fallback for history restore (not checked) | P1 | M | C |
| F9 | i18n: elements read `labels` messages (`messages.ts`); server has `Accept-Language`/locale in cascivo-web only. No `cascivo-server` locale negotiation or `t()` in templates documented (not checked) | P1 | M | C |
| F10 | Theming: `theme_script()` exists. Missing: runtime theme/density switcher element, per-user theme in session, all 12 themes selectable without React | P2 | S | A |
| F11 | A11y primitives: elements reimplement focus trap/roving/typeahead per element; no shared `useRovingFocus`/`DismissableLayer` equivalent exported for Solid islands. `apg:check` covers React only (not checked) | P1 | M | A |
| F12 | SSR for Solid: islands are client-mounted with a placeholder; no Solid SSR/hydrate path (`renderToString` + `hydrate`) so island content flashes | P2 | L | B |
| F13 | Testing: Rust has `check_fragment`, oneshot router tests, `dynamic:check` (axe per swap). No Playwright/vitest helpers for adopters' elements or islands, no Solid testing-library recipe | P1 | M | B |
| F14 | Docs/site: `USING-CASCIVO-SERVER.md` is a guide; no docs site section, Storybook or live demos for elements and `cv-*` markup; per-unit pages show React only | P1 | L | D |
| F15 | Worker: `Hub` and `SqliteStore` native only; no Durable Objects or Queues; R2 multipart/streaming limits (not checked) | P2 | M | C |
| F16 | Auth: sessions + CSRF + OAuth providers exist per docs; passkeys / magic-link / rate limiting not documented (not checked) | P2 | M | C |
| F17 | Mixed htmx and Datastar on one page unsupported (documented limitation) | P2 | S | C |
| F18 | Known open items from the Rust stack results: first crates.io publish needs a manual token publish; `binaries` job never run; feeds carry description only | P1 | S | C |

## 3. Quality gaps

| # | Gap | Pri | Eff | Pkg |
| - | --- | --- | --- | --- |
| Q1 | `packages/solid` tests: 5 test files for `defineIsland`, typing generation and Vite plugin; no test of htmx swap lifecycle with a real htmx (dispose on swap, re-mount on `htmx:afterSettle`) | P1 | M | B |
| Q2 | Elements: 6 test files cover 4 of 7 (menu, combobox, date-picker have no `*.test.ts`) | P0 | S | A |
| Q3 | No per-element a11y (axe/APG keyboard) test; `apg:check` / `a11y` gates are React-component oriented | P1 | M | A |
| Q4 | Bundle budgets exist (3 KB/element, 15 KB/page, 10 KB/island) and `elements:check` runs; verify they are enforced for every new element and for `@cascivo/solid` itself (`audit:bundle` scope not checked) | P1 | S | D |
| Q5 | `cv-*` contract parity (G3) covers Rust emitters vs React; no parity gate between elements and the React behaviour (events, keyboard) | P1 | M | A |
| Q6 | `pack:check` / `isolated:check` do not exercise `@cascivo/elements` or `@cascivo/solid` (private; not checked) | P0 once F2 lands | S | D |
| Q7 | Solid type surface: `cv-elements.ts` is generated; `typings.check.tsx` exists. Island prop typing from Rust (`IslandKey`) is stringly typed; no generated TS types for island props | P2 | M | B+C |
| Q8 | Rust CI: `cargo clippy` for Workers target is documented; whether CI runs the wasm32 build and the worker tests on every PR is not checked | P1 | S | C |
| Q9 | cascivo-web build recompiles Rust (about 45 s) in site CI; no `target/` cache or prebuilt binary | P2 | S | D |
| Q10 | `cascivo-web` error for failed `{% include %}` hides the cause | P2 | S | C |
| Q11 | No visual/regression baselines for elements-driven pages (visual baselines are React) | P2 | M | D |

## 4. Work packages (parallel, no file overlap)

| Pkg | Theme | Gaps | Files it owns (exclusive) | Depends on |
| --- | ----- | ---- | ------------------------- | ---------- |
| **A** | Elements | F1, F10, F11, Q2, Q3, Q5 | `packages/elements/**`, `packages/solid/src/cv-elements.ts` (generated from the manifest, regenerate only), `scripts/checks/elements.test.ts`, `apps/examples/solid-htmx/src/elements.ts` | none |
| **B** | Solid layer | F4, F12, F13, Q1, Q7 (TS side) | `packages/solid/**` except `cv-elements.ts`, `apps/examples/solid-htmx/src/{island,htmx,ambient.d}.*`, `apps/examples/solid-htmx/vite.config.ts` | none |
| **C** | Server / Worker | F7, F8, F9, F15-F18, Q8, Q10, Q7 (Rust side) | `crates/cascivo-server/**`, `crates/cascivo-worker/**`, `crates/cascivo-web/**`, `apps/examples/solid-htmx/server/**`, `docs/USING-CASCIVO-SERVER.md`, `skills/cascivo-server/**` | none |
| **D** | Distribution, docs, gates | F2, F3, F14, Q4, Q6, Q9, Q11 | `packages/cli/**`, `packages/mcp/**`, `scripts/llms/**`, `scripts/checks/**` (except `elements.test.ts`), `package.json` (root), `.github/**`, `apps/site/**`, `packages/{css,elements,solid}/package.json` (publish flags only), `docs/ROADMAP.md`, `docs/CONTRACT.md` | Lands last for F2 (needs A/B stable), rest independent |
| **E** | Contract and Rust emitters | F5 (server SVG), F6, remaining 6 emitters | `crates/cascivo-html/**`, `crates/cascivo-tui/**` only if shared gen, `packages/components/{layout,section,flow,editor}/**` metas, `packages/components/test/html-conformance/**`, `scripts/contract/**`, `packages/css/**` | none |

Overlap rules: C and E both touch Rust but different crates; only A edits element sources, only E edits
`packages/css` and contract generation, and D owns `package.json` scripts so A/B/E must tell D about any
new gate instead of editing it. `registry.json` and `contract.json` are generated; commit regen output
from the package that changed them, and rebase before `pnpm regen` if two packages land the same day.

### Suggested order

1. Parallel start: A (Q2 + F1 top 6), B (Q1, F4 core), C (F7-F9, F18), E (F6 layouts first).
2. D starts with F3/Q4 (independent), then F2/Q6 once A and B tag their first release.
3. F5 charts and F12 Solid SSR are the last, largest items; both can slip without blocking an htmx+Solid MVP.
