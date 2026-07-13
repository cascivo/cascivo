# Improvements plan: the "Vercel dashboard" experience report

**Source:** a hands-on experience report from a developer who built a Vercel-style dashboard
(project-card grid, project switcher, context menus, usage sparklines) on top of cascivo. The
report praised setup speed, layer isolation, and the flex/grid primitives, but concluded that
cascivo is a **layout-only, CSS-native system with no interactive-behavior or data-viz layer** —
that focus traps, arrow-key menu navigation, outside-click dismissal, comboboxes, accessible
tabs, and sparklines all have to be hand-wired in userland.

## TL;DR — the report's premise is factually wrong, and that is the finding

Every capability the report calls "missing" already ships, is tested, and is registered/discoverable
through all five surfaces (registry, MCP, docs, CLI, skills). An audit of the codebase found:

| Report claim ("missing / hand-wire it yourself") | Reality in this repo | Evidence |
| --- | --- | --- |
| Focus traps | Native `<dialog>.showModal()` in `modal`, `command-menu`; `FocusScope` primitive exists and is exported | `packages/components/src/modal/modal.tsx:51`, `packages/core/src/focus-scope.tsx`, `packages/react/src/index.ts:68` |
| Arrow-key menu navigation | Wired in `dropdown`, `menu`, `combobox`, `multi-select`, `command-menu`, `tabs` | `dropdown.tsx:129-158`, `menu.tsx:53-74`, `tabs.tsx:56-72` |
| Outside-click dismissal | Native Popover `toggle` (`dropdown`/`menu`/`popover`/`multi-select`/`context-menu`), backdrop-click (`modal`/`command-menu`), `DismissableLayer` primitive exists | `packages/core/src/dismissable-layer.tsx`, `use-popover.ts:96-107` |
| Comboboxes | `combobox`, `command-menu`, `multi-select` — all searchable, all ARIA-complete | `packages/components/src/combobox/combobox.tsx` (~286 lines) |
| Accessible tabs | `tabs` — full roving `tabIndex` + `role=tablist/tab/tabpanel` + arrow/Home/End | `packages/components/src/tabs/tabs.tsx:56-72` |
| Project switcher | Dedicated `switcher` component + `dropdown` | `packages/components/src/switcher/switcher.tsx` |
| Sparklines / micro-charts | `Sparkline` component + 24 other charts, full engine (scales/shapes/voronoi/decimation/streaming), token-driven | `packages/charts/src/charts/sparkline/sparkline.tsx`, `packages/charts/src/index.ts` |
| Time-series / usage charts | `LineChart`/`AreaChart` with time axes, brush, data-zoom, live streaming | `packages/charts/src/charts/line-chart/line-chart.tsx`, `stream/use-stream-series.ts` |
| Whole dashboards | Pre-built blocks: `dashboard-charts`, `stats-cards`, `console-app`, `sidebar-app`, `users-table-page`; five example apps ("feels like Vercel/Datadog/Stripe/Linear/Trade Republic") | `packages/layouts/src/blocks/`, `apps/examples/{deploy,pulse,trade,pay,track}` |

The registry lists **192 components** (125 component / 25 chart / 14 layout / 10 block / …), the MCP
server exposes 20 tools over that registry (`list_components` supports `category: 'chart'`), the docs
site nav is registry-driven and renders a live `ChartsPage`, and `cascivo list` prints a dedicated
`Charts (npm: @cascivo/charts)` group.

**So the real defect the report exposes is not a capability gap — it is a perception + point-of-need
discovery gap:** a competent developer used the system for hours and never formed the mental model
that the behavior layer, the charts package, and the dashboard blocks exist. That is a positioning
and first-touch problem, and it is worth fixing because every user who arrives with "cascivo = the
CSS-native layout system" (the tagline's first three words) is primed to repeat this mistake.

The audit also surfaced **two genuine, small code/consistency defects** worth fixing regardless.

This plan has two tracks:

- **Track A (code/consistency defects)** — Phases 1–2. Real bugs found while disproving the report.
- **Track B (the actual signal: perception + discovery)** — Phases 3–5. Stop future users from
  concluding the behavior/charts/dashboard layers don't exist.

Each phase is independently commit-able and has its own verification gate. Phase 1 is a must-fix
(a manifest that documents behavior the code does not implement). Track B is the heart of the
report response; Phases 3–5 can be delivered incrementally.

---

## Phase 1 — Fix `context-menu`: implement the keyboard nav its manifest already promises

**Severity: real bug.** `context-menu.meta.ts` advertises an accessibility contract the component
does not honor.

