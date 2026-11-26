---
'cascivo-web': minor
---

`cascivo-web new <dir> --dynamic [--target native|workers|containers] [--checkout <dir>]`: a `cascivo-server` starter with notes CRUD behind sign-in, a Solid island, a server island, SSE and the `/c/*` interaction demos. Every target shares the router, templates and `web/` (htmx, `@cascivo/elements`, the island); native and containers ship `tests/views.rs` (every fragment is its page's subtree, the CRUD flow), workers builds for `wasm32-unknown-unknown`. Library API: `cascivo_web::starter_dynamic::{Target, files, create}`.
