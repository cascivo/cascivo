A slice of the [Track](../track) example in React: the issue list, a "New issue" dialog with
validation, Advance and Delete per row, toasts, and a simulated teammate who moves an issue every
6 s, with a "Live · updated Ns ago" badge. It is the React half of a side-by-side comparison; the
same app on axum + htmx + `@cascivo/elements` + one Solid island is
[`track-lite-htmx`](../track-lite-htmx). Results and trade-offs:
[docs/COMPARE-REACT-VS-HTMX-SOLID.md](../../../docs/COMPARE-REACT-VS-HTMX-SOLID.md).

```sh
pnpm exec vp dev          # from this directory
pnpm exec vp test         # the same flows the htmx twin's Rust smoke test drives
pnpm compare:react-vs-htmx  # from the repo root: bytes, requests, FCP/LCP, ready, LOC, deps
```

State is client-only (a module signal, no backend), as in Track.
