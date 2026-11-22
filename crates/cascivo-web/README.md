# cascivo-web

Static sites from Markdown, content collections and templates, with
[cascivo](https://github.com/cascivo/cascivo) components in your Markdown. Build with one Rust
binary: no React, no Node build. The same input gives the same files.

## Install

```sh
cargo install cascivo-web
```

Prebuilt binaries are attached to GitHub releases `cascivo-web@<version>`. For unreleased
changes, install from a checkout of the repository: `cargo install --path crates/cascivo-web`.

## Quick start

```sh
cascivo-web new my-site
cd my-site
cascivo-web dev      # http://127.0.0.1:4321/ with live reload
cascivo-web build    # write dist/ (emptied first; --no-clean keeps old files)
```

## Features

- File-based routes in `pages/`, including `pages/blog/[posts].html` once per collection entry
  and `pages/404.html` (or `.md`) → `/404.html`, rendered with its layout, not in the sitemap.
- `+++` TOML front matter on Markdown and `.html` pages (`page.<key>`); `sitemap = false` and
  `lastmod = 2026-03-04` on pages and entries control `sitemap.xml`.
- `public/` is copied as is, including `_headers`, `_redirects` and `.well-known/` (only
  `.DS_Store`, `.git`, `Thumbs.db`, `desktop.ini`, `._*` are skipped).
- Content collections: TOML front matter checked against a `_schema.toml`.
- minijinja layouts with `site`, `page`, `content`, `collections`, `locale`, `alternates`, `t()` and `cv()`.
- cascivo components in Markdown (`::alert[Text]{variant=info}` and ` ```cv ` fences).
- One shared `cascivo.css` with the theme and only the component CSS the site uses.
- Locales: `/de/...` routes, translated pages and entries, TOML message bundles, hreflang data.
- RSS 2.0 feeds, also per locale, and a `sitemap.xml` with `xhtml:link` and `x-default`.
- Dev server with live reload; errors as `file:line: message`.
- `cascivo-web deploy` for Cloudflare Workers Static Assets, or Cloudflare Pages with
  `--pages --project-name <name>` (`wrangler pages deploy dist`); `--dry-run` to preview.
- Optional `axum` feature: `cascivo_web::router(&site)` serves the rendered site.

Not included: an image pipeline (use URLs or `public/` files), syntax highlighting, islands.

## Links

## Sites with their own build (Vite) and assets

All tables are optional; paths are relative to the site root and may point outside it (read-only).

```toml
[build]
cascivo_css = false          # default true; false: no cascivo.css, no <link> to it
trailing_slash = false       # default true (/about/ → about/index.html); false: /about → about.html,
                             # also for page.url, canonical, sitemap, hreflang and feeds
[head]
robots = ""                  # default robots of head() (default "index, follow"); "" omits it
[deploy]
target = "pages"             # "workers" (default, `wrangler deploy`) or "pages"
project = "my-site"          # Pages --project-name
[assets]
dir = "assets"               # source folder of asset()
[images]
dir = "../public"            # source folder of img() (default "assets")
[vite]
manifest = "../dist/.vite/manifest.json"
css_modules = "../dist/.vite/css-modules.json"   # { "<x.module.css path>": { local: hashed } }
islands = "src/marketing/islands/{name}.tsx"     # manifest key of an island (this is the default)
[data]
web = "../dist/.vite/web-data.json"              # JSON or TOML → template global `data.web`
```

Template functions (positional or keyword arguments; unknown keywords are errors):

| Call                                                                                                                                                                         | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `head(title, description, canonical, og_title, og_description, og_image, og_image_alt, og_image_width, og_image_height, og_type, robots, twitter_card, jsonld, theme_color)` | title, description, canonical (default `base_url` + page url), robots (default `[head] robots`, `noindex` on `/404.html`; `robots=false` or `''` omits it), `og:*`, `twitter:*`, JSON-LD (`</` escaped); `theme_color` is a string or `{light, dark}`                                                                                                                                                                                                                                    |
| `asset(path)`                                                                                                                                                                | copies `<assets.dir>/<path>` to `/_cw/<stem>.<hash8>.<ext>` and returns the URL                                                                                                                                                                                                                                                                                                                                                                                                          |
| `vite(entry)` / `vite_css(entry)`                                                                                                                                            | `/` + the manifest file / list of CSS URLs of the entry and its static imports (dependencies first, deduped)                                                                                                                                                                                                                                                                                                                                                                             |
| `css_bundle(hrefs, name="bundle")`                                                                                                                                           | one content-hashed `/_cw/<name>.<hash>.css` from Vite CSS files (e.g. `vite_css(…)`), in order, with top-level `@layer a, b;` statements hoisted first; relative `url()` is an error                                                                                                                                                                                                                                                                                                     |
| `m(module, class)`                                                                                                                                                           | hashed CSS-module class; `module` is the `x.module.css` stem (path-suffix match; ambiguous or missing is an error listing candidates)                                                                                                                                                                                                                                                                                                                                                    |
| `island(name, client="visible", props=None)`                                                                                                                                 | `data-island data-client data-src data-css [data-props]` attributes; `client` is `visible`, `idle` or `load`                                                                                                                                                                                                                                                                                                                                                                             |
| `islands_script()`                                                                                                                                                           | the ~800 byte inline module loader that hydrates `[data-island]` with `mod.default(el, props)`; failures leave the fallback markup                                                                                                                                                                                                                                                                                                                                                       |
| `theme_script(storage_key="cascade-theme", attribute="data-theme", default_light="poster", default_dark="poster-dark", blocking=[…])`                                        | inline no-flash theme script (versioned storage envelope, OS colour-scheme fallback)                                                                                                                                                                                                                                                                                                                                                                                                     |
| `img(src, alt, widths=[480, 960, 1440], sizes, class, loading="lazy", format="webp", priority=false)`                                                                        | `<img srcset>`; resized files at `/_cw/img/<stem>-<w>.<hash8>.<ext>`; never upscales; `format="keep"` keeps jpeg/png/webp (at the source width, the file is copied byte for byte). `priority=true` marks the LCP image: `loading="eager"`, `fetchpriority="high"` and a `<link rel="preload" as="image" imagesrcset imagesizes>` placed at the top of `<head>`; `priority="<media query>"` preloads only where the query matches and keeps the `<img>` lazy (a copy CSS hides on phones) |
| `{{ code \| highlight("js") }}`                                                                                                                                              | the whole highlighted `<code class=…>` element (as `CodeSnippet` renders it) for `bash`, `css`, `js`, `ts`                                                                                                                                                                                                                                                                                                                                                                               |
| `data.<name>`                                                                                                                                                                | the `[data]` files                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

Webp output is lossless (all the `image` crate encodes). Hashes are FNV-1a 64 of the file bytes.

- Full guide: <https://cascivo.com/docs/guides/using-cascivo-web>
- Repository: <https://github.com/cascivo/cascivo>
