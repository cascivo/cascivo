# @cascivo/app

## 1.5.0

### Minor Changes

- d258fc9: `@cascivo/app/ses`: Amazon SES from a Worker with no AWS SDK. `createSes(...).sendEmail()`
  calls SES v2 `SendEmail` (HTML and text parts, extra headers such as `List-Unsubscribe`,
  configuration sets) and throws `SesError` with SES's code and whether a retry can help.
  `handleSns` verifies SNS messages against the signing certificate, fetched only from SNS's
  hosts, confirms the subscription, and passes notifications on; `parseSesNotification` reads
  bounces, complaints and deliveries. `signAwsRequest` signs any other AWS call with Signature
  Version 4 over WebCrypto.
- d258fc9: `@cascivo/app/stripe` takes subscriptions. `createCheckoutSession` accepts
  `mode: 'subscription'`, recurring inline prices (`interval`), an existing `customer`, and
  `subscriptionMetadata`, which only the server can set and every subscription event carries.
  New: `retrieveSubscription` and `parseSubscription` (the billing period is read from the
  subscription or its first item, so older and newer API versions both work), and
  `createPortalSession` for Stripe's hosted Customer Portal. `parseStripeEvent` types the
  `customer.subscription.*` events as `kind: 'subscription'`, and a Checkout session now carries
  `mode`, `customerId` and `subscriptionId`.
- d258fc9: `@cascivo/app/stripe`: Stripe Checkout from a Worker over plain `fetch`, with no SDK.
  `createStripe(secretKey)` creates and reads back Checkout Sessions (idempotency keys, inline or
  dashboard prices, a pinned API version), and throws `StripeError` with Stripe's status, type
  and code. `parseStripeEvent(body)` reads a webhook body that `verifyWebhook` has checked: the
  four Checkout events come back typed with their session, and every other event as
  `kind: 'other'`.

### Patch Changes

- @cascivo/core@1.5.0

## 1.4.0

### Minor Changes

- a5c3efb: `@cascivo/app/flags`: feature flags evaluated in the Worker, parsed in the browser.

  - `defineFlags({ newCheckout: false, theme: themeFlag() })` is one definition shared by
    both sides. Each flag's default is also its type.
  - `flags.evaluate(env.FLAGS, context)` evaluates every flag against Cloudflare Flagship's
    binding, or any evaluator with the same four getters.
  - `flags.parse` checks the result that reaches the browser. Use it as an endpoint's
    `output`.
  - A flag that fails, is missing or has the wrong type keeps its default, on both sides.
  - `objectFlag(default, parse)` declares an object-valued flag with its own parser.
  - `themeFlag()` runs a theme experiment:
    - `parseThemeOverride` accepts a theme name and `--cascivo-*` tokens whose values cannot
      escape a declaration or load a URL.
    - `applyThemeOverride(element, override)` applies it and returns an undo.

- a5c3efb: Background jobs with live progress.

  - `@cascivo/app/jobs`:
    - `defineJob({ steps, output })` declares a job, shared by the runner and the page.
    - `watchJob(job, url)` gives the page the job's state as a signal: status, step,
      progress, message, and the parsed output.
  - `@cascivo/app/jobs-server`: `jobReporter(job, env.ROOMS, id)` reports from whatever runs
    the job — a Workflow, a Queue consumer, `ctx.waitUntil`.
  - A job's progress is a room only the server writes:
    - `writeRoom(namespace, name, path, value)` writes into any room from the Worker.
    - `roomResponse(…, { readOnly: true })` lets the browser watch a room but not write to it.
  - When the room refuses a write, its error now names that write, so the client drops it
    instead of resending it forever.
  - `cascivo create --framework cloudflare --example import` scaffolds a CSV import running as
    a Workflow, with its steps and progress live; a reload picks the job back up. The MCP tool
    `create_app` accepts `examples: ['import']`.

