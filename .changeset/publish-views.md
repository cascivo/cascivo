---
'cascivo': minor
'@cascivo/mcp': minor
---

`cascivo create --framework cloudflare --example publish` turns views into pages with no
deploy step: `/publish` edits a view with a live preview and publishes it to `/p/<slug>`.

- Each page is checked with `validateView` before the Worker stores it in D1, and again by
  `<CascivoView>` before it renders.
- A view only arranges the app's own components, so a published page runs no code of its
  author's and needs no sandbox.
- Publishing is limited to 20 pages a minute per IP; reading is not limited. Files and
  export now share this limiter.
- It works on a temporary account.
- The MCP tool `create_app` accepts `examples: ['publish']`.

The spike behind it is written up in `docs/plans/platform-spike-research.md`. It covers what
Worker Loaders do and do not enforce locally, and why Workers for Platforms is not needed
for publishing views.
