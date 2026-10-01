# @cascivo/mcp

## 0.8.0

### Minor Changes

- b2a3d94: Agent setup in one command, and `@cascivo/render` on npm.

  - **`@cascivo/render` is published.** Render a JSON view config with real cascivo components,
    and read it back as Markdown from `@cascivo/render/text`. The component is now
    `CascivoView`; `CascadeView` remains as a deprecated alias until 2.0.0. The JSON Schema
    ships as `@cascivo/render/schema/view.v1.json`. It joins the lockstep family.
  - **`cascivo mcp init`** adds the cascivo MCP server to `.mcp.json` (Claude Code),
    `.cursor/mcp.json` or `.vscode/mcp.json` (`--client`), keeping any other servers.
  - **New MCP tool `render_view_as_markdown`:** validate a view config, render it with the
    project's own `@cascivo/render`, and return what it says as Markdown — so an agent can
    check a generated view before showing it.

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

- a5c3efb: `cascivo create --framework cloudflare --example digest` emails the report page as a PDF
  every Monday at 08:00 UTC, on a Cron Trigger.

  - The Worker's `scheduled` handler renders `/report` with Browser Run (`exportPage`) and
    sends it through Email Service as an attachment.
  - Every run is recorded in D1, sent, skipped (with what is missing) or failed.
  - `/digest` lists the runs and has "Send now".
  - The digest brings the `export` example along, for its report page.
  - wrangler.jsonc now keeps every plain-text setting in one `vars` object, and one Email
    Service binding, when several examples need them.
  - The MCP tool `create_app` accepts `examples: ['digest']`.

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

- a5c3efb: Generative UI on Cloudflare's Agents SDK.

  - `@cascivo/render/validate` exports `validateView` with no React and no components, so a
    Worker or any other server can check a model's view before it reaches a browser. It also
    rejects inherited object keys such as `toString` as component names, which the old
    `in componentMap` check let through.
  - `cascivo create --framework cloudflare --example agent` scaffolds an `/assistant` page:
    - An `AIChatAgent` Durable Object on Workers AI calls a `show_view` tool.
    - The Worker validates every view against the component manifests and returns errors to
      the model, which fixes them.
    - The page renders the result with `<CascivoView>`.
    - `vite dev` answers from a scripted model, so it runs offline and without an account.
    - The example runs on React, because the Agents SDK's hooks call React 19's `use()`, which
      Preact does not implement. `--runtime preact` with it is refused.
  - Fresh `--framework cloudflare` apps now pass their own `lint` and `format:check`:
    - An empty `Env` no longer trips `no-empty-object-type`.
    - `tsconfig.json`, `wrangler.jsonc` and the generated sources are formatted as Prettier
      prints them.
    - `tsconfig.json` is also fixed for `react-vite` apps.
  - The MCP tool `create_app` accepts `examples: ['agent']`.

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

- a5c3efb: `cascivo create --framework cloudflare --example publish` turns views into pages with no
  deploy step: `/publish` edits a view with a live preview and publishes it to `/p/<slug>`.

  - Each page is checked with `validateView` before the Worker stores it in D1, and again by
    `<CascivoView>` before it renders.
  - A view only arranges the app's own components, so a published page runs no code of its
    author's and needs no sandbox.
  - Publishing is limited to 20 pages a minute per IP; reading is not limited. Files and
    export now share this limiter.
  - It works on a temporary account.
  - The MCP tool `create_app` accepts `examples: ['publish']`.

  The spike behind it is written up in `docs/plans/platform-spike-research.md`. It covers what
  Worker Loaders do and do not enforce locally, and why Workers for Platforms is not needed
  for publishing views.

- a5c3efb: `cascivo create --framework cloudflare --example search` finds help articles by meaning.

  - Each article, seeded into D1, is embedded with Workers AI (`@cf/baai/bge-base-en-v1.5`) into
    a Vectorize index. "Index articles" does it, and it is rate-limited.
  - A question is embedded the same way and matched against the index.
  - Neither Workers AI nor Vectorize runs locally, so `vite dev` searches by keyword with SQLite
    full-text search, and the page says so. User input is quoted, so it never reaches the
    full-text query syntax.
  - The model's reply is checked before use.
  - The Workers AI binding no longer implies the Agents SDK wiring (`/agents/*`,
    `nodejs_compat`).
  - The MCP tool `create_app` accepts `examples: ['search']`.

