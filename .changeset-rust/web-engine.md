---
'cascivo-web': minor
---

`Engine`: request-time rendering of a page or one block of it (`render`, `render_block`) from `layouts/` and `templates/`, with `ReqCtx` (`request`, `user`, `flash`), per-request locale and forced HTML escaping; `Engine::load` + `reload`/`watch` for dev, `Engine::from_bundle` for embedded use. `build --bundle [--bundle-out <file>]` writes the `Bundle`. New features `cli`, `images`, `fs` (all default); `default-features = false` builds the engine alone and compiles for `wasm32-unknown-unknown`.
