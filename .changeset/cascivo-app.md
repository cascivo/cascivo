---
'@cascivo/app': minor
'cascivo': minor
---

New package: `@cascivo/app`, the client-app layer. It has three entry points.

- **`@cascivo/app`** is a router whose state is signals:
  - `createRouter`, `route`/`lazyRoute`, `RouterView`, and `router.Link`. Pass `router.Link`
    to `setLinkComponent`, and `SideNav`, `ShellHeader` and `Breadcrumb` route through it.
  - Params are typed from the pattern: `RouteProps<'/c/:id'>` gives `{ id: string }`, and
    `buildPath` fills a pattern.
  - Matching goes by specificity, a `base` option serves the app under a path prefix, and
    navigations use View Transitions where the browser supports them.
- **`@cascivo/app/api`** is a typed contract between client and server, with no React.
  `defineApi` declares `endpoint`s and `stream`s, each with a parser.
  - `createHandler` serves the contract from a Worker. It validates input, maps `HttpError`
    to a status, hides unexpected errors behind a 500, and turns an async iterable into SSE.
  - `createClient` calls the contract and validates every response.
- **`@cascivo/app/vite`** turns `src/routes/**` into a generated `src/routes.gen.ts`, a
  real file. A file-name pattern maps to each route, such as `c/[id].tsx` for `/c/:id`.

`cascivo create --framework cloudflare` now builds on it:

- Pages are file routes.
- The nav uses real `href`s routed client-side.
- The Worker and the client share one `defineApi` contract.

This replaces the scaffold's persisted-section switcher and its hand-written protocol file.
