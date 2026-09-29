Cascivo Chat is a streaming AI chat app. It runs on **Cloudflare Workers AI** and is built with **Preact** and cascivo.

**This is a real backend, not a mock.** One Worker serves the built client app and the `/api/chat` endpoint. The endpoint streams model tokens back over server-sent events. Conversations are stored in the browser, in IndexedDB, through `@cascivo/storage`.

## Architecture

```
browser (Preact + signals)                     Cloudflare Worker
──────────────────────────                     ─────────────────
AiChat ← draft signal ← parseSSE(fetch body) ◄── toChatStream(parseSSE(AI.run(stream: true)))
conversations ⇄ IndexedDB (persistedSignal)       validates every request (parseChatRequest)
```

- `src/lib/protocol.ts` is the wire contract. The client and the Worker both import it. If one side is not updated after a protocol change, the type checker reports an error.
- `src/lib/sse.ts` is the SSE parser. The Worker uses it to read the Workers AI stream, and the browser uses it to read the Worker's stream. It follows the spec. It handles chunk splits, CR/LF/CRLF line endings, multi-line data, `id` and `retry`. It cancels the upstream when the consumer stops.
- The Worker re-encodes model output into `token` / `done` / `error` events. You can change the model or the provider in the Worker only; the client does not change.
- The source is typed against React. `vite.config.ts` aliases `react` to `preact/compat`, so the bundle runs on Preact. The bundle is about 69 KB gzip in total. If you remove the aliases, the same code runs on React.

## Run

```sh
# From this directory: the Vite dev server serves /api from the real Worker module,
# with a mock AI binding. You do not need a Cloudflare account.
pnpm dev

# The same Worker, in wrangler, against real Workers AI (needs `npx wrangler login`)
pnpm dev:worker

# Build and deploy the SPA and the Worker to your Cloudflare account
pnpm deploy
```

## What it demos

- `AiChat` and `StreamingText` (`@cascivo/ai`)
- `Alert`, `Button`, `EmptyState`, `Select`, `Spinner` (`@cascivo/react`)
- `AppShell` from `@cascivo/example-kit`
- `persistedSignal` with `indexedDBDriver` (`@cascivo/storage`)

## Why this app exists

This app is phase 1 of the "cascivo for client apps" exploration. It builds one real app first, then extracts only the primitives that the app needed. See [`FINDINGS.md`](./FINDINGS.md) for what the app showed.
