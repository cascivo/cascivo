The htmx twin of [`track-lite`](../track-lite) (a slice of the React [Track](../track) example):
the same issue list, "New issue" dialog with validation, Advance and Delete, toasts and live
updates, rendered by an axum server on [`cascivo-server`](../../../crates/cascivo-server). The
browser gets htmx, the `@cascivo/elements` custom elements (dialog, form, toaster) and one Solid
island, the "Live · updated Ns ago" clock. Every mutation answers with the `issues` fragment and
publishes `changed` on an SSE hub, so every open tab refetches the list; a simulated teammate
advances an issue every 6 s (`TEAMMATE_MS`, 0 turns it off). Results and trade-offs:
[docs/COMPARE-REACT-VS-HTMX-SOLID.md](../../../docs/COMPARE-REACT-VS-HTMX-SOLID.md).

```sh
pnpm exec vp build                                   # island + elements + htmx into dist/
cargo run -p track-lite-htmx-server                  # from the repo root: http://127.0.0.1:3001
cargo test -p track-lite-htmx-server                 # create, 422, advance, delete, CSRF, SSE
```

Advance and Delete are real forms, so they also work without JavaScript (the server answers a
plain post with a redirect home). The dialog needs the elements script to open.
