# cascivo-web (spike)

Static sites from Markdown, content collections and minijinja layouts, with components
rendered by [`cascivo-html`](../cascivo-html). Phase-0 spike of
[`docs/plans/rust-html-stack-plan.md`](../../docs/plans/rust-html-stack-plan.md) (W3); not
published.

```sh
cargo run -p cascivo-web -- build path/to/site --out dist   # write dist/
cargo run -p cascivo-web -- dev path/to/site --port 4321    # serve + live reload
```

## Site layout

| Path                           | Meaning                                                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `site.toml`                    | `title`, `base_url` (enables `sitemap.xml`), `lang`, `theme`                                                                                    |
| `content/<name>/_schema.toml`  | collection schema: `[fields] title = { type = "string", required = true }`; types `string int float bool date array`; unknown fields are errors |
| `content/<name>/<slug>.md`     | entry: TOML front matter between `+++` lines, Markdown body                                                                                     |
| `layouts/*.html`               | minijinja templates; Markdown pages pick one with `layout = "name"` (default `default`)                                                         |
| `pages/**.md`, `pages/**.html` | routes: `index.md` → `/`, `about.md` → `/about/`, `blog/[posts].html` → `/blog/<slug>/` per `posts` entry                                       |
| `public/**`                    | copied verbatim                                                                                                                                 |

Templates see `site`, `page` (front matter + `url`; the entry for dynamic routes), `content`
(rendered HTML) and `collections.<name>` (entries with `slug`, `url`, `content`, front matter).
`{{ cv('badge "New"') }}` renders `.cv` text inline.

## Components in Markdown

````md
::alert[Body text]{title="Tip" variant=info}

```cv
cols 3
  stat Users 1204
```
````

A `::name[text]{attrs}` line is one component; attributes named like a positional argument
fill it. A ` ```cv ` fence holds any `.cv` tree. Errors point at the Markdown file and line.

## Output

Every page links one shared `/cascivo.css` holding the base, theme and only the component CSS
the site uses. Paths are checked with `cascivo_html::path::is_safe_relative` and every write is
confined to the output directory (symlinks are not followed).

`dev` re-reads and re-renders on any source change (20 ms poll, no cargo rebuild) and reloads
open pages over Server-Sent Events. Feature `axum`: `cascivo_web::router(&site)` serves the
rendered site from an `axum::Router`.

Limits of the spike: images in components need URLs or `data:` URIs; no container directives
(Markdown inside a component); no i18n, RSS or image pipeline.

## Sites with their own build (Vite) and assets

All tables are optional; paths are relative to the site root and may point outside it (read-only).

```toml
[build]
cascivo_css = false          # default true; false: no cascivo.css, no <link> to it
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

| Call                                                                                                    | Result                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `head(title, description, canonical, og_title, og_description, og_image, og_image_alt, og_image_width, og_image_height, og_type, robots, twitter_card, jsonld, theme_color)` | title, description, canonical (default `base_url` + page url), robots, `og:*`, `twitter:*`, JSON-LD (`</` escaped); `theme_color` is a string or `{light, dark}` |
| `asset(path)`                                                                                           | copies `<assets.dir>/<path>` to `/_cw/<stem>.<hash8>.<ext>` and returns the URL                                                                |
| `vite(entry)` / `vite_css(entry)`                                                                       | `/` + the manifest file / list of CSS URLs of the entry and its static imports (dependencies first, deduped)                                   |
| `m(module, class)`                                                                                      | hashed CSS-module class; `module` is the `x.module.css` stem (path-suffix match; ambiguous or missing is an error listing candidates)         |
| `island(name, client="visible", props=None)`                                                            | `data-island data-client data-src data-css [data-props]` attributes; `client` is `visible`, `idle` or `load`                                    |
| `islands_script()`                                                                                      | the ~800 byte inline module loader that hydrates `[data-island]` with `mod.default(el, props)`; failures leave the fallback markup            |
| `theme_script(storage_key="cascade-theme", attribute="data-theme", default_light="poster", default_dark="poster-dark", blocking=[…])` | inline no-flash theme script (versioned storage envelope, OS colour-scheme fallback)                               |
| `img(src, alt, widths=[480, 960, 1440], sizes, class, loading="lazy", format="webp")`                   | `<img srcset>`; resized files at `/_cw/img/<stem>-<w>.<hash8>.<ext>`; never upscales; `format="keep"` keeps jpeg/png/webp                      |
| `{{ code \| highlight("js") }}`                                                                         | the whole highlighted `<code class=…>` element (as `CodeSnippet` renders it) for `bash`, `css`, `js`, `ts`                                                                        |
| `data.<name>`                                                                                           | the `[data]` files                                                                                                                             |

Webp output is lossless (all the `image` crate encodes). Hashes are FNV-1a 64 of the file bytes.
