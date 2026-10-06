`@cascivo/app` is the client-app layer for cascivo. It has these parts:

- a router whose state is signals
- a typed API contract shared by the browser and a Cloudflare Worker
- file-based routes
- multiplayer signals on a Durable Object
- feature flags evaluated in the Worker

It targets apps that render in the browser (dashboards, tools, editors, AI apps) and serve their API from a Worker. It has no server rendering.

```sh
npx cascivo create my-app --framework cloudflare   # scaffolds all of this, wired up
# or: npm create cascivo@latest my-app -- --framework cloudflare
```

> **Early.** It is versioned in lockstep with `@cascivo/core`, because a second copy of core means a second signal registry. The lockstep set is `@cascivo/app`, `core`, `react`, `charts`, `editor`, `flow`, `i18n`, `storage`, `ai`, `text` and `render`: they are released together under one version, so upgrade them together to the same number (app 1.7 pairs with react 1.7). `@cascivo/email`, `themes`, `icons`, `tokens` and `data` keep their own version numbers and do not pin the set: take the latest of each. This package was built from two real apps: [`apps/examples/chat`](../../apps/examples/chat) and the `cloudflare` scaffold. It covers what they needed. It has no nested layouts or data loaders yet. See `docs/internal/ROADMAP-V60.md` for the scope and the kill criteria.

## Router — `@cascivo/app`

```tsx
import { createRouter, lazyRoute, route, RouterView, buildPath } from '@cascivo/app'
import type { RouteProps } from '@cascivo/app'
import { setLinkComponent } from '@cascivo/react'

function Chat({ params }: RouteProps<'/c/:id'>) {
  return <h1>Chat {params.id}</h1> // params is typed from the pattern: { id: string }
}

export const router = createRouter({
  routes: [
    route('/', Home),
    route('/c/:id', Chat),
    lazyRoute('/settings', () => import('./Settings')), // loaded in its own chunk on first visit
  ],
  notFound: route('*', NotFound),
})

// SideNav, ShellHeader and Breadcrumb now render the router's Link: their hrefs navigate
// client-side, and middle-click and "open in new tab" still work.
setLinkComponent(router.Link)

export function App() {
  return <RouterView router={router} fallback={<Spinner />} />
}

router.navigate(buildPath('/c/:id', { id })) // buildPath checks the params at compile time
```

- **State is signals.** `router.match.value`, `router.pathname.value` and `router.search.value` can be read in any component. You need no provider and no context.
- **Matching is by specificity, not declaration order.** For example, `/c/new` wins over `/c/:id`, which wins over `/c/*`.
- **`base: '/demos/chat'`** serves the app under a path prefix. Patterns, `navigate` and `Link` hrefs stay app-relative.
- **View Transitions.** Navigations run inside `document.startViewTransition` where the browser supports it. Pass `viewTransitions: false` to turn this off.
- **`router.Link` does not intercept every click.** It handles a plain left click. Modified clicks, `target`, `download` and external URLs go to the browser. If a caller calls `preventDefault()`, the link does not navigate; this is how a disabled nav item works.

## File routes — `@cascivo/app/vite`

```ts
// vite.config.ts
import { cascivoRoutes } from '@cascivo/app/vite'
export default defineConfig({ plugins: [react(), cascivoRoutes()] })
```

The plugin turns `src/routes/**` into `src/routes.gen.ts`, a generated file that you commit. That file contains one `lazyRoute` per file, a `notFound` route, and an `AppPath` union of every pattern:

| File                                   | Path                                  |
| -------------------------------------- | ------------------------------------- |
| `index.tsx`                            | `/`                                   |
| `settings.tsx` or `settings/index.tsx` | `/settings`                           |
| `c/[id].tsx`                           | `/c/:id`, with `RouteProps<'/c/:id'>` |
| `files/[...path].tsx`                  | `/files/*`                            |
| `404.tsx`                              | the not-found route                   |

The plugin skips files and folders that start with `_`, and `*.test.*` files. If two files define the same path, the build fails and names both files.

The output is a real file, not a virtual module, so TypeScript, your editor and code review see it like any other source. Add it to your formatter's ignore list, because the plugin rewrites it.

```ts
import { createRouter } from '@cascivo/app'
import { notFound, routes } from './routes.gen'
export const router = createRouter({ routes, notFound })
```

## Typed API — `@cascivo/app/api`

This entry imports nothing from React or the DOM, so the Worker imports the same contract as the browser:

```ts
// src/api.ts — shared
import { defineApi, endpoint, stream } from '@cascivo/app/api'

export const api = defineApi({
  getNote: endpoint({ method: 'GET', path: '/api/notes/:id', output: parseNote }),
  saveNote: endpoint({
    method: 'PUT',
    path: '/api/notes/:id',
    input: parseNoteInput,
    output: parseNote,
  }),
  chat: stream({ method: 'POST', path: '/api/chat', input: parseChatRequest, event: parseToken }),
})
```

```ts
// worker/index.ts
import { createHandler, HttpError } from '@cascivo/app/api'
import { api } from '../src/api'

export default {
  fetch: createHandler<typeof api, Env>(api, {
    getNote: async ({ params, env }) => {
      const note = await env.DB.prepare('select * from notes where id = ?').bind(params.id).first()
      if (!note) throw new HttpError(404, 'No such note')
      return parseNote(note)
    },
    saveNote: async ({ params, body, env }) => saveNote(env.DB, params.id, body),
    chat: async function* ({ body, env }) {
      yield* streamReply(env.AI, body) // each yield is one server-sent event
    },
  }),
}
```

```ts
// in the app
import { createClient } from '@cascivo/app/api'
const client = createClient(api)

const note = await client.getNote({ params: { id } }) // typed: Note
for await (const token of client.chat({ body: { messages }, signal })) draft.value += token.text
```

Every parser has the shape `(raw: unknown) => T`. That can be a hand-written guard or a schema library's `.parse`. The package never casts a network payload to a type; it runs it through a parser:

| Where                            | What is parsed                 |
| -------------------------------- | ------------------------------ |
| Server, before your handler runs | the request body, with `input` |
| Client, before your code sees it | every response, with `output`  |
| Client, for each streamed event  | each event, with `event`       |

The shared contract does not make the network trustworthy, so both sides still validate.

Errors:

| Case                                            | What happens                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| The body is not valid JSON                      | 400                                                                                       |
| The body fails the `input` parser               | 400 with the parser's message                                                             |
| The handler throws `HttpError(status, message)` | that status and that message                                                              |
| The handler throws any other error              | 500 with `Internal error`; the real error is logged on the server, not sent to the client |
| Unknown path                                    | JSON 404                                                                                  |
| Known path, wrong method                        | 405 with an `Allow` header                                                                |
| A stream fails after it started                 | an `error` event, which the client throws, because the status was already sent            |

On the client, a non-2xx response throws `HttpError` with the server's message.

Streaming uses [`@cascivo/data`](../data), which provides SSE over `fetch`, so a streaming request can carry a POST body.

## Multiplayer — `@cascivo/app/sync` and `@cascivo/app/sync-server`

These are signals that everyone in a room shares, over one WebSocket to a Durable Object.

```ts
// in the app
import { connectRoom } from '@cascivo/app/sync'

const room = connectRoom('/api/rooms/team')
const title = room.signal('title', 'Untitled', parseString) // a signal every visitor shares
const notes = room.map('notes', parseNote) // one path per entry

title.set('Roadmap') // applied locally at once, then confirmed by the room
notes.set(crypto.randomUUID(), { text: '' })
room.setPresence({ x, y }) // cursors, selections; room.presence has everyone else
room.status.value // 'connecting' | 'open' | 'closed'; it reconnects on its own
```

