<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/compare-react-vs-htmx-solid.md
  registry v1.11.0 · generated 2026-11-21
-->

# React vs htmx + Solid: one app, two stacks

The same small app built twice with cascivo, then measured with one script. Use it to pick a stack
for a new app. It is not a ranking of the two stacks.

|              | React                                                                                               | htmx + Solid                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| App          | [`apps/examples/track-lite`](https://github.com/cascivo/cascivo/tree/main/apps/examples/track-lite) | [`apps/examples/track-lite-htmx`](https://github.com/cascivo/cascivo/tree/main/apps/examples/track-lite-htmx)               |
| UI           | `@cascivo/react` components                                                                         | server HTML on the `@cascivo/css` contract, `@cascivo/elements`, one `@cascivo/solid` island                                |
| State        | a module signal in the browser (no backend, as in Track)                                            | axum + [`cascivo-server`](https://github.com/cascivo/cascivo/tree/main/crates/cascivo-server): memory store, sessions, CSRF |
| Live updates | a `setInterval` teammate in the tab                                                                 | a server teammate task + SSE `Hub` fan-out to every open tab                                                                |
| Tests        | Vitest + Testing Library, 4 flows                                                                   | Rust `oneshot` smoke test, 8 flows (incl. CSRF, 422, SSE)                                                                   |

## The app

A slice of the React [Track](https://github.com/cascivo/cascivo/tree/main/apps/examples/track) example:

- The issue list with a count, a status badge, a priority badge and an assignee per row.
- A "New issue" button that opens a modal dialog. The dialog has a form with Title (required,
  3–80 characters), Status, Priority and Assignee. The errors use the same text in both apps.
  After a save, the dialog closes, the list updates and an "Issue created" toast shows.
- Advance (move to the next status) and Delete (with an "Issue deleted" toast) on each row.
- Live updates: a simulated teammate moves the next issue every 6 s. A "Live · updated Ns ago"
  badge counts up and goes back to 0 when the list changes.

The two apps start from the same seed, make the same teammate moves and use the same layout CSS.
Screenshots of both at 900 px show the same layout. The small differences:

- The server form marks required fields with a `*`.
- The React toast has an icon.

The React app keeps its state in the browser, like Track. The htmx app has a real multi-user
server. That makes the comparison honest about what each one costs to build, but it is not a
like-for-like backend. Keep this in mind when you read the LOC numbers.

## Results

Reproduce with `pnpm compare:react-vs-htmx`. The script builds both apps and the release server.
It serves the React `dist/` from a plain static server and runs the axum binary with the teammate
off. Then it drives each app in headless Chromium with the CPU throttled 4x (`RUNS`,
`CPU_THROTTLE`, `--json <file>`, `SKIP_BUILD=1`). The script computes gzip -9 sizes from the
response bodies, so the server's compression does not change the numbers.

Measured on 2026-11-25: 4-core Xeon container, Chromium headless, localhost, median of 7 runs.

| Metric                                              | React (track-lite) | htmx + Solid (track-lite-htmx)                  |
| --------------------------------------------------- | ------------------ | ----------------------------------------------- |
| JS (raw / gzip)                                     | 226.9 KB / 71.5 KB | 89.6 KB / 28.4 KB                               |
| JS files (gzip KB)                                  | one bundle 71.5    | htmx + sse 18.3, elements 6.2, Solid island 3.9 |
| CSS (raw / gzip)                                    | 95.6 KB / 11.6 KB  | 131.4 KB / 14.9 KB                              |
| HTML (raw / gzip)                                   | 0.4 KB / 0.3 KB    | 14.5 KB / 2.8 KB                                |
| Requests on load                                    | 3                  | 6 (page, CSS, 3 scripts, SSE)                   |
| FCP                                                 | 184 ms             | 136 ms                                          |
| LCP                                                 | 184 ms             | 144 ms                                          |
| Ready (first click that opens the dialog)           | 306 ms             | 266 ms                                          |
| One "Advance" click on the wire                     | 0 requests         | 2 requests, 15.6 KB raw / 1.7 KB gzip           |
| App LOC (non-blank; htmx includes Rust + templates) | 338                | 605                                             |
| Test LOC                                            | 43                 | 207                                             |
| Dependencies (direct / installed closure)           | npm 7 / 18         | npm 7 / 21, cargo 8 / 79                        |

Timings move by about ±20 ms between runs on this machine. Byte counts do not change.

## What the numbers say

- **The htmx page ships 2.5x less JavaScript** (28.4 KB gzip against 71.5 KB). Of those 28.4 KB,
  18.3 KB is htmx and its SSE extension. cascivo's own code is the elements (6.2 KB) and the
  island with the Solid runtime (3.9 KB). Both are inside the budgets in
  [USING-CASCIVO-SERVER.md](/docs/using-cascivo-server.md) (15 KB per page, 10 KB per island).
- **First paint is earlier on htmx** (about 50 ms at 4x throttle). The list is in the HTML, so the
  browser paints it before any script runs. The React page paints only after it parses and runs
  its bundle.
- **"Ready" is close** (266 ms against 306 ms). Both stacks must run their script before the
  dialog button works: the `cv-dialog` element on one side, hydration of the React tree on the
  other. htmx parses less code, but it loads more files. This app is small, so the React bundle
  is not much slower to run.
- **CSS is a little larger on htmx** (14.9 KB against 11.6 KB gzip). The island imports the contract
  units the server renders, plus `elements.css`. The React build takes only the component CSS
  modules that it imports.
- **Every interaction costs a round trip on htmx.** One Advance is a POST that returns the list
  fragment (about 7.8 KB raw, under 1 KB gzip). Then the tab also refetches the list, because the
  SSE `changed` event reaches the tab that made the change too. React changes a signal and sends
  nothing. On a slow network, React feels instant and htmx waits for the round trip.
- **LOC is higher on htmx because it does more.** The 605 lines include a real server with
  sessions, CSRF, server-side validation of each select value, SSE fan-out and no-JS fallbacks
  for Advance and Delete. The React app has none of these. A React app with a backend would also
  need an API, fetch code and a server, and those are not counted here.

## Trade-offs

### Where htmx + Solid wins

- Less JavaScript, earlier paint, and a page that shows content before any script runs.
- One source of truth. Validation rules (`Rule::text().required().min_len(3)`) run on the server
  and the browser gets them as constraint attributes. The React app has a copy of the same rule in
  TypeScript, and the two copies can drift apart.
- Live multi-user updates are built in: a `Hub` topic and three attributes in the template.
- Security comes by default: a nonce CSP, CSRF on every post, `HX-*` headers that cannot choose
  what the server renders, and select values checked against an allowlist.
- The tests drive the real HTTP surface, and they run with no browser and no jsdom shims. The
  React tests need a `showModal` polyfill and `findByRole` for the dialog that opens from an
  effect.

### Where React wins

- **Latency of interactions.** Optimistic, zero-network updates. htmx needs a server round trip
  for each click. This matters on mobile networks, and a dropped connection breaks the next click.
- **Offline and local-first.** Track keeps its state in `localStorage` with no server. The htmx
  app cannot work without the server.
- **Rich client widgets.** Track's board drag-and-drop, `MultiSelect`, `Combobox` and `DataTable`
  are ready-made React components. On the htmx stack, each one is a Solid island to build, or a
  `cv-*` element if one exists. The elements package has dialog, form, menu, tabs, toaster,
  combobox and date picker.
- **One language, one toolchain.** The htmx app is Rust + Jinja templates + TypeScript + Vite.
  The React app is TypeScript only, and it deploys to any static host.
- **Fewer requests on load** (3 against 6). One bundle, against htmx, elements and the island as
  separate files (fixed names, chosen so the budgets can be measured).
- **Smaller per-interaction payloads to reason about.** The htmx app re-renders the whole list
  fragment for each change. That is cheap at 6 rows. At hundreds of rows, you need finer
  fragments or out-of-band swaps.

### Known rough edges found while building it

- The tab that made a change refetches the list once more when its own SSE `changed` event
  arrives (the second request in the "Advance" row). To fix this, tag the events with a per-tab
  id and filter them in the stream. The app does not do this, to keep it small.
- `theme_script()` defaults to the `poster` themes. A page that loads the standard
  `@cascivo/themes` bundles must pass `default_light="light", default_dark="dark"`, or every
  `--cascivo-color-*` token is unresolved. `apps/examples/solid-htmx` has the same default.
- With a strict CSP (`style-src 'self'`), Chromium reports one blocked inline style on the htmx
  page. This does not change the rendering or the behaviour.
- A `*`-margin reset (in the React starter `index.html`) removes the native centring of
  `<dialog>`. The React twin does not use the reset.

## When to pick which

- **htmx + Solid:** pick it for a server-owned data app (CRUD, admin, dashboards fed by a
  database, multi-user live views) where first paint, JS weight and one place for validation
  matter, and where you have or want a Rust server.
- **React:** pick it when the app is mostly client state, must work offline, needs heavy widgets
  (drag-and-drop boards, large interactive tables, editors), or must deploy as static files.
