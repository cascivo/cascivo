# cascivo — Roadmap v32: Bug Sprint — Demos, Scroll, Previews

**Last updated:** 2026-06-16
**Status:** 🚧 Planning
**Plan documents:** `docs/superpowers/plans/2026-06-16-v32-master-plan.md` + tranches 1–4

---

## Vision

v31 shipped 12 new components and a systematic `-content` token layer. Three user-visible bugs came with or since it. v32 fixes them before any new features land.

---

## Bug 1 — Landing live demo links: "Page not found"

**Where it appears:** On the landing `/examples` page, clicking "Open live demo →" for any of the five showcase demos (Cascade Deploy, Pay, Flow, Track, Pulse) results in a "Page not found" screen.

**Root cause:** The landing is a signal-driven SPA. `initRouter()` in `apps/landing/src/router.ts` intercepts **all** same-origin anchor clicks and routes them through the SPA's client-side signal router. But `/demos/<slug>/` are not SPA routes — they are separate Vite SPAs assembled at build time into `apps/landing/dist/demos/<slug>/` by `scripts/assemble-demos.mjs`. When the SPA router tries to match `/demos/deploy/` against its `ROUTES` table, it finds nothing and renders `<NotFound />`.

**Fix:** Add a one-line guard in `initRouter()` to skip interception for paths starting with `/demos/`. The browser then performs a full navigation to the assembled SPA.

**Files changed:** `apps/landing/src/router.ts` (1 line added)

---

## Bug 2 — Docs SideNav: missing scrollbar when groups expand

**Where it appears:** In the docs app (`apps/docs`), opening a SideNav group (e.g. "Inputs" with ~40 sub-items) expands it. Items below the visible area are unreachable — there is no scrollbar inside the sidenav to scroll down to them.

**Root cause:** `.sideNav` in `packages/components/src/side-nav/side-nav.module.css` sets `overflow: hidden`. This prevents both horizontal overflow (needed during the collapse width animation) and vertical overflow (scrolling to off-screen items). Both axes are blocked.

**Fix:** Replace `overflow: hidden` with `overflow-x: hidden; overflow-y: auto`. The x-axis clipping (collapse animation) is preserved; the y-axis becomes scrollable.

**Files changed:** `packages/components/src/side-nav/side-nav.module.css` (1 property changed)

---

## Bug 3 — Docs home: empty component card previews

**Where it appears:** The docs home page renders every registry component as a card with a live preview in the "Components" section. ~40 cards show empty preview slots.

**Root cause:** `apps/docs/src/pages/Home.tsx` renders `demos[item.name]?.()` for each card. ~40 components have no entry in the `demos` record in `apps/docs/src/demos.tsx`. This includes all v31 additions that lack demos (Steps, Filter, Dock, Chat Bubble, Swap, Radial Progress, Progress) plus ~30 pre-existing components that were never wired up.

Additionally, 8 overlay/portal/invisible components are not in the `SKIP_PREVIEW` set (which suppresses the empty slot). They show blank cards when they should show nothing.

**Fix in two parts:**

1. Expand `SKIP_PREVIEW` in `Home.tsx` with 8 additional names: `dock`, `drawer`, `header`, `menubar`, `navigation-menu`, `skip-nav`, `toggletip`, `visually-hidden`.
2. Add 30 static/display demos to `demos.tsx` (T2) — components whose preview needs no interactive state.
3. Add 9 interactive demos to `demos.tsx` (T3) — components whose preview requires `useState`.

**Files changed:** `apps/docs/src/pages/Home.tsx`, `apps/docs/src/demos.tsx`

---

## Workstreams

| #   | Workstream                  | Tranche | Summary                                                                             |
| --- | --------------------------- | ------- | ----------------------------------------------------------------------------------- |
| A   | Quick fixes                 | T1      | `router.ts` guard + `side-nav.module.css` overflow fix — one change each           |
| B   | Docs previews (static)      | T2      | SKIP_PREVIEW += 8 items; 30 new static demos added to `demos.tsx`                  |
| C   | Docs previews (interactive) | T3      | 9 interactive demos (require `useState`) added to `demos.tsx`                       |
| D   | Gate                        | T4      | Full CI gate: format + lint + build + type-check + tests + drift + breakpoints      |

---

## Cross-cutting rules

1. No functional changes to existing demos — additions only.
2. No existing `SKIP_PREVIEW` entries removed.
3. Every new demo function uses the actual component's documented public API. No placeholder divs, no generic wrappers that bypass the component.
4. Run `pnpm exec vp check` after each tranche before committing.
5. `pnpm exec vp run @cascivo/components#test` must pass after T1 (sidenav CSS change).

---

## Definition of Done

### T1 — Quick fixes

- [ ] Clicking "Open live demo" on `/examples` triggers a full browser navigation to `/demos/<slug>/`, not a SPA route change.
- [ ] `apps/landing/src/router.ts` contains `if (url.pathname.startsWith('/demos/')) return` inside `initRouter()`.
- [ ] Expanding a large SideNav group (e.g. "Inputs") produces a vertical scrollbar and all items are reachable by scrolling.
- [ ] `packages/components/src/side-nav/side-nav.module.css` `.sideNav` has `overflow-x: hidden; overflow-y: auto`, not `overflow: hidden`.
- [ ] `pnpm exec vp run @cascivo/components#test` exits 0.
- [ ] `pnpm exec vp check` exits 0.

### T2 — Docs previews (static)

- [ ] `SKIP_PREVIEW` in `Home.tsx` includes all 8 additions: `dock`, `drawer`, `header`, `menubar`, `navigation-menu`, `skip-nav`, `toggletip`, `visually-hidden`.
- [ ] All 30 static demos render a visible, non-empty preview in the docs home cards.
- [ ] No new `useState`, `useEffect`, or signal imports introduced in T2 demos.
- [ ] `pnpm exec vp check` exits 0.

### T3 — Docs previews (interactive)

- [ ] All 9 interactive demos render a visible, interactive preview.
- [ ] All new demo wrapper functions use `useState` from `preact/hooks` (docs app is Preact).
- [ ] `pnpm exec vp check` exits 0.

### T4 — Gate

- [ ] `pnpm exec vp check` exits 0.
- [ ] `pnpm build` exits 0.
- [ ] `pnpm exec vp run -r check` exits 0.
- [ ] `pnpm test` exits 0.
- [ ] `pnpm regen && pnpm exec vp check --fix && git diff --exit-code` exits 0.
- [ ] `pnpm breakpoint:check` exits 0.