```ts
// worker/index.ts
import { roomResponse } from '@cascivo/app/sync-server'
export { SyncRoom } from '@cascivo/app/sync-server' // the Durable Object class

export default {
  fetch(request: Request, env: Env) {
    const room = /^\/api\/rooms\/([^/]+)$/.exec(new URL(request.url).pathname)
    if (room) return roomResponse(request, env.ROOMS, room[1]!)
    // …
  },
}
```

```jsonc
// wrangler.jsonc
"durable_objects": { "bindings": [{ "name": "ROOMS", "class_name": "SyncRoom" }] },
"migrations": [{ "tag": "v1", "new_sqlite_classes": ["SyncRoom"] }]
```

How consistency works:

- **Each path is last-writer-wins, in the order the room receives writes.** Your own write shows at once as pending. The room echoes every write to every client, including the writer, and each client applies the echo as authoritative. When two people write the same path at the same time, both briefly see their own value, then settle on the same one.
- **Entries in a map never collide.** Two people editing two different notes are fine.
- **Two people typing in the same note is last-writer-wins, not a merge.** For true co-editing of one text, use a CRDT such as `y-partyserver`.

How data is treated:

- **Values come from other people, so every `signal` and `map` takes a parser.** A value that fails the parser is ignored and logged once. It is never cast into your type.
- **The room validates every message it receives.** It checks path grammar, value size and JSON. It rejects anything else with an `error` message and stores nothing.
- **Values persist in Durable Object storage. Presence does not.** Every connection is present, with value `{}`, from the moment it joins until its socket closes.
- **The room uses the WebSocket Hibernation API**, so an idle room costs nothing.
- **Durable Objects work on a temporary Cloudflare account**, so a multiplayer app can be shared with `wrangler deploy --temporary` and no sign-up.

`cascivo create --framework cloudflare --example board` scaffolds a working board with draggable notes and live cursors.

### Who may write what: `canWrite` and claims

By default any socket may write any path. To decide per write, extend `SyncRoom` and override
`canWrite`. To make the decision depend on who is writing, pass `claims` to `roomResponse`:
whatever the Worker verified before it opened the socket, such as a role or a user id.

```ts
// worker/index.ts — the Worker decides who the connection is
const host = await isHost(request, env) // your own check: a session, a key, Access
return roomResponse(request, env.ROOMS, name, { claims: { role: host ? 'host' : 'guest' } })

// the room decides what that connection may write
import { SyncRoom } from '@cascivo/app/sync-server'
import type { ClientWrite } from '@cascivo/app/sync-server'

export class BoardRoom extends SyncRoom {
  protected override canWrite({ path, connection }: ClientWrite) {
    if (path.startsWith('notes/')) return true // anyone may add and move notes
    const { claims } = connection
    const host =
      typeof claims === 'object' && claims !== null && 'role' in claims && claims.role === 'host'
    return host || 'Only the host can change the board settings'
  }
}
```

- **Return `true` to store the write.** Return `false` or a message to refuse it. The writer
  gets the message as an error and drops the write. Nobody else sees it.
- **`canWrite` sees one write at a time.** `{ room, path, value, connection: { id, claims } }`.
  To judge a write against the value it replaces, call `this.read(path)`.
- **Claims come only from the Worker.** `roomResponse` strips any `x-cascivo-room-*` header a
  browser sends, so a browser cannot claim a role. Claims are JSON, at most 4 KB.
- **Writes from the Worker skip the rule:** `writeRoom`, and `write` in a subclass.
- **A rule that throws refuses the write** and logs the error.
- `canWrite` decides _whether_ a write lands, not _how_: a write is still last-writer-wins. A
  counter that many people bump at once (votes) belongs on the Worker, which can apply one
  increment at a time. The [Stage example](../../apps/examples/stage) does that.

`Json`, the type of every room value, is exported from both `@cascivo/app/sync` and
`@cascivo/app/sync-server`.

### Local-first: keep the room on the device

Pass a `StorageDriver` and the room is saved on the device after every change: its last state
and every write the room has not confirmed yet.

```ts
import { indexedDBDriver } from '@cascivo/storage'

const room = connectRoom('/api/rooms/notes', { storage: indexedDBDriver() })
room.unsynced.value // writes still waiting for the room: non-zero while offline
```

- **On start, the room renders from storage before the socket opens.** Once it connects, the
  room's state replaces the saved copy, so a stale copy never wins over newer data.
- **Writes made offline survive a reload or a closed tab.** They go out, in order, on the next
  connection. When they arrive they are ordinary writes: last-writer-wins, as above.
- **The saved copy is parsed on load like any payload.** A copy of another version, or a
  corrupted one, is dropped with a warning.
- **One tab per room is the supported offline case.** With several tabs of the same room
  offline, each saves its own queue under the same key, and the last to change wins.
- Opening the app with no network at all also needs its files cached, which is a service
  worker's job, not this one.

To mirror writes elsewhere (into D1, to query across rooms), extend `SyncRoom` and override
`onWrite({ room, path, value })`. It runs after the write is stored and sent. A throw is
logged and never reaches the clients.

`cascivo create --framework cloudflare --example notes` scaffolds a local-first notes page.

## Feature flags — `@cascivo/app/flags`

One definition, shared by the Worker and the browser like the API contract. The Worker
evaluates it against its flag service, and the browser gets the result from an ordinary
typed endpoint. Each flag's default is also its type: it is the value the flag falls back to,
and the shape an evaluated value must have.

```ts
// src/flags.ts — imported by both sides
import { defineFlags, themeFlag } from '@cascivo/app/flags'

export const flags = defineFlags({
  newCheckout: false,
  headline: 'Welcome back',
  theme: themeFlag(), // a theme experiment: { theme, tokens }
})

// src/api.ts — flags.parse is the endpoint's output parser
flags: endpoint({ method: 'GET', path: '/api/flags', output: flags.parse }),

// worker/index.ts — Cloudflare Flagship's binding has the shape `evaluate` takes
flags: ({ env, request }) =>
  flags.evaluate(env.FLAGS, { country: request.headers.get('cf-ipcountry') ?? 'XX' }),

// the app — flags are a signal, at their defaults until the Worker answers
export const values = signal(flags.defaults)
values.value = await createClient(api).flags()
```

```jsonc
// wrangler.jsonc
"flagship": [{ "binding": "FLAGS", "app_id": "<your Flagship app id>" }]
```

How values are treated:

- **A flag that fails to evaluate, is missing or has the wrong type keeps its default**, with
  a warning. The check runs in the Worker and again in `flags.parse`, because the payload
  crosses the network. One bad flag never breaks the app.
- **An object flag takes a parser**, `objectFlag(defaultValue, parse)`, so its shape is checked
  like any other payload. `themeFlag()` is one of these.
- **The evaluator is typed by shape** (`getBooleanValue`, `getStringValue`, `getNumberValue`,
  `getObjectValue`), so Flagship's binding fits, and so does any OpenFeature-style client.

Theme experiments: `applyThemeOverride(document.documentElement, values.value.theme)` sets
`data-theme` and the `--cascivo-*` tokens the flag carries, and returns a function that undoes
it. `parseThemeOverride` accepts only a plain theme name and `--cascivo-*` properties whose
values cannot escape a declaration or load a URL. A flag that fails this falls back to no
override. The theme the flag picks must have its CSS imported: `data-theme="warm"` does
nothing without `@cascivo/themes/warm.css`.

In `vite dev`, Flagship runs a local simulator: an unset flag evaluates to its default, so the
app works before any flag exists.