- a5c3efb: New package: `@cascivo/app`, the client-app layer. It has three entry points.

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

- a5c3efb: D1 behind a DataTable.

  - `@cascivo/app/db`:
    - `defineTable({ table, key, columns })` lists what may be sorted, searched and filtered.
    - `queryTable(db, table, query, parseRow)` turns `DataTable`'s server-mode `TableQuery`
      into SQL, with identifiers from the definition and every value bound, and returns
      `{ rows, total }`. A query outside the definition is a `TableQueryError`, which is an
      `HttpError(400)`.
    - `parseTableQuery` and `parseTablePage` check what crosses the network.
    - `queryRows` runs any statement through a parser.
    - `migrate(db, migrations)` lets the Worker apply its own schema, once per isolate, each
      migration in one transaction. A fresh deploy needs no migration step.
  - `cascivo create --framework cloudflare --example crud` scaffolds a customers table with
    server-side sorting, search, filters and paging, plus create, edit and delete. It works on
    a temporary account. `starters/cloudflare-crud` has a Deploy button. The MCP tool
    `create_app` accepts `examples: ['crud']`.

- a5c3efb: Accounts with passwordless sign-in.

  - `@cascivo/app/auth-server`:
    - `handleAuth(db, { sendLink })` answers `/api/auth/start`, `/verify`, `/me` and `/signout`.
    - Users, one-time links and sessions live in D1, stored as SHA-256 hashes.
    - A link works once, for 15 minutes, and opens a page, so a mail scanner cannot use it up.
    - The session is a `__Host-` cookie: HttpOnly, Secure, SameSite=Lax.
    - `requireUser` answers 401 when signed out, and 403 for a write from another site.
  - `@cascivo/app/auth`: `createAuth()` gives `user` as a signal, plus `start`, `verify` and
    `signOut`.
  - `cascivo create --framework cloudflare --auth email` scaffolds an Account page and the link
    page.
    - Every API write needs a signed-in user; reads stay public.
    - Sign-in emails are rate-limited per IP.
    - `vite dev` shows the link instead of sending it.
  - The MCP tool `create_app` accepts `auth: 'email'`.

- a5c3efb: PDF and PNG export through Browser Run.

  - `@cascivo/app/export`:
    - `handleExport(request, { launch })` serves
      `/api/export?page=/reports&format=pdf|png`. It renders a page of the app at its own
      origin, and refuses other origins and `/api/` paths.
    - `exportPage` returns the file directly, for a Cron Trigger or a Workflow.
    - `isExporting()` lets the app drop its shell in the export.
    - `exportUrl()` builds the download link.
    - `@cloudflare/puppeteer`'s `Browser` fits the structural types.
  - `@cascivo/email`: `sendEmail` takes `attachments`. An attachment's filename and type are
    checked for CR/LF like any header.
  - `cascivo create --framework cloudflare --example export` scaffolds a report page with PDF
    and PNG downloads. The MCP tool `create_app` accepts `examples: ['export']`.

- a5c3efb: Who may call the Worker: `@cascivo/app/guard`.

  - `requireAccess(request, { teamDomain, audience })` verifies the JWT Cloudflare Access signs:
    the RS256 signature against the team's published keys, the issuer, the audience and the
    expiry. It refuses a request that reached the Worker around Access with a 403, and every
    request with a 500 until the team domain and audience are set.
  - `verifyTurnstile(token, { secret })` checks a Turnstile token with siteverify (403 on
    failure). `mountTurnstile` from `@cascivo/app/turnstile` renders the widget.
  - `rateLimit(limiter, key)` counts a call against the Rate Limiting binding (429 past the
    limit). `clientIp` and `guardResponse` help at the top of `fetch`.
  - `cascivo create --framework cloudflare --auth access` makes the Worker refuse every request
    Access did not let through. `vite dev` skips the check. The MCP tool `create_app` accepts
    `auth: 'access'`.
  - `--example files` and `--example export` now rate-limit starting an upload or an export:
    20 a minute per IP.

