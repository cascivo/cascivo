# create-cascivo

## 0.1.1

### Patch Changes

- db3f056: `@cascivo/react` is built with vite-plus 1.0. Its `dist/index.d.ts` now marks each declaration `export` where it is
  written, instead of listing all of them in one trailing `export { … }`. The exported names and
  their types are unchanged. Long component signatures, such as `DataTable`'s, now put one
  parameter on each line so the file stays easy to grep.

  The other packages listed here ship only a README change: the vite-plus 1.0 formatter removes
  a blank line in the header block.

- Updated dependencies [aa3967d]
- Updated dependencies [d0f0e97]
- Updated dependencies [57dc995]
- Updated dependencies [57dc995]
- Updated dependencies [57dc995]
- Updated dependencies [57dc995]
- Updated dependencies [57dc995]
- Updated dependencies [57dc995]
- Updated dependencies [57dc995]
- Updated dependencies [57dc995]
- Updated dependencies [57dc995]
- Updated dependencies [57dc995]
- Updated dependencies [57dc995]
- Updated dependencies [57dc995]
  - cascivo@1.7.0

## 0.1.0

### Minor Changes

- a5c3efb: `cascivo create --framework cloudflare` scaffolds a client-rendered app and its API,
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

### Patch Changes

- Updated dependencies [b2a3d94]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [b2a3d94]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
- Updated dependencies [a5c3efb]
  - cascivo@1.4.0