**Flags by plan.** The context is yours to fill, so a paid plan is one more attribute: put
`isEntitled(status)` from `@cascivo/app/stripe` into it and target flags at `plan: 'pro'` in
Flagship. Use it for what the page shows; the Worker still refuses the paid request itself
with `requireEntitlement` (see Payments below), because a flag value reaches the browser.

```ts
flags.evaluate(env.FLAGS, { user: user.id, plan: isEntitled(row?.status) ? 'pro' : 'free' })
```

## Background jobs — `@cascivo/app/jobs` and `@cascivo/app/jobs-server`

Work that outlives a request, like an import, a report or an agent task, with its progress
live in the browser. A job's progress is a room that only the server writes: whatever runs
the job reports into it, and the page watches it. Because the room stores the state, a
reload, a second tab or another device picks the job up where it is.

```ts
// src/import-job.ts — shared
export const importJob = defineJob({ steps: ['Read', 'Check', 'Import'], output: parseSummary })

// the runner — a Workflow, a Queue consumer, ctx.waitUntil
const report = jobReporter(importJob, env.ROOMS, id)
await report.step(1, 'Checking 120 rows')
await report.progress(2, 0.5, 'Imported 60 of 120')
await report.done({ imported: 120, rejected: [] })

// worker/index.ts — the browser may watch a job's room, never write to it
roomResponse(request, env.ROOMS, importJob.roomName(id), { readOnly: true })

// the page
const job = watchJob(importJob, `/api/jobs/${id}`)
job.state.value // { status: 'running', step: 2, progress: 0.5, message: 'Imported 60 of 120' … }
```

- **The state is parsed in the browser.** It carries the status, the step, the progress and
  a message; the output goes through the job's own parser. A state that fails the parse is
  ignored.
- **In a Workflow, report from inside `step.do`.** A Workflow replays `run()` from the top
  after each step, skipping finished ones. A report outside a step runs again on every replay
  and moves the progress backwards. `fail(error, step)` is the exception: it runs once, as the
  run ends.
- **Read-only rooms.** `roomResponse(…, { readOnly: true })` marks the connection. The room
  refuses its writes, and the refusal names the write, so the client drops it instead of
  resending it. `writeRoom(namespace, name, path, value)` is the server-side write.

`cascivo create --framework cloudflare --example import` scaffolds a CSV import that runs as a
Workflow and shows its steps and progress live.

## Uploads — `@cascivo/app/uploads` and `@cascivo/app/uploads-server`

Files from the browser into R2, through your Worker, with progress. One policy is shared by
both sides: the page checks a file before sending it, so the user hears "too large" at once,
and the Worker enforces the same policy, so a page that skipped the check still cannot store
what it forbids.

```ts
// src/upload-policy.ts — shared
export const uploads = defineUploads({
  path: '/api/uploads',
  maxBytes: 50 * 1024 * 1024,
  types: ['image/png', 'image/jpeg', 'application/pdf'],
})

// worker/index.ts — check who is asking first: this does not authenticate
const upload = await handleUploads(uploads, env.FILES, { images: env.IMAGES })(request)
if (upload) return upload

// the page
const upload = startUpload(uploads, file)
upload.progress.value // 0–1, across every part of a large file
upload.status.value // 'uploading' | 'done' | 'error'
upload.result.value // { key, name, size, type } once stored
```

- **Progress needs XMLHttpRequest**, because `fetch` cannot report upload progress. The
  transport is swappable; tests pass one that calls the handler directly.
- **Files above `partBytes` (16 MiB) go up in parts** (R2 multipart). Each part is size-checked,
  and a finished file over `maxBytes` is removed.
- **The Worker picks every key** (`<uuid>/<sanitized name>`); the browser never names where a
  file lands.
- **Stored files cannot run script from your origin.** A policy may not accept SVG or HTML.
  Files are served with `nosniff` and a sandboxing CSP, and a type the policy does not accept
  is served as a download.
- **`?w=320` returns a WebP preview** through the Images binding, when you pass `images`.
- `listUploads(bucket)` lists stored files in R2's key order.

`cascivo create --framework cloudflare --example files` scaffolds an upload page on
`FileUploader`, with previews.

## PDF and PNG export — `@cascivo/app/export`

Any page of the app as a file, rendered by Cloudflare's Browser Run from the Worker. The
Worker opens the page at its own origin with `?export=1`. The app checks `isExporting()` and
drops its shell, so the file holds the page and not the nav.

```ts
// worker/index.ts
import puppeteer from '@cloudflare/puppeteer'
const exported = await handleExport(request, { launch: () => puppeteer.launch(env.BROWSER) })
if (exported) return exported

// the page
<a href={exportUrl('/reports', 'pdf')}>Download PDF</a>

// a Cron Trigger: a weekly report, emailed (sendEmail from @cascivo/email takes attachments)
const pdf = await exportPage(() => puppeteer.launch(env.BROWSER), `${env.APP_URL}/reports`, {
  format: 'pdf',
})
```

- **Only pages of this app can be exported.** `page` must be a same-origin path, and paths
  under `/api/` are refused, because an export of an export would launch browsers in a loop.
  `allow` narrows this further.
- **Readiness.** By default the page is captured once the network goes quiet. For a page
  that loads data later, show a marker and pass `readySelector`.
- **No session.** The browser opens the page without the visitor's cookies, so a page that
  needs one renders signed out.
- **Cost.** Each export starts a browser session. Put a rate limit in front of it.
- **Typed by shape.** `@cloudflare/puppeteer`'s `Browser` fits `ExportBrowser`; this package
  does not depend on it.

`cascivo create --framework cloudflare --example export` scaffolds a report page with
"Download PDF" and "Download PNG".

## Usage analytics — `@cascivo/app/analytics`

Metrics in Workers Analytics Engine. Analytics Engine stores values by position (`blob1`,
`double2`), which drifts: a writer swaps two blobs, a query reads the wrong column.
`defineMetrics` names the columns once, and both writes and queries go through the names.

```ts
export const usage = defineMetrics({
  dataset: 'app_usage',
  blobs: ['path', 'method'],
  doubles: ['status', 'duration_ms'],
  index: 'path',
})

// the Worker — writing needs only the binding
usage.write(env.USAGE, { path, method, status: response.status, duration_ms })

// reading goes over the SQL API, with an account token kept as a Worker secret
const routes = await queryAnalytics(
  { accountId: env.CF_ACCOUNT_ID, apiToken: env.CF_API_TOKEN },
  usage.sql(
    `SELECT {path} AS path, SUM(_sample_interval) AS requests FROM {dataset} GROUP BY path`,
  ),
  (row) => ({ path: stringField(row, 'path'), requests: numberField(row, 'requests') }),
)
```

- **`usage.sql` substitutes names, not values.** `{path}` becomes `blob1`, and `{dataset}`
  becomes the table name. Put no request data in a query: it is not a parameterized
  statement.
- **Count with `SUM(_sample_interval)`.** Analytics Engine samples at volume, and each row
  stands for `_sample_interval` events.
- **Rows are parsed.** `numberField` accepts the string form Analytics Engine uses for 64-bit
  integers. `stringField` and your own parsers cover the rest.
- A write fills a missing blob with `''` and a missing double with `0`, and cuts each blob to
  1 KB so a point stays inside Analytics Engine's limits.

`cascivo create --framework cloudflare --example usage` records every API request and
charts the last 24 hours with `@cascivo/charts`.

## D1 behind a DataTable — `@cascivo/app/db`

`DataTable`'s server mode hands out one `TableQuery`: sort, search, per-column filters and
page. `defineTable` says which columns may be sorted, searched and filtered, and `queryTable`
turns a query into SQL. Every identifier in that SQL comes from the table definition, and
every value is a bound parameter.