- a5c3efb: Share a running preview without a Cloudflare account.

  - `cascivo create --framework cloudflare` adds a `deploy:preview` script. It builds the app,
    then runs `wrangler deploy --temporary`, which prints a public `workers.dev` URL and a
    claim URL. The deployment is deleted after 60 minutes unless you claim it.
  - The `react-vite` and `astro` scaffolds' READMEs explain how to share a static build. Drop
    `dist/` onto Cloudflare Drop, or run `wrangler deploy --temporary --assets dist`.
  - MCP:
    - `create_app` takes `framework` (`react-vite`, `astro` or `cloudflare`) and `runtime`.
    - The new `deploy_preview` tool runs `deploy:preview` and returns the live URL and claim URL.
  - New skill: `cascivo-share-preview`.

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

- a5c3efb: `cascivo create --framework cloudflare --example voice` scaffolds a `/voice` page: a voice
  assistant on the Agents SDK's voice pipeline (`withVoice` from `agents/voice`).

  - The Worker runs Workers AI speech to text (Flux, which also detects the end of a turn), a
    text model and text to speech, in one Durable Object per conversation.
  - The page drives `VoiceClient` from `agents/voice/client`, which has no React dependency, so
    the example runs on Preact, the default runtime.
  - Typed messages work too. A reload shows the conversation so far.
  - `vite dev` runs the whole call offline with labelled stand-ins, because Workers AI has no
    local mode. `VITE_REAL_AI=1` uses the real models.
  - When the model cannot be reached, the assistant says so aloud instead of staying silent.
  - The MCP tool `create_app` accepts `examples: ['voice']`.

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

- Updated dependencies [f4ff5ab]
  - @cascivo/docs@0.2.12

## 0.7.2

### Patch Changes

- a076a68: Editor: line numbers, the current-line highlight and the left gutter all survive a soft wrap

  Reported from an adopter running `CodeEditor` with `wrap` over markdown, and reproduced in
  Chromium against the shipped CSS: with soft wrap on, a single long line broke the whole left
  edge of the editor.

  - **Line numbers drifted one row per wrap.** The gutter was a separate column whose rows were
    one line box each, while the code column's rows grew with the text. A line that wrapped to two
    visual rows put `6` next to the continuation of line 5, and the last line got no number at all.
    The number and its line are now adjacent cells of **one CSS grid row**, so the row grows once
    and both grow with it — there is nothing left to keep in sync.
  - **The current-line highlight lit only the first visual row** of a wrapped line: it was
    positioned by `caretLine * 1lh` and was `1lh` tall. Under wrap it is now placed on the caret's
    grid row and takes that row's height, so it covers every visual row of the line. Not wrapping,
    where rows are uniform and large documents window to a slice, keeps the arithmetic.
  - **The gap between the border and the code could collapse to nothing.** It was padding on the
    gutter and on the highlight/edit layers, and a host reset — Tailwind Preflight's
    `* { padding: 0 }` is the one that hit — outranks `@layer cascivo.component`. The gutter's
    width is now a grid track, the gap after it a `column-gap`, and the textarea's alignment an
    `inset-inline-start`. A `padding: 0` reset can collapse none of the three, so the editing
    surface also cannot drift off the layer it is overlaid on.

  Two new override points come with it, both documented on `CodeEditor` and `Highlight`:
  `--cascivo-editor-gutter-width` (default: as wide as the widest line number) and
  `--cascivo-editor-gutter-gap`. Line numbers stay `aria-hidden` and unselectable, so they are
  neither announced nor copied with the code, and they now stay visible in forced-colors mode,
  where the highlight layer used to be hidden wholesale.

- Updated dependencies [a076a68]
- Updated dependencies [ccab95a]
  - @cascivo/docs@0.2.10

