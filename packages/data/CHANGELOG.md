# @cascivo/data

## 0.1.1

### Patch Changes

- db3f056: `@cascivo/react` is built with vite-plus 1.0. Its `dist/index.d.ts` now marks each declaration `export` where it is
  written, instead of listing all of them in one trailing `export { … }`. The exported names and
  their types are unchanged. Long component signatures, such as `DataTable`'s, now put one
  parameter on each line so the file stays easy to grep.

  The other packages listed here ship only a README change: the vite-plus 1.0 formatter removes
  a blank line in the header block.

## 0.1.0

### Minor Changes

- a5c3efb: New package: `@cascivo/data`, client data primitives with zero dependencies. The first release is
  server-sent events over `fetch`:

  - `fetchSSE(input, init)` iterates an event stream from any request. It supports POST
    bodies, which `EventSource` cannot send, and it cancels through `init.signal`. A non-2xx
    response throws `HttpError`, and a non-`text/event-stream` response throws an `Error`.
  - `parseSSE(stream)` is a WHATWG-conformant parser over any `ReadableStream<Uint8Array>`.
    It works in the browser, Node and Cloudflare Workers.
  - `formatSSE(event, data)` is the server-side encoder.

  These were extracted from `apps/examples/chat`, a streaming chat app on Workers AI.
