# Rust + HTML-first stack: results, W3 (cascivo-web + Astro comparison)

Plan: [rust-html-stack-plan.md](rust-html-stack-plan.md) § W3. Measured 2026-11-21 in a cloud
container with 4 vCPUs. Reproduce with `cargo build --release -p cascivo-web`, then
`pnpm --filter @cascivo/astro --filter @cascivo/react... build`, then
`node apps/bench/static-compare/measure.mjs`. Raw numbers are in
`apps/bench/static-compare/results.json`.

## What was built

- `crates/cascivo-web`: a library plus the `cascivo-web` binary, about 1.9k lines of Rust. It has
  20 runtime crates: pulldown-cmark, minijinja, toml, serde and their dependencies. There is one
  module per concern, each with tests (32 tests in all, plus the axum test behind the feature):
  - `content`: collections defined by a folder plus a serde schema, with clear errors.
  - `markdown`: `::name[text]{attrs}` lines and ` ```cv ` fences, both rendered by cascivo-html.
  - `routes`: file-based routes and `[collection]` dynamic routes.
  - `site`: minijinja layouts, the `cv()` template function and the sitemap.
  - `out`: paths go through `cascivo_html::path::is_safe_relative`, and every write is confined
    to the output directory. Symlinks are refused.
  - `dev`: a std-only HTTP server with a 20 ms poll and Server-Sent Events live reload.
  - `axum`: `cascivo_web::router(&site)`, behind a cargo feature.
- cascivo-html gains `render_parts`, `stylesheet`, `script` and `path::is_safe_relative`. Its
  `render` output is byte-identical: all snapshots pass.
- The fixture site under `apps/bench/static-compare/{rust,astro}` has 20 pages: home, about,
  changelog, contact, the blog index and 15 posts. Both versions use the same text and the same
  components (PageHeader, Columns, Stat, Card, Alert, Badge). Astro renders them as
  server-rendered `@cascivo/react` components with no `client:` directive, via `@cascivo/astro`
  and MDX.

## Numbers

| Metric | cascivo-web | Astro 7 + @cascivo/astro |
|---|---|---|
| Cold site build, median of 3 | **6 ms** | 2,773 ms |
| One-off: compile the tool | 17.6 s (`cargo build --release`, 4.4 MB binary) | `pnpm install` (920 packages) + workspace build of about 10 s |
| Edit→render in dev, median / max of 5 | **22 / 39 ms** | 246 / 268 ms |
| Output, raw / gzip | **71 KB / 22 KB** | 402 KB / 112 KB |
| HTML | 37 KB | 188 KB (component CSS inlined per page) |
| CSS | 33 KB (one shared file) | 23 KB |
| JS files in `dist` | 0 | 192 KB (`client.*.js`, referenced by no page) |
| JS per post page | 0 | 0 |
| Authored code LOC (config, layouts, pages) | **70** | 145 |
| Authored content LOC | 334 | 330 |
| Runtime dependencies | 20 crates | 920 npm packages |

How each number was measured:
- **Edit→render** is the time from writing a post file to the first HTTP response that contains
  the edit. The same poll loop is used for both servers. For cascivo-web the edit only changes
  runtime data, with no cargo rebuild. One re-render of all 20 pages takes 1–2 ms. The 20 ms
  file poll dominates the latency.
- The Rust output also contains `sitemap.xml`. The Astro version has no sitemap integration.

## Deploy to Cloudflare static assets (documented, not deployed)

Both sites produce a plain `dist/` folder, so the deploy is the same for both. Add a
`wrangler.jsonc` with `{ "name": "static-compare", "compatibility_date": "2026-11-01",
"assets": { "directory": "./dist" } }` and run `npx wrangler deploy`.

| Step | cascivo-web | Astro |
|---|---|---|
| 1 | Get the binary: `cargo install --path crates/cascivo-web`, or download a release binary. A Node build image needs a Rust toolchain or the download. | `pnpm install`, and build the workspace `@cascivo/*` packages |
| 2 | `cascivo-web build . --out dist` | `astro build` |
| 3 | `npx wrangler deploy` | `npx wrangler deploy` |

Both need three steps. Astro's toolchain is already present in Cloudflare's Node build image.
cascivo-web needs a binary there.

## Kill criteria

| # | Criterion | Result |
|---|---|---|
| 4 | Content or template edit → rendered page in < 1 s, with no `cargo` rebuild | **PASS.** Median 22 ms, max 39 ms over HTTP. The `tests/dev.rs` test asserts < 1 s on every CI run. |
| 5 | Simpler than Astro + cascivo, with the same site measured both ways | **PASS, with caveats.** Build is about 460× faster, dev edits about 11× faster, output is 5.6× smaller, there is half the authored code, 1/46 of the dependencies and no stray JS. |

Caveats on criterion 5:
- The spike covers less than Astro does. It has no image pipeline. Images inside components
  need URLs or `data:` URIs. It has no Markdown inside components (only leaf directives and
  `cv` fences), and no i18n or RSS.
- Astro's typed component props and zod schemas catch more mistakes in the editor. cascivo-web
  reports them at build time, with file and line.
- Template strings built by concatenation in `cv('badge "' ~ t ~ '"')` are fragile.
- The Astro numbers include its default React runtime chunk, which is unreferenced. Leaving it
  out, the output still differs about 3× in raw size, mostly because Astro inlines CSS into
  every page.

**Recommendation: go for Phase 1.** On the axes it covers, the Rust path is measurably simpler
and faster. The risk that remains is feature breadth (images, i18n, container directives), not
the architecture.

## Open issues

- `scripts/checks/app-package-names.test.ts` only scans apps one or two levels deep, so it does
  not cover `apps/bench/static-compare/astro`. The name follows the rule anyway
  (`@cascivo/bench-static-compare-astro`).
- The Astro app pins `@astrojs/mdx@^7.0.8`. mdx 8.x needs astro ≥ 7.2.10, and the lockfile has
  7.1.4.
- `astro dev` (v7) runs as a daemon. `measure.mjs` stops it with `astro dev stop`.