```ts
// shared
export const customers = defineTable({
  table: 'customers',
  key: 'id', // the last tiebreaker, so paging is stable
  columns: {
    id: {},
    name: { sort: true, search: true, filter: 'text' },
    plan: { sort: true, filter: 'select' },
    seats: { sort: true, filter: 'range' },
  },
})

// src/api.ts — the query crosses the network, so it is parsed
customers: endpoint({ method: 'POST', path: '/api/customers/query', input: parseTableQuery,
  output: (raw) => parseTablePage(raw, parseCustomer) }),

// the Worker
await migrate(env.DB, migrations)
return queryTable(env.DB, customers, body, parseCustomer) // { rows, total }

// the page
<DataTable server={{ totalItems: total, onQueryChange: load }} … />
```

- **A query outside the definition is refused.** Sorting or filtering by a column that does
  not allow it, or with the wrong filter kind, throws `TableQueryError`. That is an
  `HttpError(400)`, so `createHandler` answers 400. `parseTableQuery` bounds the page size,
  search length and filter values.
- **Search is literal.** `%` and `_` in the search box match themselves, not everything.
- **`migrate(db, migrations)` lets the Worker apply its own schema.** Each migration runs once,
  in one transaction with the row that records it, on the first query of each isolate. A fresh
  deploy, the Deploy button and a temporary account need no migration step, and two isolates
  racing on a new database is safe. If you prefer `wrangler d1 migrations apply`, use that
  instead.
- `queryRows(db, sql, params, parseRow)` runs any other statement through a parser.
- The D1 binding fits `Database` by shape. Hyperdrive or any client with
  `prepare`/`bind`/`all` fits too.

`cascivo create --framework cloudflare --example crud` scaffolds a customers table with
create, edit and delete.

## Live dashboards — `@cascivo/app/live` and `@cascivo/app/live-server`

Events go into a Queue. Its consumer adds them into per-second totals in a `LiveRoom` Durable
Object, and every browser watching gets each second as it changes. The room keeps the window,
so a new viewer, or one back from a dropped connection, starts with all of it.

```ts
// shared
export const ops = defineLive({ metrics: ['orders', 'revenue', 'errors'], window: 120 })

// the Worker
export { LiveRoom } from '@cascivo/app/live-server'
export default {
  async fetch(request, env) {
    // POST /api/events: env.EVENTS.sendBatch(events.map((e) => ({ body: e })))
    // GET /api/live (WebSocket): roomResponse(request, env.LIVE, 'ops', { readOnly: true })
  },
  async queue(batch: LiveBatch, env: Env) {
    await recordLive(ops, env.LIVE, 'ops', batch.messages.map((m) => m.body))
  },
}

// the page
const live = watchLive(ops, '/api/live')
<LineChart series={[{ id: 'orders', label: 'Orders', data: live.points.value }]}
  x={(p) => new Date(p.at)} y={(p) => p.values.orders} />
```

- `defineLive({ metrics, window, bucket })` names the metrics (each event adds to them) and
  sets how many seconds are kept (default 120) in buckets of how many seconds (default 1).
  `parseEvent`/`parseEvents` check what arrives; an unknown metric is refused.
- `recordLive(live, namespace, room, bodies)` checks each message, drops the malformed ones
  with a warning, and adds the rest in one request to the room. Events outside the window are
  dropped, and buckets that leave it are deleted. It throws when the room cannot be reached,
  so the Queue retries the batch. Delivery is at least once: a batch retried after a lost
  reply counts twice.
- `watchLive(live, url)` gives `points`, the whole window oldest first with a zero for each
  empty bucket. It slides every bucket on this device's clock, with or without events.
- `LiveRoom` is a `SyncRoom`, so browsers connect to it the same way. Only `recordLive` can
  write: `roomResponse` strips the header it uses from any request it forwards.

`cascivo create --framework cloudflare --example live` scaffolds an `/ops` dashboard with KPIs
and charts, fed by simulated traffic from the page.

## Accounts — `@cascivo/app/auth` and `@cascivo/app/auth-server`

Passwordless sign-in: someone enters an email, gets a one-time link, and opening it signs
them in with a session cookie. Users, links and sessions live in D1.

```ts
// the Worker
const auth = handleAuth(env.DB, {
  sendLink: (email, url) =>
    env.EMAIL.send({ from, to: email, subject: 'Sign in', text: url, html }),
  exposeLink: import.meta.env.DEV, // vite dev shows the link instead of sending it
})
const answered = await auth(request) // /api/auth/start, /verify, /me, /signout
if (answered) return answered
const user = await requireUser(env.DB, request) // 401 signed out, 403 from another site

// the browser
export const auth = createAuth()
auth.user.value // undefined while checking, then { id, email } or null (email may be null)
await auth.start(email)
await auth.verify(token) // on the page the link opens
```

- **Only hashes are stored.** A link and a session id are random 32-byte tokens; D1 keeps
  their SHA-256, so a leaked table signs no one in.
- **A link works once, for 15 minutes.** It is consumed by a single `DELETE … RETURNING`, so
  two tabs racing on one link cannot both sign in.
- **The link opens a page, not the API.** The page posts the token when the user presses a
  button, because mail scanners open every link in a message and would use it up.
- **The cookie** is `__Host-session`: HttpOnly, Secure, SameSite=Lax, 30 days.
  `requireUser` also refuses a state-changing request whose `Origin` is another site.
- **No account enumeration.** `/start` answers the same whether or not the address has an
  account; an account is created on first sign-in.
- Rate-limit `/api/auth/start` per caller (`rateLimit` from `@cascivo/app/guard`): each call
  sends an email.

`cascivo create --framework cloudflare --auth email` scaffolds it, with every API write
requiring a signed-in user.

## Sign in with GitHub, Google or LinkedIn — `@cascivo/app/oauth` and `@cascivo/app/oauth-server`

`handleOAuth` adds provider sign-in to the same users and sessions as `handleAuth`, so both can
sit on one sign-in page and `requireUser` works for either.

```ts
// the Worker
import { github, google, linkedin } from '@cascivo/app/oauth'
import { handleOAuth } from '@cascivo/app/oauth-server'

const oauth = handleOAuth(env.DB, {
  secret: env.AUTH_SECRET, // ≥ 32 characters: openssl rand -base64 32
  providers: [
    github({ clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET }),
    google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
    linkedin({ clientId: env.LINKEDIN_CLIENT_ID, clientSecret: env.LINKEDIN_CLIENT_SECRET }),
  ],
})
const answered = await oauth(request) // /api/auth/oauth/<id>, …/callback, /oauth, /me, /signout
if (answered) return answered

// the browser
await auth.providers() // ['github', 'google']
<a href={auth.signInUrl('github')}>Sign in with GitHub</a> // back to this page afterwards
```

Register `https://<your app>/api/auth/oauth/<id>/callback` as the redirect URI at each
provider (GitHub: an OAuth App; Google: an OAuth client of type "Web application"; LinkedIn:
an app with the "Sign In with LinkedIn using OpenID Connect" product).

- **The flow is checked end to end.** `state`, a PKCE verifier (S256) and an OpenID `nonce`
  travel in a sealed (AES-GCM), HttpOnly, `SameSite=Lax` cookie that lives ten minutes. A
  callback without it, with another flow's state, or for another provider is refused.
- **Google's ID token is verified** against Google's published keys: signature, issuer,
  audience, expiry and nonce. `google({ hostedDomain: 'acme.com' })` admits only that
  Workspace domain, checked on the token, since the `hd` parameter alone is just a hint.
- **LinkedIn's ID token is verified the same way.** LinkedIn takes no PKCE from a web app, so
  the client secret and `state` protect the exchange; a `nonce` it echoes must match.