**Symptom.** `packages/components/src/context-menu/context-menu.meta.ts:30` declares
`keyboard: ['ArrowDown', 'ArrowUp', 'Enter', 'Space', 'Escape']`, and line 81 states items have
"tabIndex management." But `context-menu.tsx` (~99 lines) has **no `onKeyDown` handler and no roving
focus** — `grep -n "onKeyDown\|ArrowDown" context-menu.tsx` returns nothing. Items are focusable but
you cannot move between them with the arrow keys. This is the one interactive component the overlay
audit rated PARTIAL; every sibling (`dropdown`, `menu`) implements this.

**Root cause.** The component was shipped with a manifest describing intended behavior; the keyboard
handler was never added.

**Fix.** Add roving arrow-key navigation to the menu container, matching the established pattern in
`packages/components/src/menu/menu.tsx:53-74`. Prefer adopting the shared
**`useRovingFocus`** primitive from `@cascivo/core` (`packages/core/src/roving-focus.ts`) rather than
hand-rolling another inline `nextElementSibling` walk — this is exactly the substrate CLAUDE.md's
"Consume shared headless primitives" rule mandates, and it keeps the fix from adding to the drift
addressed in Phase 2. Behavior to implement:

- `ArrowDown` / `ArrowUp`: move focus to next/previous enabled `role="menuitem"`, wrapping; skip
  `aria-disabled` items and `role="separator"`.
- `Home` / `End`: first / last enabled item.
- `Enter` / `Space`: activate the focused item.
- `Escape`: close (already handled by native popover; keep it consistent).
- On open, focus the first enabled item.

Do **not** re-architect the component's native-Popover open/close mechanics — only add the
keyboard/focus layer. Keep the change surgical.

**Manifest reconciliation.** If `Home`/`End` are added, update
`context-menu.meta.ts:30` to include them so the manifest and implementation match exactly. The
`accessibility.description` (line 81) should describe the real roving behavior.

**Regression test.** Add to `context-menu.test.tsx`: open the menu, assert `ArrowDown` moves focus to
the first/next item and `ArrowUp` wraps, and that a disabled item is skipped. This test must fail
against the current code and pass after the fix.

**Guard against recurrence.** Investigate whether `scripts/checks/claims.test.ts` (or
`manifest-completeness.test.ts`) can assert that a component whose manifest lists arrow keys actually
renders a keydown handler / roving container. If a cheap static assertion is possible, add it; if not,
note in the PR why not. (Optional — do not overbuild a bespoke checker if it is non-trivial.)

**Verify.**

```sh
pnpm exec vp run @cascivo/components#test   # new context-menu test passes
pnpm primitives:check                       # still green (useRovingFocus adoption is compliant)
pnpm ready                                  # full gate
```

---

## Phase 2 — Reconcile CLAUDE.md's primitive-adoption rule with reality

**Severity: architecture drift / documentation lie.** CLAUDE.md and the code disagree about how a11y
mechanics are implemented, and the report's "everything feels hand-wired" impression is a downstream
symptom of that inconsistency.

**Findings from the audit.**

1. CLAUDE.md ("Consume shared headless primitives") states interactive components **must** use
   `useRovingFocus` for arrow navigation and `DismissableLayer` for outside-click dismissal, "never"
   the hand-rolled equivalents. In practice:
   - Arrow-key nav is hand-rolled inline in `dropdown`, `tabs`, `multi-select`, `combobox`,
     `command-menu` (and, after Phase 1, would be the *only* place `useRovingFocus` is used).
     `useRovingFocus` is currently consumed by **~0** shipped components.
   - Outside-click dismissal is done via the **native HTML Popover API** (`popover="auto"` +
     `toggle` event) in most overlays, not `DismissableLayer`. `DismissableLayer` is consumed by
     ~0 shipped components.
2. `scripts/checks/primitive-adoption.test.ts` only enforces three things: no static aria-id
   literals, no `Math.random()` ids, no raw `document.addEventListener('mousedown'|'click'|
   'pointerdown')`. It does **not** enforce `useRovingFocus` usage, and native Popover `toggle`
   listeners pass it. So the check is green while the "must use these primitives" prose is violated
   wholesale — the rule is aspirational, not enforced.

**This is not a request to rip out the native Popover API.** Native `<dialog>`/`popover="auto"` is a
legitimate, better platform primitive for focus-trap and light-dismiss, and switching away from it
would be a large, risky refactor for no user benefit. The defect is that **the written rule claims
one thing and the codebase does another**, which (a) misleads contributors and AI agents authoring
new components, and (b) leaves the shared `useRovingFocus`/`DismissableLayer` primitives as dead-ish
code that new work won't reach for.

**Decision required (surface to the maintainer — see "Open questions").** Pick one reconciliation:

- **Option A (recommended, low-risk): make the docs match the code.** Rewrite the CLAUDE.md
  "Consume shared headless primitives" table to sanction the native-platform approach explicitly:
  native `<dialog>.showModal()` for focus trap, `popover="auto"` + `toggle` for light-dismiss, with
  `FocusScope`/`DismissableLayer` positioned as the fallback for cases the platform APIs can't
  cover (e.g. non-popover floating panels, nested custom layers). Keep `useRovingFocus`/
  `useTypeahead` as the mandated substrate for **in-list arrow/type navigation** (the part the
  platform does *not* give you), and back Phase 1's context-menu fix — and, as follow-up, the
  existing inline arrow walks — with `useRovingFocus` so the mandate is actually true. Update
  `primitive-adoption.test.ts`'s header comment to match.
- **Option B (higher effort): make the code match the docs.** Migrate the overlays' dismissal to
  `DismissableLayer` and arrow nav to `useRovingFocus`. This is the `combobox`/`date-picker`/
  `date-range-picker` outside-click allowlist items already flagged as follow-up in
  `primitive-adoption.test.ts:31-49`, plus a broader roving-focus migration. Larger blast radius;
  needs visual/layout review per component.

**Recommended scope for this plan:** Option A. Concretely:

1. Edit the CLAUDE.md primitives table + surrounding prose to describe the sanctioned native-platform
   path and the true role of each core primitive.
2. Migrate the inline arrow-key walks in `dropdown` and (post-Phase-1) `context-menu` to
   `useRovingFocus` as the reference adoption, so the primitive has real consumers and new components
   have a pattern to copy. Leave `tabs`/`combobox`/`multi-select` as tracked follow-up unless trivial.
3. Extend `primitive-adoption.test.ts` only if Option A introduces a newly-enforceable invariant;
   otherwise just fix its header comment to stop describing an unenforced rule.

**Verify.**

```sh
pnpm primitives:check
pnpm exec vp run @cascivo/components#test
git grep -n "useRovingFocus" packages/components/src   # now has real consumers
pnpm ready
```

---

## Phase 3 — Positioning: stop first-touch surfaces from reading as "CSS-only layout"

**Severity: the core signal.** The report author's entire conclusion flows from a mental model formed
in the first minutes: "native CSS layers, zero-dependency, layout-focused." The behavior layer, the
25-chart package, and the dashboard blocks never entered their model. The first-touch surfaces
under-sell everything except CSS.

**Goal.** Make it impossible to spend an hour with cascivo and not know that it ships (a) a full
accessible interactive-component set, (b) a charts package, and (c) ready-made dashboard blocks.

**Changes (pick the surfaces that exist; keep copy factual and short — no marketing inflation).**

1. **`README.md` (root) and `docs/GETTING-STARTED.md`** — the lead paragraph / feature bullets must
   name the three under-discovered pillars alongside the CSS story. Suggested factual framing:
   "125 interactive components with built-in keyboard nav, focus management, and ARIA · 25 charts
   (`@cascivo/charts`) including sparklines and live time-series · pre-built dashboard blocks." Pull
   the exact counts from `registry.json` at authoring time so they stay accurate.
2. **`apps/site/public/llms.txt`** — verify the intro/overview section states the interactive +
   charts + dashboard capabilities up front (it references charts 58× but confirm the *opening*
   orientation an agent reads first makes the behavior layer explicit). This is the file the
   `cascivo:design-page` skill tells agents to read first; if it leads with layout, agents inherit
   the same blind spot.
3. **Landing / marketing hero** (`apps/site/src/marketing/` or `apps/landing/`, whichever is the live
   hero) — ensure at least one above-the-fold proof point for interactive components and one for
   charts/dashboards, not only tokens/themes/layout. A link to the five example apps
   (`apps/examples/{deploy,pulse,trade,pay,track}`) is the strongest single proof — surface it
   prominently.

**Non-goal.** Do not restyle the site or rewrite the whole marketing narrative. Surgical copy/link
additions to the first screen and the two agent-facing text files only.

**Verify.**

```sh
pnpm exec vp run @cascivo/site#build
pnpm exec vp run @cascivo/landing#build   # if it builds without a prior full build, mind the aliases in CLAUDE.md
git diff --stat                            # confirm the change is copy/links, not a redesign
```

---

## Phase 4 — Point-of-need: a concrete "build a dashboard" recipe + skill mapping

**Severity: the direct antidote.** A developer who asks for exactly what the report describes should
be handed the exact parts, by name, in one place. Today `cascivo:design-page` is generic (read the
registry, call `scaffold_view`) and never says "for a Vercel-style dashboard, use these."

**Changes.**

