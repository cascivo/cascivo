# Phase 1 findings: building a real client app on cascivo + Cloudflare

This app was built to test the "cascivo for client apps" idea against real code before
designing any framework. The rule was: build one real app, and extract only what it needed.
This file records what the app showed.

**Not verified:** the app has not yet been run against **real** Workers AI. This environment
has no Cloudflare account. The Worker is tested end-to-end against a mock binding that
produces the documented Workers AI stream format: `data: {"response":"…"}` chunks, then
`data: [DONE]`. Run `pnpm dev:worker` (after `npx wrangler login`) or `pnpm run deploy` to close
that gap.

## Bugs found in cascivo (fixed in this change)

| Where                         | Bug                                                                                                                    | Impact                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `@cascivo/ai` `StreamingText` | The `useSignalEffect` read the `text` prop from a closure. It never ran again after it caught up with the first chunk. | **`AiChat` streaming did not work.** Replies appeared only when complete. Every adopter who streams into `AiChat` hits this. |
| `@cascivo/ai` `AiChat`        | `listRef` was declared but never used, so the log never scrolled.                                                      | Streamed replies grew below the fold.                                                                                        |

Both bugs passed the existing unit tests. The tests rendered one static `text` and never
changed it. Only a real streaming app exposed them. That is the strongest argument for
phase 1.

## Gaps found (not fixed; each needs an API decision)

- **`AiChat` has no stop control.** The app puts a "Stop generating" button beside the chat.
  An `onStop` prop, or an `actions` slot per the vocabulary rule, is the obvious addition.
- **`AiChat` messages carry no metadata.** A stopped or failed reply can be marked only by
  editing its `content`. A `status` field on `ChatMessage` would fix this.
- **No Markdown rendering.** Models reply in Markdown. The app shows it as plain text.
- **`AiChat` input is not disabled while history loads.** The app shows a `Spinner` until
  `conversations.ready` is true. Without that, a message sent before IndexedDB hydration
  would be overwritten when storage loads. This race belongs in the `persistedSignal` docs.
- **`className` rejects `undefined`** under `exactOptionalPropertyTypes`. Because of that, a
  CSS-module lookup (`styles['x']`, typed `string | undefined`) cannot be passed directly.

## What the app needed, and where it now lives

| Need                                                                                         | Size                         | Decision                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| An SSE parser that works over **any** byte stream (`EventSource` cannot POST a request body) | ~90 lines                    | **Extracted to `@cascivo/data`** (phase 2). It is used on _both_ sides: the Worker parses the Workers AI stream, and the browser parses the Worker's stream.                                                                                                                                  |
| `fetch` + status check + JSON error body + SSE parse                                         | ~25 lines                    | **Extracted** as `fetchSSE`. Every app that streams from its own API repeats this boilerplate.                                                                                                                                                                                                |
| Encoding SSE events                                                                          | 3 lines                      | **Extracted** as `formatSSE`, the other half of the wire format.                                                                                                                                                                                                                              |
| The stream lifecycle: abort controller, draft signal, commit on done/abort, error state      | ~50 lines in `store.ts`      | **Not extracted.** The commit semantics are app-specific (keep partial replies? mark them?). If a second app shows the same lifecycle, extract it then.                                                                                                                                       |
| Persisted history in IndexedDB                                                               | 0 new lines                  | Already covered by `persistedSignal` + `indexedDBDriver`. It writes the whole array per change, which is fine at chat scale. A per-record `collection()` needs a second app with real volume.                                                                                                 |
| A router                                                                                     | none at first                | **Phase 4 (`@cascivo/app`).** At first a chat app is one view plus a list. Deep links (`/c/:id`) were the first thing that needed a router, and phase 4 added them. The open conversation is now the URL instead of stored state.                                                             |
| Typed client ↔ Worker contract                                                               | ~40 lines (`protocol.ts`)    | **Phase 4 (`@cascivo/app/api`).** The same hand-written protocol file appeared in the cloudflare scaffold. So `src/api.ts` is now a `defineApi` contract. The Worker went from 163 lines to 92: the request validation, the SSE encoding and the 404/405 handling moved into `createHandler`. |
| Dev server running the Worker with a mock binding                                            | ~40 lines (`vite.config.ts`) | **Kept in the app.** The cloudflare scaffold uses `@cloudflare/vite-plugin` (workerd in dev) instead. This app keeps the middleware only because Workers AI has no local runtime, so it needs a mock AI binding to run without an account.                                                    |

## Other observations

- **Preact via aliases works, but typing does not follow the aliases.** The source is typed
  against React, and the build aliases React to Preact. Type-checking the _library source_
  under Preact's types fails; that is specific to this monorepo. A starter template should
  therefore keep React types and switch the runtime in the bundler config. That also keeps
  React one flag away.
- **Bundle size:** the whole client is **69 KB gzip**. That includes Preact, signals, the
  kit shell with `CommandMenu`, `AiChat` and the themes.
- **Cloudflare setup is small:** one `wrangler.jsonc` defines SPA fallback, `/api/*` routed
  to the Worker, and the AI binding. The Workers AI types were declared locally, about 10
  lines, rather than adding `@cloudflare/workers-types`. The repo convention of `npx wrangler`
  keeps wrangler out of the lockfile.

## Phase 4: what moving onto `@cascivo/app` showed

- **The URL replaced one piece of stored state.** Before, `activeId` was a persisted signal.
  Now it is `computed(() => router.match.value?.params.id)`. Links, reloads and the back
  button all agree on it.
- **Errors had to become per-conversation.** A global `error` signal followed the user to
  another conversation after they navigated. The store now keeps `{ conversationId, message }`.
  A router exposes this kind of bug, which a single-view app hides.
- **A lazy route unmounts its old view for one frame on first visit.** Playwright could type
  into a textarea that was about to unmount. A person cannot, but a `fallback` that keeps the
  same layout matters.
- **`defineApi` inference trap (fixed in the package).** Constraining `defineApi<A extends Api>`
  gave every inline `endpoint({...})` a contextual return type, and TypeScript then inferred
  the path as `string`. Every handler lost its typed params, and all tests still passed.
  Type-level tests (`expectTypeOf`, `@ts-expect-error`) now guard this.