- **GitHub's email is read only when it is the primary one and verified.** GitHub has no ID
  token; the adapter reads `/user` for the numeric id and `/user/emails` for the address.
- **Accounts are linked by identity, not by email.** A user is found by `(provider, subject)`.
  A new identity joins the signed-in user if there is one (a "connect GitHub" button on a
  settings page), else the user with the same _verified_ email (so a sign-in link and Google
  on one address are one account), else a new user. An identity already linked to someone else
  is refused while another user is signed in.
- **Email is optional.** `User.email` is `string | null`: a provider that shares no verified
  address still signs someone in. Check it before sending them mail.
- **Failures land on a page, not a JSON error.** The callback redirects to `errorPath`
  (default `/signin`) with `?error=denied | expired | state_mismatch | provider_error |
identity_in_use`.
- **The redirect never leaves the app.** `?returnTo=` must resolve to this origin; anything
  else lands on `/`. Set `origin` when the Worker answers on more than one host, so the
  redirect URI always matches the registered one.

`@cascivo/app/oauth` has no database, cookie or Worker code, so the adapters work on their own
anywhere `fetch` and WebCrypto do. Keep the tokens to call the provider's API on the user's
behalf, sealed for storage:

```ts
const { url, pending } = await beginAuthorization(
  google({ clientId, clientSecret, offline: true, scopes }),
  { redirectUri },
)
// … the browser comes back …
const { tokens, identity } = await completeAuthorization(
  provider,
  pending,
  callbackUrl.searchParams,
)
const stored = await seal(env.TOKEN_SECRET, `tokens:${identity.subject}`, tokens) // unseal() to use
```

`cascivo create --framework cloudflare --auth oauth` scaffolds GitHub, Google and LinkedIn
sign-in; `--auth email,oauth` puts both methods on one page.

## Connected accounts and posting — `handleConnections` and `@cascivo/app/social`

Signing in throws the provider's tokens away. Connecting an account keeps them, so the app can
act for the user later: post to their LinkedIn, from a queue, at a scheduled time.

```ts
// the Worker: /api/connections for the signed-in user
import { connectionTokens, handleConnections, markReconnect } from '@cascivo/app/oauth-server'
import { linkedinPublisher, PublishError } from '@cascivo/app/social'

// Its own instance, with the posting scope; the one for sign-in asks for identity only.
const providers = [
  linkedin({ clientId, clientSecret, scopes: ['openid', 'profile', 'w_member_social'] }),
]
const answered = await handleConnections(env.DB, { secret: env.AUTH_SECRET, providers })(request)
// GET /api/connections, GET /api/connections/linkedin (connect), DELETE /api/connections/<id>

// later, in a queue consumer or a Workflow step
const { connection, tokens } = await connectionTokens(
  env.DB,
  { secret, providers },
  { userId, connectionId },
)
try {
  const { url } = await linkedinPublisher().publish({ tokens, subject: connection.subject }, post)
} catch (error) {
  if (error instanceof PublishError && error.kind === 'reconnect')
    await markReconnect(env.DB, connection.id)
  throw error
}
```

- **Tokens are encrypted at rest** (AES-256-GCM under your secret), bound to their row: a
  sealed value copied to another row does not open. Rotating the secret turns every
  connection into `reconnect`.
- **A connection says when to ask the user back.** `status` is `active`, `expiring` (a token
  that cannot be refreshed ends within `expiringDays`, default 7: LinkedIn's 60-day tokens) or
  `reconnect`. Connecting the same account again renews it in place. `expiringConnections(db)` lists
  the expiring ones across all users, with each owner's email, for a job that reminds them.
- **Refresh happens on use, once.** `connectionTokens` refreshes a token that is about to
  expire. One request at a time holds the refresh; others wait for its result, so a provider
  that replaces its refresh token on every use never sees a spent one.
- **`social` checks before it posts.** `check(post)` is synchronous and lists what the network
  would refuse (length in characters, image count and types, alt text, link cards), so a
  composer can show it while typing and a scheduled post fails before it is queued.
- **LinkedIn specifics are handled.** Text is escaped for LinkedIn's "little" format (a
  hashtag that starts a word still links), images are uploaded and attached by URN, a link
  card carries its own title and thumbnail (LinkedIn does not read the page), and every call
  pins `LinkedIn-Version` (`LINKEDIN_VERSION` is the default, exported for a settings
  screen). `escapeLittleText` runs once, last, on the whole text, URLs included; comments are
  not in that format and go as written.
- **`PublishError.kind`** is `invalid`, `reconnect`, `rate_limited` or `failed`;
  `retryable` is true only for rate limits and 5xx. LinkedIn cannot deduplicate, so a request
  that timed out is not retried for you.
- **Threads of posts.** `publish(target, post, { replyTo })` posts a reply to what an earlier
  `publish` returned: `in_reply_to_id` on Mastodon, `reply_to_id` on Threads, a reply with
  its root and parent on Bluesky (which is why `PublishedPost` carries `replyRef`: store the
  whole object), and a comment on the share on LinkedIn (text only, 1,250 characters).
  Buffer cannot reply and refuses it. `publishThread(publisher, target, posts, options)`
  chains them; a part that fails throws with `published` naming the parts already out, so a
  retry resumes from the last.
- **Each publisher counts its own way.** `publisher.measure(text)` is the count `check` uses,
  and `limits.unit` says it in words (`characters, counting any URL as 23 and a mention
without its server`), so a composer and a linter agree with `check` by construction.
- **Images by URL.** An image is `{ data: Blob, alt }` or `{ url, alt }`. Threads and Buffer
  are given the URL as it is; the other publishers fetch it (pass only URLs your app made)
  and check its type once fetched.
- **No direct X publisher.** X is reachable through Buffer only.

Like `oauth`, `social` has no database or Worker code: give it any `TokenSet` and subject.
`renewalDue(provider, tokens)` from `@cascivo/app/oauth` is the renewal rule
`connectionTokens` follows, without the database: `soon` (call `provider.refresh`), `cannot`
(it stops working within a week and only reconnecting helps, as with LinkedIn) or `no`, for an
app that stores tokens in its own tables.

### Bluesky: AT Protocol OAuth, all of it

`bluesky()` is a provider for every AT Protocol account. The flow takes the user's handle (or
DID) as `?server=`, resolves it (DNS over HTTPS, then `/.well-known/atproto-did`) to the DID,
its document to the PDS, and the PDS to its authorization server, then runs the protocol as
the spec requires: a pushed authorization request, PKCE, and DPoP on every request, with the
nonce retry a stateless Worker needs.

```ts
const providers = [
  bluesky({
    clientMetadataPath: '/oauth/client-metadata.json', // your client id is this URL
    privateKey: parseBlueskyKey(env.BLUESKY_PRIVATE_JWK), // optional: a confidential client
  }),
]
// Serve what Bluesky's servers fetch:
//   GET /oauth/client-metadata.json → blueskyClientMetadata({ origin, redirectPaths, clientName, privateKey })
//   GET /oauth/jwks.json            → blueskyJwks(privateKey)
await blueskyPublisher().publish(
  { tokens, subject: connection.subject, server: connection.server },
  post,
  { idempotencyKey: `${postId}:${connection.id}`, createdAt: scheduledAt },
)
```

- **The account is checked, not trusted.** A handle must resolve to the DID and the DID
  document must claim the handle back. The callback's `iss` must be the authorization server
  the flow used, and the tokens' `sub` must be the DID resolved for this flow, whose document
  points at that server. That is what stops a hostile server from signing in as someone
  else's DID. Every host in the chain is fetched with the same limits as Mastodon's, and the
  authorization server's endpoints must be on its own origin.
