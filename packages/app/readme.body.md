`@cascivo/app` is the client-app layer for cascivo. It has three parts:

- a router whose state is signals
- a typed API contract shared by the browser and a Cloudflare Worker
- file-based routes

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