- a5c3efb: Live dashboards fed by Queues.

  - `@cascivo/app/live`: `defineLive({ metrics, window, bucket })` declares the metrics and how
    much per-second history to keep. `watchLive(live, url)` gives the window as a signal for
    the charts, sliding every second with or without events.
  - `@cascivo/app/live-server`: `LiveRoom` is a `SyncRoom` Durable Object that keeps
    per-bucket totals. `recordLive` adds a Queue batch into it, drops malformed events, and
    throws so the Queue retries when the room cannot be reached.
  - `SyncRoom` gains `read`, `write` and `paths` for subclasses. `roomResponse` now strips
    every `x-cascivo-room-*` header a caller sends, not only the two it knew about.
  - `cascivo create --framework cloudflare --example live` scaffolds an `/ops` dashboard:
    - `POST /api/events` sends events to a Queue.
    - The Worker's `queue` handler records them.
    - Every open copy of the page updates each second.
    - The MCP tool `create_app` accepts `examples: ['live']`.

- a5c3efb: Local-first rooms.

  - `connectRoom(url, { storage })` saves the room on the device after every change: its last
    state and every write the room has not confirmed.
    - On start the room renders from storage before the socket opens. Once it connects, the
      room's state replaces the saved copy.
    - Writes made offline survive a reload or a closed tab, and go out on the next connection.
    - The saved copy is parsed on load; another version or a corrupted copy is dropped.
  - `room.unsynced` counts writes still waiting for the room.
  - A write over the room's size limit now throws on the client, instead of being rejected by
    the room after it was queued.
  - `SyncRoom.onWrite({ room, path, value })` is a hook for mirroring writes elsewhere, such as
    D1. It runs after the write is stored and sent, and a throw never reaches the clients.
  - `cascivo create --framework cloudflare --example notes` scaffolds a notes page that keeps
    working when the connection drops. The MCP tool `create_app` accepts `examples: ['notes']`.

- a5c3efb: Multiplayer signals on Durable Objects.

  - `@cascivo/app/sync` adds `connectRoom(url)`:
    - `room.signal(path, initial, parse)` and `room.map(prefix, parse)` are signals shared by
      everyone in a room.
    - `room.presence` and `setPresence` share cursors and similar per-person state.
    - `room.status` reports the connection, which reconnects on its own.
    - A value is last-writer-wins per path, in the order the room receives writes. Your own
      writes show as pending until the room confirms them.
  - `@cascivo/app/sync-server` adds `SyncRoom`, a Durable Object that uses WebSocket
    hibernation and validates every message, and `roomResponse`, which routes a request to it.
  - `cascivo create --framework cloudflare --example board` scaffolds a shared board with
    draggable notes and live cursors. It runs on a temporary account, so you can share it
    with no Cloudflare sign-up.
  - The MCP tool `create_app` takes `examples`.

- a5c3efb: Published pages render on the server.

  - In a `cascivo create --example publish` app, the Worker answers `/p/<slug>` with the app's
    index.html carrying the page:
    - A title, a description and Open Graph tags, so a shared link previews properly.
    - The rendered page in a `<noscript>`, styled by the same stylesheets. The Worker finds them
      in the build manifest, for readers without JavaScript.
    - An unknown slug still gets the app, which says so.
  - With the export example too, `og:image` is a 1200 × 630 preview. Browser Run renders it once
    and D1 keeps it.
  - `exportPage` takes `fullPage: false`, to capture only the viewport: a fixed-size image.

