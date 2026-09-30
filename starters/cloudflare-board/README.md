# cascivo-board

A [cascivo](https://cascivo.com) app on Cloudflare: a client-rendered
Preact app and its API, deployed as one Worker.
There is no server rendering; the browser gets the app, and `/api/*` reaches the Worker.

## Develop

```sh
npm install
npm run dev
```

`vite dev` runs `worker/index.ts` in workerd, the same runtime as production, via
`@cloudflare/vite-plugin`.

## Deploy

```sh
npx wrangler login   # once
npm run deploy
```

## Share a preview (no account)

```sh
npm run deploy:preview
```

This builds the app, then deploys it to a temporary Cloudflare account with
`wrangler deploy --temporary`. You need no sign-up. It prints two URLs:

- **A public `workers.dev` URL** for the app.
- **A claim URL.** Open it and sign in within 60 minutes to keep the deployment; otherwise it is deleted.

It works only while wrangler is logged out. If you are logged in, use `deploy` instead.
A temporary account supports Workers, static assets, KV, D1 and Durable Objects. It does not
support Workers AI, R2, Workflows or Browser Run.

## Structure

- `src/routes/` — one file per page. `index.tsx` is `/`, `settings.tsx` is
  `/settings`, `c/[id].tsx` is `/c/:id` (it receives `params.id`), `404.tsx` is
  everything else. `src/routes.gen.ts` is rewritten from this folder; do not edit it.
- `src/api.ts` — the API contract both sides import: endpoints, their paths, and parsers
  for what crosses the network.
- `worker/index.ts` — the API's handlers, typed from `src/api.ts`. Add bindings (KV,
  D1, R2, Durable Objects, Workers AI) in `wrangler.jsonc`; handlers receive them as `env`.
- `src/live.ts` + `src/LiveCard.tsx` — a streaming endpoint read through the typed
  client into signals.
- `src/App.tsx` — the nav (real `href`s) and the `RouterView`.
- `src/Shell.tsx` — the app shell (header + side nav + content slot).

Persist client state with `persistedSignal` from `@cascivo/storage` (localStorage or
IndexedDB).

## Board (multiplayer)

`/board` is a shared board. Open it in two windows: notes, edits and cursors sync live.

- `src/board.ts` — `connectRoom('/api/rooms/<name>')` from `@cascivo/app/sync`; `room.map('notes', parseNote)`
  is a signal every visitor shares, and `room.presence` carries cursors.
- `worker/index.ts` — exports `SyncRoom`, one Durable Object per room, and routes
  `/api/rooms/:name` to it (bound as `ROOMS` in `wrangler.jsonc`).
- `/board?room=team` is a separate board.

Each path (one note) is last-writer-wins in the order the room receives writes, so two people
editing the same note at once settle on one value; editing different notes never collides.
Durable Objects work on a temporary account, so `deploy:preview` shares a live board with
no Cloudflare account.

Add more components with `npx cascivo add <component>`.

## Preact or React

The source is typed against React. The runtime is one plugin in `vite.config.ts`:
`@preact/preset-vite` runs it on Preact, `@vitejs/plugin-react` on React. Switching
needs no source changes; swap the plugin and the matching dependencies. For this starter,
Preact ships about a third of the client JS (~27 KB gzip against ~85 KB).