- **The account is named.** The display name and avatar come from the profile record on the
  account's own PDS (the avatar as the PDS's blob URL), best effort: a missing profile leaves
  them `null`.
- **Tokens are bound to a key.** The flow makes a P-256 key; `TokenSet.dpop` keeps it with
  the issuer and client id, sealed with the tokens. `connectionTokens` refreshes them under
  its lease, which matters here: Bluesky replaces the refresh token on every use.
- **Three kinds of client.** In development a redirect to `127.0.0.1` makes the app
  Bluesky's loopback client, which needs no metadata (open the app at `127.0.0.1`, not
  `localhost`). Deployed, the client id is your metadata URL; without `privateKey` the app is
  a public client (sessions end after two weeks), with one it signs a `private_key_jwt`
  assertion on each token request.
- **`blueskyPublisher`** counts graphemes (300), turns links, hashtags and mentions into
  facets at UTF-8 byte offsets (`blueskyFacets`; a mention's handle is resolved to its DID),
  builds a link card from the title you give (Bluesky does not read the page), and uploads
  up to four images of 1 MB. With `idempotencyKey` and `createdAt` the record key is fixed
  (`blueskyRecordKey`), and a retry returns the post it already made.

### Buffer: the networks this package does not post to itself

Buffer is a scheduler in front of X, Instagram, TikTok, Facebook, Pinterest, YouTube, Google
Business Profile, Threads and the networks above. Connect a user's Buffer with `buffer()`, or
post to your own with a personal API key (`bufferTokens(env.BUFFER_API_KEY)`):

```ts
const providers = [
  buffer({ clientId: env.BUFFER_CLIENT_ID, clientSecret: env.BUFFER_CLIENT_SECRET }),
]
// connection.subject is the Buffer organization; each channel is one social account in it
const channels = await bufferChannels(tokens, connection.subject)
await bufferPublisher({ service: channel.service, uploadImage }).publish(
  { tokens, subject: channel.id },
  post,
  { createdAt: dueAt }, // ahead: Buffer holds it in its queue; else it shares now
)
```

- **OAuth with PKCE** (mandatory at Buffer), `prompt=consent`, and `offline_access` for a
  refresh token. Refresh tokens are single-use and reusing one revokes the grant, so
  `connectionTokens`' lease matters here as it does for Bluesky.
- **GraphQL errors arrive with a 200.** `bufferQuery` reads `errors[]` and
  `extensions.code` as well as the status; a `MutationError` (a refused post) is `invalid`,
  `UNAUTHENTICATED` or a 401 is `reconnect`, and a rate limit carries `Retry-After` on
  `PublishError.retryAfter`.
- **Images go by public URL**: Buffer fetches them. Give each image a `url`, or pass
  `uploadImage` (put the image in R2 behind a short-lived signed URL, return the URL); an
  image with bytes and no `uploadImage` is refused by `check`.
- **`check` knows the network behind the channel** for the well-known limits (X 280, Threads
  and Mastodon 500, Bluesky 300 graphemes, Instagram 2,200, LinkedIn 3,000) and leaves the
  rest to Buffer. A link is appended to the text; the network builds its card.
- **No idempotency.** Like LinkedIn, a request that timed out may have posted; the post's
  `url` is `null` until Buffer sends it. Every request counts against the budget of the
  plan that owns the app client, for all users together (100 per 15 minutes).

### Threads: posting only, and a token that renews itself

`threads()` connects an account to post with; it is not offered for sign-in (Threads shares
no email). The code buys a one-hour token, traded at once for a 60-day one. There is no refresh
token: the long-lived token renews itself once it is a day old, and never after it expires, so
the provider declares `refreshAhead` (30 days) and a daily Cron Trigger renews the quiet ones:

```ts
const providers = [threads({ clientId: env.THREADS_APP_ID, clientSecret: env.THREADS_APP_SECRET })]

export default {
  // wrangler.jsonc: "triggers": { "crons": ["17 4 * * *"] }
  async scheduled(_event, env) {
    await refreshConnections(env.DB, { secret: env.AUTH_SECRET, providers })
  },
}

await threadsPublisher({ uploadImage }).publish({ tokens, subject: connection.subject }, post)
```

- **Renewal never costs a working token.** `connectionTokens` renews a `refreshAhead` token in
  its window; if Meta refuses, it keeps the current one and tries again on the next call. A
  token that never renews shows as `expiring` in its last week, then `reconnect`.
- **Two steps, as Meta requires.** A media container (text, an image, or a carousel of up to
  20), waited on while Meta fetches the images, then published. Images go by public URL, as
  with Buffer: pass `uploadImage`. Alt text is sent with each image.
- **500 characters, emoji by their UTF-8 bytes** (`threadsLength`). A text post shows its link
  as a card; one with images carries the link in its text.
- **No idempotency, 250 posts a day.** Like LinkedIn, a request that timed out may have posted.
- **Meta's review gates strangers.** Until App Review and Tech Provider verification pass,
  only the app's own testers can connect.

### Mastodon: one provider, many servers

Every Mastodon server runs its own OAuth, so `mastodon()` is a factory. The flow takes the
user's server as `?server=` (`/api/connections/mastodon?server=hachyderm.io`, or a handle such
as `@ada@hachyderm.io`), discovers its endpoints, registers your app there once, and keeps the
registration (client secret sealed) with `mastodonRegistrations`:

```ts
const providers = [
  mastodon({
    appName: 'Acme',
    website: 'https://acme.example',
    scopes: ['profile', 'write:statuses', 'write:media'],
    registrations: mastodonRegistrations(env.DB, env.AUTH_SECRET),
  }),
]
// connectionTokens(…) → { connection, tokens }; connection.server is the account's server
await mastodonPublisher().publish(
  { tokens, subject: connection.subject, server: connection.server },
  post,
  { idempotencyKey: `${postId}:${connection.id}` }, // retries cannot post twice
)
```

- **The server name is distrusted input.** `normalizeServer` takes a host, URL or handle and
  refuses IP addresses, ports, single labels and local names; credentials in a URL are
  stripped with the handle's user part. Calls to it time out after ten
  seconds, follow no redirects, and stop reading after 256 KB. Its metadata may not move the
  token endpoint to another host.
- **Old and new servers.** Mastodon 4.3+ announces PKCE and the `profile` scope, and both are
  used; an older server gets `read:accounts` and no PKCE. GoToSocial and Akkoma speak the same
  API.
- **The account is `<id>@<server>`,** with a `@user@server` handle and no email. Tokens do not
  expire; a refused one is a `reconnect`.
- **`mastodonPublisher`** counts like Mastodon (any URL is 23 characters, a mention without its
  server), appends a link to the text so the server builds the card, uploads images and waits
  while the server processes them, and sends `Idempotency-Key`.
- **Each server has its own limits.** `mastodonServerLimits(server)` reads them from the
  server's public `/api/v2/instance` (characters, images per post, what a URL counts as) and
  falls back to Mastodon's defaults. Pass the result to `mastodonPublisher(limits)` so `check`
  agrees with the server: hachyderm.io takes 2263 characters, not 500.

## Who may call the Worker — `@cascivo/app/guard`

Three checks for the top of a Worker's `fetch`, or inside a `createHandler` handler. Each
throws an `HttpError`, so a handler answers with its status; in `fetch`, `guardResponse(error)`
turns it into a JSON response.