## 0.7.1

### Patch Changes

- 2050fe5: The four packages that build with `vp pack` are minified too. These were not merely
  whitespace-heavy like the rest — they were never minified at all, shipping full identifiers
  and every comment, so they had the most to give:

  ```
  cascivo              36.0 → 25.0 KB gzip   (-31%)
  @cascivo/mcp         19.3 → 13.7           (-29%)
  @cascivo/registry     6.5 →  4.1           (-37%)
  @cascivo/vite-plugin  1.8 →  0.6           (-64%)
  ```

  That is 20.2 KB more, and 49 KB gzip off the published surface across the whole sweep.

  `vp pack` ignores `rollupOptions`, so these take the `--minify` flag in their build script
  rather than the shared rolldown option the other packages use. `scripts/build/minify.ts`
  documents both halves — a package that moves between the two build paths loses this silently
  otherwise.

  None of the four is browser payload, so this is install size rather than runtime cost. The
  reason to do it anyway is that the debuggability argument for leaving them readable does not
  hold: all four already publish sourcemaps with `sourcesContent` embedded, so a stack trace
  out of the minified CLI still resolves to the original TypeScript.

  Exercised after the change, not just built: `cascivo --help`, the MCP server answering
  `initialize` and `tools/list` over stdio (23 tools), both packages keeping their shebang and
  executable bit, and the `cold-adopter`, `npm-bootstrap`, `deps:smoke`, `scaffold-contract`
  and `pack:check` gates that run the packed CLI for real.

## 0.7.0

### Minor Changes

- 82423c6: One accessible-name spelling that always works, plus foreign component names that resolve.

  `ariaLabel` and `label` are now two spellings of one idea: every component that takes an
  invisible accessible name takes both, enforced by a new guard rather than documented and
  hoped for. `<OverflowMenu label=…>`, `<SideNav label=…>`, `<Switcher ariaLabel=…>` and
  `<CommandMenu ariaLabel=…>` all compile. `Fab` joins `IconButton` in typing its required
  name as an XOR of the two.

  `DataTable` gains `ariaLabel`, so a table without a visible `title` can be named at all; it
  dev-warns when it has neither. `Field` accepts `hint` as an alias of `description` — the name
  the eight form controls already use for the same text — and warns when a Field and its child
  control both supply it.

  `packages/components/aliases.json` maps the names peer systems use onto cascivo components:
  `cascivo add switch` installs `toggle` and says so, the MCP `get_component("Dialog")` returns
  `modal`, `llms.txt` lists the mappings, and `import { Switch } from '@cascivo/react'`
  compiles.

  `PropMeta` gains `nameVisibility`, which every `label`/`ariaLabel` prop must declare — the
  generated prop tables derive "Rendered on screen." / "Not rendered — screen readers only."
  from it, so a description can no longer contradict the behaviour.

### Patch Changes

- a0bb1cf: Release every published package.

  This changeset names all twenty published packages so the next release cuts a version for each
  of them, including the four that no other pending changeset touches (`@cascivo/docs`,
  `@cascivo/docspack`, `@cascivo/eslint-plugin`, `@cascivo/vite-plugin`).

  The bump is `patch` everywhere; where another pending changeset asks for a `minor` or `major`,
  that higher bump still wins.

- Updated dependencies [a0bb1cf]
  - @cascivo/docs@0.2.7

## 0.6.6

### Patch Changes

- 00b74e9: Run the release train so the stranded 0.17.0 reaches npm and the recovery path
  gets exercised on a real release.

  No package source changed in this PR — the fixes are the Tag visual baselines
  and `release.yml`'s new `Publish any stranded versions` step. But `release.yml`
  only triggers on pushes that touch `.changeset/**`, so without a changeset
  merging it would not start a release at all, and the step meant to unstrand
  0.17.0 would sit unverified until some unrelated changeset happened to land.

  Bumping the whole published set matches the 2026-08-11 changeset it lands
  beside: npm is behind `main` on every package, not just the ones whose source
  moved, and a partial bump would leave the rest still disagreeing.