- 15caa11: `SyncRoom.canWrite` and `roomResponse(…, { claims })`: decide who may write what in a room.

  - Override `canWrite({ room, path, value, connection })` on a `SyncRoom` subclass. Return
    `true` to store a browser's write, or `false` / a message to refuse it. The writer gets the
    message as the write's error and drops the write; nobody else sees it. Writes from the
    Worker (`writeRoom`, `write`) skip the rule. A rule that throws refuses the write.
  - `roomResponse(request, ns, name, { claims })` passes what the Worker verified about the
    connection (a role, a user id) to `canWrite` as `connection.claims`. A browser cannot set
    it: `roomResponse` strips every `x-cascivo-room-*` header a caller sends. JSON, at most 4 KB.
  - `Json`, the type of every room value, is now exported from `@cascivo/app/sync` and
    `@cascivo/app/sync-server`, so a subclass can type what it passes to `write`.

- a5c3efb: Uploads into R2, with progress.

  - `@cascivo/app/uploads`:
    - `defineUploads({ path, maxBytes, types })` is one policy shared by the page and the
      Worker. It refuses SVG and HTML, which would run script from your origin.
    - `startUpload(policy, file)` checks the file, then uploads it with `progress`, `status`
      and `result` signals. Files above 16 MiB go up in parts.
  - `@cascivo/app/uploads-server`:
    - `handleUploads(policy, env.FILES, { images })` stores uploads under keys the Worker
      chooses, enforces the policy, and serves files back with `nosniff` and a sandboxing CSP.
      `?w=` returns a WebP preview through Cloudflare Images.
    - `listUploads(bucket)` lists stored files.
    - R2's and Images' bindings fit the structural types, with no Cloudflare type dependency.
  - `cascivo create --framework cloudflare --example files` scaffolds an upload page on
    `FileUploader`, with previews. The MCP tool `create_app` accepts `examples: ['files']`.

- a5c3efb: Usage analytics on Workers Analytics Engine.

  - `@cascivo/app/analytics`:
    - `defineMetrics({ dataset, blobs, doubles, index })` names Analytics Engine's positional
      columns once.
    - `metrics.write(env.USAGE, { … })` writes by name. Missing values are filled, and each
      blob is cut to Analytics Engine's limits.
    - `metrics.sql()` writes queries against names.
  - `queryAnalytics(credentials, sql, parseRow)` runs a query over the SQL API and parses
    each row. `numberField` and `stringField` accept Analytics Engine's JSON forms.
  - `cascivo create --framework cloudflare --example usage` records every API request and
    charts the last 24 hours: requests per hour, the busiest routes, errors and latency.
    Reading needs `CF_ACCOUNT_ID` and `CF_API_TOKEN` secrets; until they exist, the page says
    what to set. The MCP tool `create_app` accepts `examples: ['usage']`.

- a5c3efb: Verified inbound webhooks.

  - `verifyWebhook(request, { scheme, secret })` in `@cascivo/app/guard` checks a signature over
    the raw body and returns `{ body, id }`; anything else is a 401.
    - Schemes: GitHub (`X-Hub-Signature-256`), Stripe (`Stripe-Signature`, with a timestamp
      window against replays) and Standard Webhooks (`whsec_` secrets, rotation, a timestamp
      window).
    - Signatures are compared by WebCrypto's HMAC verify, in constant time.
  - `cascivo create --framework cloudflare --example webhooks` scaffolds a `/webhooks` page:
    - GitHub deliveries are verified, stored once each in D1 by delivery id, and pushed live.
    - A "Send a test delivery" button runs a signed sample through the same path.
    - With `--auth email`, webhooks are exempt from the sign-in rule and checked by signature.
  - Fix: the scaffold's `/api/rooms/:name` route opened any room read-write, including the rooms
    only the server writes. A browser could forge an import job's progress. It now refuses those
    names, and it is emitted only with a room clients may write (board, notes).
  - The MCP tool `create_app` accepts `examples: ['webhooks']`.

### Patch Changes

- Updated dependencies [a5c3efb]
- Updated dependencies [15caa11]
- Updated dependencies [b2a3d94]
  - @cascivo/data@0.1.0
  - @cascivo/core@1.4.0
