# Dynamic-app conformance harness (Phase 3, workstream T)

`pnpm dynamic:check` (needs `pnpm build` and cargo) builds and spawns the target, then drives it
black-box: plain HTTP for the server contract, real Chromium for the flows.

| Flow   | Path        | Asserted                                                                       |
| ------ | ----------- | ------------------------------------------------------------------------------ |
| form   | `/c/form`   | client errors, server 422 keeps values, success resets; focus on first invalid |
| dialog | `/c/dialog` | native modal, `HX-Trigger: cv-dialog-close`, focus returns to the opener       |
| toast  | `/c/toast`  | `role=status` text, dismiss, `cv-menu` open/closed/light-dismissed             |
| island | `/c/island` | placeholder loads its signed fragment; a tampered token is 400                 |
| sse    | `/c/sse`    | `text/event-stream` framing, htmx `sse` extension swaps events in              |
| tabs   | `/c/tabs`   | lazy panel swap, focus stays on the tab                                        |

Every state a swap produces is checked with axe (WCAG 2.2 AA, 0 violations, after
`lib/settle.ts`), and a monitor records any moment focus is on `<body>` after a swap
(checkpoint γ). Per page, the JS loaded is gzipped and split into cascivo, island and htmx
(checkpoint δ): cascivo ≤ 15 KB, island ≤ `budgets.islandJs`, htmx only reported.

## Another target

A target serves the same fixture pages and ids (copy `apps/examples/solid-htmx/server/templates/c`).

    DYNAMIC_URL=http://127.0.0.1:8787 DYNAMIC_NAME=starter pnpm dynamic:check
    DYNAMIC_PATHS='{"form":"/demo/form"}' ...   # only for paths that differ

Add a named target in `targets.ts` when it has to build and spawn itself. Not run in CI, and
saying so: `wrangler dev` (Miniflare) and the container image.
