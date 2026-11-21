# cascivo-web

Static sites from Markdown, content collections and templates, with
[cascivo](https://github.com/cascivo/cascivo) components in your Markdown. Build with one Rust
binary: no React, no Node build. The same input gives the same files.

## Install

```sh
cargo install cascivo-web
```

Until the first release, install from a checkout of the repository:
`cargo install --path crates/cascivo-web`. Prebuilt binaries are attached to GitHub releases
`cascivo-web@<version>` once released.

## Quick start

```sh
cascivo-web new my-site
cd my-site
cascivo-web dev      # http://127.0.0.1:4321/ with live reload
cascivo-web build    # write dist/
```

## Features

- File-based routes in `pages/`, including `pages/blog/[posts].html` once per collection entry.
- Content collections: TOML front matter checked against a `_schema.toml`.
- minijinja layouts with `site`, `page`, `content`, `collections`, `locale`, `alternates`, `t()` and `cv()`.
- cascivo components in Markdown (`::alert[Text]{variant=info}` and ` ```cv ` fences).
- One shared `cascivo.css` with the theme and only the component CSS the site uses.
- Locales: `/de/...` routes, translated pages and entries, TOML message bundles, hreflang data.
- RSS 2.0 feeds, also per locale, and a `sitemap.xml` with `xhtml:link` and `x-default`.
- Dev server with live reload; errors as `file:line: message`.
- `cascivo-web deploy` for Cloudflare Workers Static Assets (`--dry-run` to preview).
- Optional `axum` feature: `cascivo_web::router(&site)` serves the rendered site.

Not included: an image pipeline (use URLs or `public/` files), syntax highlighting, islands.

## Links

- Full guide: <https://cascivo.com/docs/guides/using-cascivo-web>
- Repository: <https://github.com/cascivo/cascivo>
