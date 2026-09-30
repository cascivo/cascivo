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

> **Early.** It is versioned in lockstep with `@cascivo/core`, because a second copy of core means a second signal registry. This package was built from two real apps: [`apps/examples/chat`](../../apps/examples/chat) and the `cloudflare` scaffold. It covers what they needed. It has no nested layouts or data loaders yet. See `docs/internal/ROADMAP-V60.md` for the scope and the kill criteria.

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