- Updated dependencies [d009502]
- Updated dependencies [00b74e9]
  - @cascivo/docs@0.2.6

## 0.6.5

### Patch Changes

- 3fcf3f1: Bump every published package so the next release run publishes the whole set.

  The 0.17.0 bump landed on `main` but never reached npm: the release job's build
  died inside `changesets/action` with `Failed to spawn process: Resource
temporarily unavailable (os error 11)` — an `EAGAIN` write to that action's
  stdout pipe, not a build failure. This changeset re-cuts the whole set on top of
  the workflow fix, so every package publishes from a release that runs its build
  in a runner-owned step.

- Updated dependencies [3fcf3f1]
  - @cascivo/docs@0.2.5

## 0.6.4

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.
- Updated dependencies [66b251d]
  - @cascivo/docs@0.2.4

## 0.6.3

### Patch Changes

- 97da94e: Repair the two CI gates failing on `main`, and refresh the generated registry artifacts.

  No package's runtime code changes here — every bump in this release is version-only.

  **`drift`** — `clientJs` reached the component manifests, but the 103 generated
  per-component files under `apps/site/public/r/` came from a branch cut before it, so merging
  the two left every one of them a field short. Regenerated; no other artifact moved.

  **`verify`** — `isolated:check`, the canary that type-checks packed tarballs in a strict,
  non-hoisted consumer workspace, was dying in `pnpm install` rather than in the type check it
  exists to run:

  ```
  ERR_PNPM_NO_MATCHING_VERSION  No matching version found for
  @cascivo/core@^0.15.0 while fetching it from https://registry.npmjs.org/
  ```

  `pnpm pack` rewrites `workspace:^` to `^<version>`, so the packed `@cascivo/react` asked the
  registry for a version that does not exist until release day — the fixture broke on every
  version bump that landed ahead of a publish, which is exactly what happened. Every
  inter-cascivo edge is now pinned to the tarball built from the commit under test, via
  `overrides` in the fixture's `pnpm-workspace.yaml`. The location matters: pnpm 10+ no longer
  reads the `pnpm` field from `package.json` and only warns about it, so the `pnpm.overrides`
  spelling silently does nothing.

  That also closes a quieter hole. Even when the versions did resolve, the fixture type-checked
  the freshly-built `@cascivo/react` against the last **published** `@cascivo/core` rather than
  the one just built — a mix, not the build under test.

  A new guard fails the fixture if any `@cascivo/*` dependency falls outside its `PACKAGES`
  list, since such an edge would slip back to registry resolution unnoticed — the silent-skip
  failure mode a canary must never have.

- Updated dependencies [97da94e]
  - @cascivo/docs@0.2.3

## 0.6.2

### Patch Changes