```ts
import { clientIp, guardResponse, rateLimit, requireAccess, verifyTurnstile } from '@cascivo/app/guard'

async fetch(request, env) {
  try {
    // Cloudflare Access in front of an internal tool: 403 unless Access signed this request.
    const who = await requireAccess(request, { teamDomain: env.ACCESS_TEAM_DOMAIN, audience: env.ACCESS_AUD })
    // The Rate Limiting binding ("ratelimits" in wrangler.jsonc): 429 past the limit.
    await rateLimit(env.LIMITER, who.email ?? clientIp(request))
  } catch (error) {
    return guardResponse(error)
  }
  …
}

// A public form: 403 unless Turnstile says a person submitted it.
signup: async ({ input }, { request, env }) => {
  await verifyTurnstile(input.turnstileToken, { secret: env.TURNSTILE_SECRET, remoteIp: clientIp(request), action: 'signup' })
  …
}
```

- **`requireAccess`** verifies the JWT Access adds to each request it lets through (the
  `Cf-Access-Jwt-Assertion` header, or the `CF_Authorization` cookie): the RS256 signature
  against your team's published keys, the issuer, the audience, and the expiry. The keys are
  cached for an hour and refetched once when Access rotates them. A request that reached the
  Worker around Access, at `*.workers.dev` for example, has no valid token and is refused. An
  empty team domain or audience refuses everything with a 500, so a deploy nobody configured
  fails closed.
- **`verifyTurnstile`** checks a token with Cloudflare's siteverify API, optionally for one
  action and hostname. A token is single-use. It throws `TurnstileError`, an `HttpError(403)`
  with Cloudflare's `errorCodes` (`timeout-or-duplicate`…) and a `reason`. Where a failed
  challenge answers differently per caller (the form again for a browser, a problem document
  for an API), `turnstileResult` returns `{ ok }` or `{ ok: false, reason, errorCodes }`
  instead of throwing.
- **`rateLimit(limiter, key)`** counts one call for `key` against the binding; the limit and
  period live in `wrangler.jsonc`. It counts per Cloudflare location, so treat it as abuse
  protection rather than exact accounting. To answer a limit your own way, call the binding:
  `(await env.LIMITER.limit({ key })).success`.

**`verifyWebhook(request, { scheme, secret })`** checks a webhook's signature over its raw body
before anything in it is trusted, and returns `{ body, id }`:

- `github`: `X-Hub-Signature-256`; `id` is `X-GitHub-Delivery`.
- `stripe`: `Stripe-Signature`, with a timestamp window (five minutes by default) against a
  captured delivery replayed later; `id` is the event's `evt_…`, read from the verified body.
- `standard`: [Standard Webhooks](https://www.standardwebhooks.com/) (Svix, Clerk, Resend…),
  with the `whsec_` secret, rotation and the timestamp window. Svix's own `svix-id`,
  `svix-timestamp` and `svix-signature` headers, which Resend and Clerk send, are read too.

`verifyWebhookBody(body, headers, options)` is the same check for a body already read: pass
the raw body exactly as it arrived. A bad or missing signature is a 401. Signatures are compared by WebCrypto's HMAC verify, in
constant time. A retried delivery keeps its id: store deliveries by it to handle each once.

`mountTurnstile(element, { siteKey, action, onToken })` from `@cascivo/app/turnstile` renders
the widget in the browser: it loads Cloudflare's script once and returns `reset()` and
`remove()`. Cloudflare's test keys (site key `1x00000000000000000000AA`, secret
`1x0000000000000000000000000000000AA`) always pass, for local development.

`cascivo create --framework cloudflare --auth access` scaffolds the Access check.
`--example files` and `--example export` rate-limit starting an upload or an export (20 a
minute per IP).

## Payments — `@cascivo/app/stripe`