1. **New docs recipe** — e.g. `docs/RECIPES-DASHBOARD.md` (or a docs-site route if recipes live in
   `apps/site`; match the existing docs convention). A task-oriented walkthrough of building a
   Vercel-style console that maps each need to the shipped part:

   | Dashboard need (from the report) | Use | Package/registry id |
   | --- | --- | --- |
   | Project switcher (top-left) | `Switcher` / `Dropdown` | `switcher`, `dropdown` |
   | Command palette (⌘K) | `CommandMenu` | `command-menu` |
   | Right-click / row actions | `ContextMenu` / `OverflowMenu` | `context-menu`, `overflow-menu` |
   | Project-card grid | `Card` + `Stack`/grid + `Badge`/`RelativeTime` | `card`, `badge`, `relative-time` |
   | KPI / usage numbers | `Stat`, `KpiRow`, `stats-band` | `stat`, `chart/kpi`, `section/stats-band` |
   | Usage sparklines | `Sparkline` | `chart/sparkline` |
   | Time-series usage charts | `AreaChart` / `LineChart` (live via `useStreamSeries`) | `chart/area-chart`, `chart/line-chart` |
   | Whole dashboard scaffold | `dashboard-charts` / `stats-cards` blocks; `console-app` layout | `block/dashboard-charts`, `layout/console-app` |
   | Data table of deployments | `DataTable` | `data-table` |

   Include a short copy-paste starter that composes a `Stat` with an inline `Sparkline` (see Phase 5)
   and links to the `apps/examples/deploy` ("feels like Vercel") app as the full reference.

2. **Enhance the `cascivo:design-page` skill** (`skills/cascivo-design-page/SKILL.md`) — add a short
   "Common page recipes" section that, when the request is a dashboard/console/analytics page, tells
   the agent the concrete component set above **before** it falls back to generic `scaffold_view`.
   This closes the loop for AI-driven builds (the primary audience per the "AI-first" principle).

**Verify.**

```sh
pnpm exec vp check --fix        # docs/markdown lint + format
# If the recipe is a docs-site route: pnpm exec vp run @cascivo/site#build
pnpm exec node --test scripts/checks/docs-routes.test.ts   # if a new route was added
git diff --exit-code                                       # drift check after regen, if the recipe feeds any generator
```

---

## Phase 5 — Charts ergonomics: surface the `Stat` + `Sparkline` composition

**Severity: minor ergonomics.** The report author "wrote custom SVG layout mathematics from scratch"
for micro-charts. `Sparkline` already exists and is token-scaled; the gap is that the
`Stat`-with-inline-sparkline pattern (the canonical dashboard KPI tile) isn't shown anywhere obvious.

**Investigate first, then do the minimal thing.**

1. Check whether `Stat` (`packages/components/src/stat/stat.tsx`) already accepts a slot/children for
   a trailing visual. If it does, **no component change is needed** — just document the composition in
   the Phase 4 recipe and ensure a demo exists.
2. Check the existing KPI demos — `packages/charts/src/charts/kpi/`, `apps/site` `KpiRow.tsx`,
   `section/stats-band` — for a `Stat + Sparkline` example. If one exists, link it from the recipe.
3. **Only if** neither exists and `Stat` cannot cleanly host a sparkline: add an optional `chart`/
   `visual` slot to `Stat` (a single optional `ReactNode` prop rendered in the tile), update
   `stat.meta.ts`, and add a test. Follow CLAUDE.md component rules (no `useState`/`useEffect`, i18n
   defaults, mobile sweep). Keep it to one optional prop — do not build a charting API into `Stat`.

**Verify.**

```sh
pnpm exec vp run @cascivo/components#test
pnpm regen && pnpm exec vp check --fix && git diff --exit-code   # if stat.meta or registry changed
pnpm ready
```

---

## Open questions for the maintainer

1. **Phase 2 direction** — Option A (docs match code; sanction native Popover, mandate
   `useRovingFocus` only for in-list nav) vs Option B (code match docs; migrate to
   `DismissableLayer`/`useRovingFocus` everywhere). This plan recommends A. Confirm before Phase 2.
2. **Track B scope** — Phases 3–5 are the substantive response to the report but are largely
   docs/positioning. Confirm whether all three are in scope for this branch, or whether to land
   Track A (the real code fixes) first and split Track B into its own PR.
3. **Recipe home** — should the dashboard recipe be a `docs/*.md` file or a first-class route in
   `apps/site`? Match whatever the current recipe/guide convention is (there is no `RECIPES-*.md`
   today; `docs/GETTING-STARTED.md` and `docs/HEADLESS.md` are the closest neighbors).

## Suggested sequencing

1. **Phase 1** (context-menu bug) — small, high-value, independently shippable. Do first.
2. **Phase 2** (primitive reconciliation, Option A) — depends on the Phase 1 fix using
   `useRovingFocus`. Answer open question 1 first.
3. **Phases 3–5** (perception + discovery) — the report's real payload. Land after Track A, or in a
   parallel PR per open question 2.

Every phase ends on a green `pnpm ready`. Commit files that `pnpm regen` / `vp check --fix` modify
alongside the change.
