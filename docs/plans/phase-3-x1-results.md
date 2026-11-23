# X1 results: Workers viability (checkpoint α)

Date 2026-11-23. Spike: `apps/bench/workers-spike/` (throwaway; own `[workspace]`, so root
`cargo`/CI never builds it). Stack: `worker` 0.9 (`http`, `axum` features) + `axum` 0.8
(no default features) + `minijinja` 2 + `cascivo-html` 0.3 (path dep). One route `/{name}`
renders an embedded template; a `cv` filter turns `.cv` text into a full cascivo HTML page
(worst case: inlined CSS/JS).

## Numbers

| Metric | Target | Measured | Result |
|---|---|---|---|
| wasm, raw `cargo build --release` (opt-level s, LTO, strip) | | 2.15 MB | |
| wasm, `worker-build --release` (wasm-opt) | | 1.31 MB | |
| wasm gz -9 (what Workers counts) | ≤ 3 MB | **0.46 MB** (0.59 MB unoptimised) | pass, 6x headroom |
| Cold start p50 (first request after fresh `wrangler dev`, n=6) | ≤ 50 ms | **49.5 ms** (37–54) | pass, marginal |
| Warm request p50 | | 4.9 ms | |
| Template render from embedded bundle | works | `/index` → `<h1>` + full cascivo page; `cargo test` green | pass |

## Method and caveats

- Cold start = `curl` time_total of the first request to a freshly started local workerd
  (`wrangler dev --local`, 6 restarts). It includes wasm compile and instantiate, plus
  loopback and curl overhead, so it is an upper bound on isolate init. Not run on real edge:
  no deploy was done, and no `workers.dev` script was created, so nothing needs deleting.
- Local workerd runs on a shared container CPU. Treat 49.5 ms as "about 50", not a proven
  pass. Re-measure on a real `*.workers.dev` before F is scheduled.
- `Engine::from_bundle` (task A) does not exist yet. The bundle is an `include_str!` table
  fed to `minijinja::Environment`; it covers the same wasm-side cost (template compile at
  request time), not the real loader.
- minijinja was built with `builtins`, `serde`, `std_collections` only. Adding
  `multi_template`, `loader`, `json`, `urlencode` will add size, but headroom is large.
- `!Send`: `worker`'s axum glue compiled with a plain `Router` and an `async` handler that
  holds no `!Send` data. Handlers touching `Env`/KV/D1 bindings still need the `MaybeSend`
  approach from the plan. That risk is not tested here.

## Checkpoint α

**PASS.** Size is far inside 3 MB gz; render works; cold start is at the 50 ms line.

## Recommendation

**Workers: keep F on the plan**, with Containers (G) as the second target. Conditions:
1. Re-measure cold start on a real `workers.dev` deploy early in F.
2. Pre-compile templates at `build --bundle` where possible, since cold start is
   dominated by wasm instantiate, and the 4.9 ms warm render has room.
3. Split `cascivo-html` CSS/JS from the Worker bundle (serve as static assets) if size
   grows; it is the bulk of the wasm.
