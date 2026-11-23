# Rust + HTML-first stack: results, W5 (cascivo-web for many projects)

Plan: [rust-html-stack-plan.md](rust-html-stack-plan.md), "Static MVP" (i18n, RSS, Cloudflare
static deploy, distribution). Built on the W3 spike ([results](rust-html-stack-results-w3.md)).
Adopter guide: [USING-CASCIVO-WEB.md](../USING-CASCIVO-WEB.md); agent skill:
`skills/cascivo-web`.

## What was built

| Goal | Where | Notes |
|---|---|---|
| i18n | `crates/cascivo-web/src/i18n.rs` | `[i18n] default/locales/fallback`; default locale at `/`, others at `/<locale>/`; `pages/<locale>/…` overrides, `content/<coll>/<locale>/<slug>.md` translations (same slug), fallback to the default text per page and per entry; `locale` on entries; `t(key, **args)`; `alternates` (`locale`, `url`, `href`) for `hreflang` links; sitemap `xhtml:link` + `x-default`. |
| RSS | `src/rss.rs` | `[[feeds]]` RSS 2.0 from a collection: newest first, `limit`, absolute links via the collection's dynamic route, deterministic `lastBuildDate` (newest item, never the clock). One feed per locale, at `/<locale>/<path>`, when that locale renders the collection. |
| Publish readiness | `crates/cascivo-web/Cargo.toml`, `scripts/rust-release/*`, `.github/workflows/rust-release.yml` | crates.io metadata, docs.rs `all-features`, versioned path dependency. `cargo publish --dry-run -p cascivo-html -p cascivo-html-cli -p cascivo-web` passes. Prebuilt binaries for 5 targets (linux x64/arm64, macOS x64/arm64, Windows x64) are attached to `<crate>@<version>` releases. |
| Starter | `src/starter.rs`, `crates/cascivo-web/starter/` | `cascivo-web new <dir>`: files are embedded in the binary (layouts, a `posts` collection, 2 posts, home/about/blog, feed, 404 page, favicon, `wrangler.jsonc` for Workers Static Assets, README, `.gitignore`). It refuses a non-empty directory. Tests build the generated project. |
| Deploy | `src/deploy.rs`, `src/main.rs` | `cascivo-web deploy [site] [--dry-run] [-- <wrangler args>]`: needs a wrangler config, builds, then runs `npx wrangler deploy` in the site directory. It was tested only with `--dry-run`. |
| Docs | `docs/USING-CASCIVO-WEB.md`, `skills/cascivo-web/SKILL.md`, crate README | Registered in `scripts/docs-md/guides.ts` and llms. |

New dependencies: none. Message bundles use TOML, not Fluent. Static pages need lookup and
`{name}` interpolation, not runtime plural selection. TOML is already the config format, and
`fluent-bundle` would add about 10 crates. A Fluent backend could slot in behind `t()` later.

## Decisions

- **0.0.0 is an unreleased placeholder.** `publish-plan`, the release tags step and the binaries
  plan all skip a 0.0.0 crate. So merging this branch publishes nothing. The staged changeset
  (`cascivo-web: minor`) bumps it to 0.1.0 in the Version PR, and merging that PR is the release
  decision.
- **cascivo-html minor changeset.** cascivo-web uses the API that W3 added to cascivo-html
  (`render_parts`, `stylesheet`, `script`, `path`), which is not in crates.io 0.1.2. The changeset
  releases cascivo-html 0.2.0 (and cascivo-html-cli, which is in the same fixed group). The
  publish job publishes crates in dependency order, so cascivo-html goes first. A lone
  `cargo publish --dry-run -p cascivo-web` fails until then. The multi-package dry-run above
  resolves it locally.
- **Single-locale sites are unchanged.** Without `[i18n]`, the output is byte-identical to
  before: the existing snapshot-style tests pass unmodified and `alternates` is empty. `t()` still
  works, reading `i18n/<lang>.toml`.
- **Locale views.** Rendering builds one view of the site per locale (routes and collections
  resolved for that locale) and renders each with the existing renderer, sharing one CSS
  accumulator. So `/cascivo.css` covers every locale's components. The hooks in `site.rs` are
  small: shared accumulator, `t`, and the `locale`/`alternates` context.

## Verification

- `cargo fmt --check`, `cargo clippy --workspace --all-targets --all-features -- -D warnings`,
  `cargo test --workspace --all-features`: green (see the commit for the run). New tests:
  i18n (unit and 3 integration: fallback, `fallback = false` with a translated dynamic route,
  bad locale directories), rss (4), starter (4), deploy (3), CLI (4: new→build, deploy
  `--dry-run`, refusals).
- `node --test scripts/rust-release/lib.test.ts`: 32 pass (0.0.0 skip, 0.0.0→0.1.0, binary plan).
- `cascivo-web new` → `build` → `deploy --dry-run` by hand: 10 files in 3.7 ms, prints
  `would run: npx wrangler deploy`.

## Open issues

- **First crates.io publish of a new crate.** Trusted publishing can only be configured on an
  existing crate. Before the first Version PR that releases cascivo-web 0.1.0 is merged, an
  owner must publish it once with a token (or pre-register the crate) and add the trusted
  publisher. The steps are in `docs/RELEASING.md`.
- The `binaries` workflow job has not run yet. It runs on the first release after merge.
- Feeds carry `description` only, not the full post HTML. Feed titles are not localized
  (`title` is per feed, not per locale).
- Locales must be lowercase slugs (`pt-br`, not `pt-BR`) because they are URL segments.
  `hreflang` accepts the lowercase form.
- `tests/dev.rs` used to assert edit→render < 1 s and failed once under load. Fixed in W6: it
  asserts visibility with a 30 s liveness bound; latency is reported by `measure.mjs`.
