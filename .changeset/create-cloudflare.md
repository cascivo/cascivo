---
'cascivo': minor
'create-cascivo': minor
---

`cascivo create --framework cloudflare` scaffolds a client-rendered app and its API,
deployed as one Cloudflare Worker.

- `vite dev` runs the Worker in workerd through `@cloudflare/vite-plugin`.
- `wrangler.jsonc` routes `/api/*` to the Worker, and every other path falls back to the SPA.
- One `src/protocol.ts` holds the types and parsers that both sides import.
- A live demo streams server-sent events: the Worker writes them with `formatSSE`, and the
  browser reads them with `fetchSSE` from `@cascivo/data`.
- The active section persists across reloads through `@cascivo/storage`.

The app runs on Preact by default. `--runtime react` runs the same source on React. The
source is typed against React either way; in this starter Preact ships about a third of the
client JS. The deploy step is `<pm> run deploy`, because `pnpm deploy` runs a pnpm built-in
command instead of the script.

New package: `create-cascivo`. `npm create cascivo@latest` runs `cascivo create` with the
same prompts and flags. It has no logic of its own.

`cascivo create --help` now lists `--framework`, which it did not before.
