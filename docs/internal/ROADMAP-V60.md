# ROADMAP-V60 — the client-app layer (`@cascivo/app`)

**Status:** shipped, as `@cascivo/app`, in the `@cascivo/core` fixed version group. **Supersedes** ROADMAP-V59 §6 "I3 — the app
runtime: rejected, permanently", but **only for routing**. The rest of I3 still stands.

## The decision

cascivo now owns a router and a typed client↔server API layer. They are published as
`@cascivo/app`, a versioned npm package, and used by `cascivo create --framework cloudflare`.

V59 rejected I3 for this reason: *"You cannot copy-paste a router outlet into someone's
project and have them own it."* That reason still holds. So this decision does not put a
router in the registry. The two delivery models stay separate:

| Layer | Delivery | Owned by the adopter? |
| --- | --- | --- |
| Components, blocks, layouts | copy-paste (`cascivo add`) | yes, the adopter edits the source |
| Runtime: signals (`@cascivo/core`), storage, `@cascivo/data`, `@cascivo/app` | versioned npm package | no, the adopter upgrades it |

`setLinkComponent` stays the seam. `@cascivo/app` is one router that uses the seam
(`setLinkComponent(router.Link)`). React Router, TanStack Router and Next.js use it the
same way, and all of them remain fully supported.

## What still stands from V59's I3

- No page-stack memory management.
- No gesture-driven swipe-back.
- No hardware back-button handling.
- No Capacitor or native bridge.

`@cascivo/app` is a web router for client-rendered apps. It is not a hybrid-app runtime.
`NavStack`'s V59 §6.1 line still holds too: `NavStack` must not own history.

## Why now

The owner decided (2026-09-29). The deciding argument was delivery rather than architecture:

- Cloudflare owns Vite, Vite+ and Astro, but offers no framework for **client apps**.
- A design system alone asks adopters to assemble routing, data, streaming and deploy
  themselves.

The evidence came from phases 1–3 (`apps/examples/chat`, `@cascivo/data`, the cloudflare
scaffold):

- Both apps hand-wrote the same client↔Worker protocol file.
- A chat app needs deep links (`/c/:id`) as soon as it has a history list.

The evidence did **not** include adoption data, because phase 3 was not yet published.
V59's original plan was to wait for that data. The owner chose not to wait. That is a
recorded trade-off, not an oversight.

## Scope shipped

- **`@cascivo/app`, the router.** It includes:
  - signals for state (`router.match.value`, with no provider and no context)
  - typed params (`RouteProps<'/c/:id'>`) and `buildPath`
  - specificity-ranked matching
  - lazy routes with Suspense
  - a `base` path
  - View Transitions
  - a `Link` that keeps modified clicks, `target` and external links native
- **`@cascivo/app/api`, the typed client↔server API.** It includes:
  - `defineApi` with `endpoint`/`stream`, where each carries a `(raw: unknown) => T` parser. This follows the CLAUDE.md "parse at the boundary" rule.
  - `createHandler`, which validates input, maps `HttpError` to a status, hides 500s, and turns an async iterable into SSE.
  - `createClient`, which validates every response and every streamed event.
  - It imports nothing from React or the DOM, so a Worker can import it.
- **`@cascivo/app/vite`, file routes.** `src/routes/**` becomes `src/routes.gen.ts`, a
  generated file that is committed and formatter-ignored. The CLI bundles the same
  generator, so a new scaffold type-checks before its first `vite` run.

## Kill criteria

Remove `@cascivo/app` from the scaffold, and deprecate it, if any of these is true six
months after `create-cascivo` is published:

1. Fewer scaffolded apps use its router than replace it with React Router or TanStack
   Router. Measure through `cascivo doctor` telemetry, opt-in only, or through issues.
2. It needs a server-rendering mode to stay useful. That would make it a different
   product (see V59).
3. Its maintenance cost pushes component work out of releases for two consecutive minors.

## Not decided here

- Nested layouts and data loaders. There is no evidence for them yet; build them only when
  an app needs them.
- Offline support / a service worker.

## Decided by a guard, not by preference

`@cascivo/app` joins the changesets `fixed` group, which is the 1.x line.
`scripts/checks/version-lockstep.test.ts` requires this for every package that shares
core's signal registry. A package in that group that drifted to a different version could
resolve a second copy of core, and the UI would silently stop updating. So it cannot ship
as an independent 0.x package, and its exported surface is covered by `api-surface.json`
like the rest of the family.
