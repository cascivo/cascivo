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