- 4172611: Bump every published package so the next release run publishes the whole set. The
  release drift gate had been failing on non-reproducible `regen` output (see PR #179),
  so packages carrying no substantive change of their own were left behind at versions
  older than the rest of the workspace. This changeset gives each of them a real new
  version, keeping the published set in lockstep.
- Updated dependencies [4172611]
  - @cascivo/docs@0.2.2

## 0.6.1

### Patch Changes

- dfc24e4: Documentation updates
- db4fa0d: Docs
- Updated dependencies [dfc24e4]
- Updated dependencies [db4fa0d]
  - @cascivo/docs@0.2.1

## 0.6.0

### Minor Changes

- 5c55ba7: Ship the entire docs surface as an npm package so it's reachable with no website.

  - **New package `@cascivo/docs`** bundles the complete generated documentation — `llms.txt`, `llms-full.txt`, per-component `llms/*.md`, `context/*`, the concept guides, `registry.json`, the token/icon catalogs, and a `versions.json` snapshot. Use it with **no install**: `npx -y @cascivo/docs` prints the index, `npx @cascivo/docs <component>` one reference, `npx @cascivo/docs guide <slug>` a guide, `npx @cascivo/docs --full` the whole library, `--list`/`--dir` to enumerate/grep. It reaches an adopter through the npm registry — the one channel proven to work when `npmjs.com` and `cascivo.com` are 403'd, proxied, or offline. Raw-tarball and installed (`exports`-map) consumption are supported too.
  - **`@cascivo/mcp` gains `list_guides` and `get_guide`** — the concept guides (getting-started, theming, troubleshooting, …) are reachable through MCP for the first time, resolved offline-first (monorepo → `@cascivo/docs` → bundled → network). The MCP server now depends on `@cascivo/docs`.
  - The offline docs channel is now referenced from every package README, the `dist/index.d.ts` quickstart, `llms.txt`, GETTING-STARTED, and TROUBLESHOOTING, enforced by a new `docs-package-refs` guard in `pnpm meta:check`.

### Patch Changes

- Updated dependencies [5c55ba7]
  - @cascivo/docs@0.2.0

## 0.5.2

### Patch Changes

- 0b6b44e: Force a version bump across every published package to verify the changesets
  publish patch fix (see the release workflow fix in PR #168): several packages
  had been stuck re-publishing their already-released version on every release
  run and failing with a spurious E403, because the "already published" error
  detection missed pnpm's actual error shape. This changeset gives every
  package a real new version so the next release run exercises a genuine
  publish for all of them, not just the ones with substantive changes.

## 0.5.1

### Patch Changes

- 958fd6f: Every published package now exports `./package.json`, so
  `require.resolve('@cascivo/<pkg>/package.json')` resolves instead of throwing
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. Previously only `@cascivo/react` exposed it, which
  tripped version probes, bundler plugins, and inspection tooling on the other packages.

## 0.5.0

### Minor Changes

- 2945720: Adopter-friction fixes (TanStack Start / Vite SSR report):

  - **vite-plugin:** new `cascivoSsr()` plugin sets `ssr.noExternal` for every
    `@cascivo/*` package, so Vite SSR / TanStack Start / workerd no longer throw
    `Unknown file extension ".css"`. See docs/USING-WITH-VITE-SSR.md.
  - **registry:** page blocks are now projected into `/r/<name>.json` and
    `/r/shadcn/block-<name>.json` (was: components only), so blocks install via the
    shadcn CLI and appear in every machine-readable surface.
  - **mcp:** new `search_icons` tool resolves an icon by intent or foreign name
    (LayoutDashboard→Dashboard, Rocket→Spaceship), backed by the icon catalog.
  - **icons:** added `GitBranch`/`GitCommit`/`GitMerge`/`GitPullRequest`, plus an
    alias layer so familiar Lucide/Radix names resolve to the cascivo export
    (surfaced as an `aliases` field in icons.catalog.json).
  - **charts:** area-chart solid-fill opacity is now the `--cascivo-chart-fill-opacity`
    token (default 0.25), raised on dark themes so fills keep their hue instead of
    muddying into the dark surface.
  - **themes:** new `--cascivo-chart-fill-opacity` token (0.4 on dark-surface themes,
    0.25 elsewhere).

## 0.4.1

### Patch Changes

- 62a02e6: DX improvements

## 0.4.0

### Minor Changes

- c335ed5: The MCP server now ships `instructions` carrying the cascivo CSS layer contract, so
  every MCP-connected agent receives the layer-discipline rules (no unlayered CSS, no
  invented layer names, native nesting over sublayers, `layer(vendor)` for third-party
  CSS) before generating styles.

## 0.3.5

### Patch Changes

- 810b8ba: Minor improvements

## 0.3.4

### Patch Changes

- 483e30a: Minor improvements

## 0.3.3

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.

## 0.3.2

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes

## 0.3.1

### Patch Changes

- fc61671: Minor improvements

## 0.3.0

### Minor Changes

- 5bafdb6: Adoption-audit fixes (waves 1–2):

  - CLI: per-command `--help` for every command (short-circuits before any prompt, fetch, or install); real `--version` (was hardcoded `0.0.0`); `init --theme <name>` / `--yes` with non-TTY defaulting; theme prompts and `theme add` now offer all 12 themes; `add` prints the `@cascivo/themes` wiring when the project doesn't import tokens yet; `add` is transactional (fetch-all-then-write — a failed fetch never leaves a partial component or a stale lockfile entry) and mixed bare + registry specs install both; registry fetches retry with backoff and fall back to the last cached copy when offline; first-party templates (`dashboard`, `auth`, `landing`) install by bare name; `@cascivo/<name>` namespace added (`@cascade/<name>` remains as a legacy alias); `doctor` no longer false-positives on hook names in comments; lockfile renamed `cascade.lock` → `cascivo.lock` (legacy file read and migrated automatically); HTTP cache moved to `~/.cascivo/cache`.
  - Registry: entries carry the real library version and per-file sha256 hashes; `cascivo update --check` diffs hashes instead of the previously inert version compare.
  - MCP: real server version (was `0.0.0`); `cascivo-mcp` bin added (`cascade-mcp` kept as a legacy alias).
  - i18n/react: `Combobox` search input, `DataTable` pagination buttons, `Dock` nav, and `Steps` list now source their aria-labels from the built-in catalog (with `labels`/`ariaLabel` prop overrides) instead of hardcoded English.

- 5bafdb6: AI-layer delivery (audit wave 3):

  - `@cascivo/mcp` is self-contained: `tokens.catalog.json`, `context.json`, per-component `context/*.md`, `tokens.variants.json`, and `marketplace.json` are bundled into the published package, so `get_tokens`, `get_context`, `get_variant_matrix`, `validate_component`, `list_templates`, and `get_template` all work offline via `npx -y @cascivo/mcp` (previously `list_templates`/`get_template` silently returned an empty catalog for every external user, and the token/context tools required network access).
  - The marketplace catalog loader now falls back to the hosted copy and reports an explicit error when neither is available, instead of silently returning an empty catalog.
  - `get_component` responses include `version`, `files`, and per-file `fileHashes`, letting agents detect drift between installed copies and upstream.
  - One canonical artifact-host constant per package (`CASCIVO_HOST`) replaces scattered `cascivo.com` literals.
  - `@cascivo/ai` (StreamingText, AiLabel, Terminal, AiChat) is published for the first time — it was advertised in the README but marked private. First publish requires the trusted-publisher bootstrap in docs/RELEASING.md.

## 0.2.0

### Minor Changes

- f2f1c62: Add an app scaffold generator. The `cascivo create [name]` CLI command scaffolds a complete, ready-to-run app (Vite + React + TypeScript) pre-wired with the cascivo app shell, side navigation, header, and a chosen theme — one page per nav section, with signal-driven section switching. The MCP server exposes the same capability through a new `create_app` tool.

### Patch Changes

- bc69e5b: Derivable theming, semantic typography, canonical tokens
- bb3c77e: Templates and further improvements

## 0.1.8

### Patch Changes

- f0b5654: Fixes

## 0.1.7

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements

## 0.1.6

### Patch Changes

- aa3c6f3: Introduce Editor

## 0.1.5

### Patch Changes

- 8ecc7a2: Introduce Flow

## 0.1.4

### Patch Changes

- fa55081: SideNav improvements

## 0.1.3

### Patch Changes

- 5e58e32: Component eject

## 0.1.2

### Patch Changes

- 72d0086: New location

## 0.1.1

### Patch Changes

- e9998ab: Further improvements

## 0.1.0

### Minor Changes

- b23575c: Initial public release of the cascivo design system. Includes:
  - `@cascivo/core` — signal/FSM runtime (Preact Signals integration)
  - `@cascivo/tokens` — CSS design tokens (primitive → semantic → component)
  - `@cascivo/themes` — light, dark, and warm first-party themes
  - `@cascivo/icons` — SVG icon component set
  - `@cascivo/i18n` — signal-driven locale store with typed catalogs
  - `@cascivo/storage` — persisted signals over localStorage/IndexedDB
  - `@cascivo/react` — prebuilt npm distribution of all components
  - `@cascivo/mcp` — MCP server exposing the component registry to AI agents
  - `@cascivo/registry` — component registry runtime (CLI dependency)
  - `cascivo` — CLI for `npx cascivo init / add / list / update`
