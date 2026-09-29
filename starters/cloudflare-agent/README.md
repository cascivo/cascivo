# cascivo-agent

A [cascivo](https://cascivo.com) app on Cloudflare: a client-rendered
React app and its API, deployed as one Worker.
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
support Workers AI or R2. So a preview serves the app, but its assistant cannot reach the model: deploy it
to your own account for that.

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

## Assistant (generative UI)

`/assistant` is a chat whose answers can be UI. The model calls a `show_view` tool with a view
config; the Worker checks it against the component manifests (`validateView` from
`@cascivo/render/validate`) and returns any errors to the model, which fixes them and calls
again. The page renders the result with `<CascivoView>`: real components, no generated code.

- `worker/assistant.ts` — `Assistant`, an `AIChatAgent` (Cloudflare's Agents SDK): one
  Durable Object per conversation, which stores the messages and streams replies to every open
  tab. The system prompt, the `show_view` tool and the model (`MODEL`, any Workers AI model
  with tool calling) are here.
- `src/assistant.ts` — `checkView`, the one check both sides run on a view.
- `src/routes/assistant.tsx` — `useAgent` + `useAgentChat`; one conversation per browser.
- `worker/scripted-model.ts` — `vite dev` answers from this scripted model, so the page works
  offline and without an account. `VITE_REAL_AI=1 npm run dev` uses Workers AI instead
  (after `npx wrangler login`); a deployed Worker always does.

Workers AI bills per use beyond its free daily allocation.

Add more components with `npx cascivo add <component>`.

## React or Preact

This app runs on React. The Agents SDK's hooks call React 19's `use()`, which
Preact's compat layer does not implement, so the assistant page needs React. (The other pages
would run on Preact unchanged: the source is typed against React either way.)