Stripe Checkout from a Worker: create a session, send the browser to Stripe's hosted page, and
learn from the webhook that it was paid. The workflow end to end, with the mistakes it
prevents, is the [payments recipe](https://cascivo.com/docs/recipe-payments.md). Plain `fetch` against Stripe's API, so no SDK and no
`nodejs_compat`.

```ts
import { verifyWebhook } from '@cascivo/app/guard'
import { createStripe, parseStripeEvent } from '@cascivo/app/stripe'

// Starting a checkout: the price comes from the Worker, never from the browser.
const session = await createStripe(env.STRIPE_SECRET_KEY).createCheckoutSession(
  {
    mode: 'payment',
    lineItems: [{ name: 'Sticker pack', amount: 900, currency: 'eur', quantity: 1 }],
    successUrl: `${origin}/orders/${orderId}`,
    cancelUrl: `${origin}/shop`,
    clientReferenceId: orderId,
  },
  { idempotencyKey: orderId },
)
// → redirect to session.url, and store session.id with the order

// The webhook: verify the raw body first, then parse it.
const { body } = await verifyWebhook(request, {
  scheme: 'stripe',
  secret: env.STRIPE_WEBHOOK_SECRET,
})
const event = parseStripeEvent(body)
if (event.kind === 'checkout' && event.session.paymentStatus === 'paid') {
  // settle the order stored under event.session.id, once
}
```

- **`createStripe(secretKey, { apiVersion?, fetch? })`** — `createCheckoutSession(params,
{ idempotencyKey })` and `retrieveCheckoutSession(id)`. A line item is a dashboard Price
  (`{ price, quantity }`) or described inline (`{ name, amount, currency, quantity }`, the
  amount in the currency's smallest unit). Stripe's refusals throw `StripeError` with its
  `status`, `type` and `code`. Pin `apiVersion` so an account upgrade cannot change responses
  under a deployed app.
- **`parseStripeEvent(body)`** — the four Checkout events (`checkout.session.completed`,
  `…async_payment_succeeded`, `…async_payment_failed`, `…expired`) come back as
  `{ kind: 'checkout', session }`; every other event as `{ kind: 'other' }`, to acknowledge
  with a 2xx so Stripe stops retrying it.
- **`parseCheckoutSession(raw)`** — a session as Stripe sends it, field by field:
  `status`, `paymentStatus`, `amountTotal`, `currency`, `customerEmail`, `clientReferenceId`,
  `metadata`, and `paymentIntentId`: store it with the order, because refund and dispute
  events name the payment, not the session.

What the handler must still get right, because a webhook is retried and can arrive late or
out of order: settle each order once (an update guarded by its current status), look the
order up by the session id rather than `client_reference_id` (a buyer can set that on a
Payment Link), and treat `completed` with `paymentStatus: 'unpaid'` as not paid yet (a bank
debit settles days later, with `async_payment_succeeded`). Reading the session back with
`retrieveCheckoutSession` on the success page confirms a payment before the webhook arrives.

**Subscriptions.** `mode: 'subscription'` with a recurring line item (`interval: 'month'`)
opens a subscription checkout. Name the user in `subscriptionMetadata`: only your server sets
it, so every subscription event can be trusted to say whose plan it is.

```ts
await stripe.createCheckoutSession({
  mode: 'subscription',
  lineItems: [{ name: 'Pro', amount: 900, currency: 'eur', interval: 'month', quantity: 1 }],
  successUrl: `${origin}/billing?session={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${origin}/billing`,
  customer: existingCustomerId, // or customerEmail for a first subscription
  subscriptionMetadata: { user: user.id },
})

// The webhook: events arrive out of order, so store what Stripe says now, not the payload.
if (event.kind === 'subscription') {
  const current = await stripe.retrieveSubscription(event.subscription.id)
  // current.status, current.currentPeriodEnd, current.cancelAtPeriodEnd, current.metadata.user
}

// Plan changes, cards, invoices and cancellation: Stripe's hosted Customer Portal.
const { url } = await stripe.createPortalSession({ customer, returnUrl: `${origin}/billing` })
```

`parseStripeEvent` types `customer.subscription.created`, `…updated` and `…deleted` as
`{ kind: 'subscription', subscription }`, and a Checkout session carries `mode`, `customerId`
and `subscriptionId`. `parseSubscription` reads the billing period from the subscription or,
in newer API versions, from its first item. Save the Customer Portal's settings once in the
dashboard (test mode too) before opening it. For anything else in Stripe's API, install the
`stripe` package; it runs on Workers too.

**Gating a paid feature.** `isEntitled(status)` says whether a stored subscription status
unlocks the plan: `active` and `trialing` do, and so does `past_due` while Stripe retries a
failed renewal (pass `{ pastDue: false }` to lock it at once). How long the retries last is set
in the Stripe dashboard, which then ends the subscription as `canceled` or `unpaid`, so the
grace period is decided in one place. `requireEntitlement(status)` throws `HttpError(402)`
otherwise; call it in the Worker, never trusting what the page shows.

```ts
requireEntitlement(row?.status) // 402 unless the plan is on
```

**Refunds, disputes and failed renewals.** The webhook events after the sale:

```ts
await stripe.createRefund({ paymentIntent, amount: 300 }, { idempotencyKey: `${orderId}-refund` })

if (event.kind === 'refund') {
  // event.charge.amountRefunded is the running total; event.charge.refunded means all of it
}
if (event.kind === 'dispute') {
  // charge.dispute.created / …closed: event.dispute.status is 'won' or 'lost' once closed
}
if (event.kind === 'invoice' && event.type === 'invoice.payment_failed') {
  // tell the customer: event.invoice.hostedInvoiceUrl pays it with another card
}
```

- **`createRefund({ paymentIntent, amount?, reason?, metadata? }, { idempotencyKey })`** —
  refunds all or part of a payment. Change the order on `charge.refunded`, not on this call's
  answer, so a refund made in the dashboard is handled the same way.
- **`charge.refunded`** is `{ kind: 'refund', charge }`. `amountRefunded` is cumulative, so
  store the largest one seen: a retried or late event cannot count a refund twice.
- **`charge.dispute.created` / `…closed`** are `{ kind: 'dispute', dispute }` with
  `paymentIntentId`, `amount`, `reason` and Stripe's own `status` string (it adds new ones). A
  `created` can arrive after `closed`: store the dispute's status, and ignore `created` once one
  is stored.
- **`invoice.paid` / `invoice.payment_failed`** are `{ kind: 'invoice', invoice }` with
  `customerId`, `subscriptionId` (from either API version's place for it), `amountDue`,
  `attemptCount`, `nextPaymentAttempt` and `hostedInvoiceUrl`. Each failed attempt is its own
  event, and each can be retried: key a reminder on the invoice id and the attempt count.
- `parseCharge`, `parseDispute` and `parseInvoice` read each object on its own.

`cascivo create --framework cloudflare --example checkout` scaffolds all of it: a product
page, the order page that updates live when the webhook arrives, orders in D1 (refunded and
disputed ones included), and a receipt rendered with `@cascivo/email`. With `--auth email` it
adds `/billing`: a monthly plan, kept in step by the subscription events, gated with
`requireEntitlement`, an email when a renewal fails, and the billing portal.

## Email with Amazon SES — `@cascivo/app/ses`

Sending through Amazon SES from a Worker, and hearing about bounces and complaints through SNS.
AWS Signature Version 4 is computed with WebCrypto: no AWS SDK, no `nodejs_compat`. The client
is also an `EmailSender` for `@cascivo/email`: `sendEmail(ses, renderEmail(…), envelope)`
renders, checks and sends through SES (see `send` below).

```ts
import { createSes, handleSns, parseSesNotification } from '@cascivo/app/ses'

const ses = createSes({
  region: env.AWS_REGION,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
})
await ses.sendEmail({
  from: 'Example News <news@example.com>',
  to: 'reader@example.org',
  subject,
  html, // e.g. renderEmail(…).html from @cascivo/email
  text,
  headers: {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  },
})

// SES publishes bounces and complaints to an SNS topic; subscribe this route to it over HTTPS.
return handleSns(request, {
  topicArn: env.SNS_TOPIC_ARN, // your topic: never the ARN read from the message
  confirmSubscriptions: true, // or onSubscription, to let an operator confirm
  onNotification: async ({ message }) => {
    const event = parseSesNotification(message)
    if (
      event.kind === 'complaint' ||
      (event.kind === 'bounce' && event.bounceType === 'Permanent')
    ) {
      // stop mailing event.recipients
    }
  },
})
```

- **`createSes({ region, accessKeyId, secretAccessKey, sessionToken? })`** — `sendEmail` calls
  SES v2 `SendEmail` with HTML and text parts, reply-to, a configuration set and extra headers.
  A header value holding a line break is refused. SES's refusals throw `SesError` with its
  `code` (`MessageRejected`, `TooManyRequestsException`…) and `retryable`, true for throttling
  and server errors. Give the IAM user `ses:SendEmail` and nothing else (and
  `ses:GetEmailIdentity` for `identity`).
- **`ses.identity(domain)`** — what a setup screen prints: `verified`, the DKIM `status`, and
  the three Easy DKIM CNAME `records` (`name`, `value`) built on the region's own DKIM zone.
  `null` when SES has no such identity.
- **`handleSns(request, { topicArn, onNotification })`** — verifies each message's RSA
  signature (versions 1 and 2) against the certificate at `SigningCertURL`, fetched only from
  an `sns.<region>.amazonaws.com` host and cached. A message from a topic `topicArn` does not
  accept, or with a changed field, is refused with a 401. `topicArn` is one ARN, a list, or a
  test (`(arn) => boolean`): the signature proves AWS sent a message, not that it concerns
  you, since any AWS account can subscribe your endpoint to its own topic. So pass ARNs you
  know, never the one in the message. A subscription request is not confirmed unless you say
  so: `confirmSubscriptions: true` confirms it, or `onSubscription(subscription)` receives its
  `topicArn` and `token` for an operator to confirm with `confirmSnsSubscription`.
  `verifySnsMessage` is the check alone.
- **`confirmSnsSubscription({ topicArn, token })`** — `ConfirmSubscription` on the topic's own
  regional SNS host, built from the verified ARN and token rather than by following the
  message's `SubscribeURL`. Returns `{ subscriptionArn }`; throws when SNS refuses (a token
  lasts three days).
- **`parseSesNotification(message)`** — `bounce` (with `bounceType`: only `Permanent` means
  never mail the address again; `subType` such as `OnAccountSuppressionList`; and the
  receiving server's `diagnostic`), `complaint`, `delivery`, or `other`, from identity
  notifications and configuration-set events alike. Every event carries `at`, when it
  happened in epoch milliseconds (SNS can deliver out of order).
- **`send(message)`** — the same client as an `EmailSender` for `@cascivo/email`, so a
  rendered email goes through that package's checks (subject, preheader, text part, size,
  line breaks in headers) on its way to SES, and switching from the Email Service binding is
  one argument:

  ```ts
  import { renderEmail, sendEmail } from '@cascivo/email'
  await sendEmail(ses, renderEmail(<Welcome name={name} />, { subject }), {
    from: { name: 'Example', email: 'hi@example.com' },
    to,
    attachments: [{ filename: 'report.pdf', type: 'application/pdf', content: pdf, disposition: 'attachment' }],
  })
  ```

  Display names that are not plain ASCII are encoded (RFC 2047); cc, bcc, reply-to and
  attachments (bytes, or a base64 string as the binding takes it) map onto SES v2's fields.

- **`signAwsRequest(request, credentials, { region, service })`** — the Signature V4 headers
  for any other AWS API call.

`cascivo create --framework cloudflare --example newsletter` scaffolds a newsletter on it:
double opt-in, a composer that renders with `@cascivo/email`, sending through a Queue,
one-click unsubscribe, and suppression from SES feedback.
