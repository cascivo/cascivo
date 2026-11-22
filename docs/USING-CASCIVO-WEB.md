# Static sites with cascivo-web

`cascivo-web` builds a static website from a folder of Markdown, content collections and
templates. Components from cascivo-html work inside Markdown. It also does locales (`/de/...`),
RSS feeds and a sitemap, and it deploys to Cloudflare Workers Static Assets or Cloudflare Pages. It needs no React,
no Node build and no JavaScript runtime to build the site. The same input gives the same files.

It is a command-line tool and a Rust library.

## When to use it

| You want | Use |
| -------- | --- |
| A running React app | `@cascivo/react` or `npx cascivo add` ([GETTING-STARTED.md](GETTING-STARTED.md)) |
| One static HTML file (report, dashboard) | `cascivo-html` ([USING-CASCIVO-HTML.md](USING-CASCIVO-HTML.md)) |
| A static site: pages, a blog, locales, RSS | `cascivo-web` |

## Install

```sh
cargo install cascivo-web
```

Prebuilt binaries are attached to each GitHub release `cascivo-web@<version>`. See
[RELEASING.md](RELEASING.md). To run the latest unreleased code, install from a checkout of the
repository: `cargo install --path crates/cascivo-web`.

## Quick start

```sh
cascivo-web new my-site     # write a starter site
cd my-site
cascivo-web dev             # http://127.0.0.1:4321/ with live reload
cascivo-web build           # write dist/
```

The starter has a home page, an About page, a blog with two posts, an RSS feed, a layout, a
favicon, a 404 page and a `wrangler.jsonc`. `new` refuses to overwrite files.

## Site layout

```text
site.toml                       settings
content/<name>/_schema.toml     schema of one collection
content/<name>/<slug>.md        one entry
content/<name>/<locale>/<slug>.md   a translation of that entry
layouts/*.html                  templates
pages/**.md | **.html           routes
pages/<locale>/...              translated pages
i18n/<locale>.toml              message bundles
public/**                       copied as is
wrangler.jsonc                  deploy config
```

Files and folders that start with `.` or `_` in `pages/` are skipped. Everything in `public/` is
copied, including `_headers`, `_redirects` and `.well-known/`; only `.DS_Store`, `.git`,
`Thumbs.db`, `desktop.ini` and `._*` are skipped. Symlinks are not followed. Slugs and page folders use only `a-z`, `0-9` and `-`.

## site.toml

```toml
title = "My site"
base_url = "https://example.com"
lang = "en"
theme = "light"

[i18n]
default = "en"
locales = ["en", "de"]
fallback = true

[[feeds]]
collection = "posts"
path = "rss.xml"
title = "Blog"
description = "New posts"
limit = 20
```

| Key | Meaning |
| --- | ------- |
| `title` | Required. Site name. |
| `base_url` | Absolute origin. Default empty. Without it there is no `sitemap.xml`, and feeds fail. |
| `lang` | Language of the site. Default `en`. |
| `theme` | A cascivo theme name. Default `light`. |
| `dark_theme` | Optional second theme. `cascivo.css` applies it under `prefers-color-scheme: dark` to pages whose `<html>` has no `data-theme` (then `theme` applies to them otherwise). `[data-theme=<name>]` still works for both. |
| `[brand]` | Token overrides: `primary`, `accent` (`#rgb` or `#rrggbb`), `radius` (px, 0–64), `gap` (space step), `density` (`compact`, `normal`, `comfy`), `font`, `mono`. The same keys as `@brand` in cascivo-html. See [Theming](#theming). |
| `[i18n] default` | Default locale, served at `/`. Must be in `locales`. |
| `[i18n] locales` | All locales. Others are served at `/<locale>/`. |
| `[i18n] fallback` | Default `true`. See [Locales](#locales). |
| `[build] trailing_slash` | Default `true`: `/about/` (`about/index.html`). `false`: `/about` (`about.html`) in output files, `page.url`, entry URLs, canonical, sitemap, hreflang and feeds. |
| `[build] cascivo_css` | Default `true`. `false`: no `cascivo.css` and no link to it. |
| `[build] inline_styles` | Default `true`. `false`: components write no `style=""`. They get `data-cv-style` hooks, and the rules go into `cascivo.css`. See [Strict CSP](#strict-csp). |
| `[build] external_scripts` | Default `false`. `true`: component scripts, `theme_script()` and `islands_script()` go into `.js` files with `<script src>`. |
| `[build] hash_assets` | Default `false`. `true`: `cascivo.css` and the generated `.js` files get content-hashed names under `/_cw/`, like `asset()`. |
| `[head] robots` | Default `robots` of `head()`. Default `"index, follow"`; `""` omits the tag. |
| `[deploy] target` | `"workers"` (default) or `"pages"`. See [Deploy](#deploy-to-cloudflare). |
| `[deploy] project` | Cloudflare Pages project name (`--project-name`). |
| `[[feeds]] collection` | Required. The collection to publish. |
| `path` | Feed file. Default `rss.xml`. |
| `title` | Feed title. Default: the site title. |
| `description` | Feed description. Default empty. |
| `limit` | Newest items to include. Default `20`. |

An unknown key is an error with the line number.

## Theming

`theme` picks the cascivo theme in `cascivo.css`. Add `dark_theme` to follow the OS colour
scheme, and `[brand]` to change the tokens:

```toml
theme = "light"
dark_theme = "dark"

[brand]
primary = "#4f46e5"
accent = "#f59e0b"
radius = 8
font = "Inter"
```

`[brand]` writes `--cascivo-color-*` scales (and radius, gap, density and font tokens) into
`cascivo.css`. With `dark_theme`, the brand colours also get a dark variant in the media query.
The `prefers-color-scheme` rules apply only when `<html>` has no `data-theme`. Leave it off the
layout, or let `theme_script()` set it.

## Strict CSP

For a policy like `default-src 'self'` (no `'unsafe-inline'` for styles or scripts):

```toml
[build]
inline_styles = false
external_scripts = true
hash_assets = true    # optional: /_cw/cascivo.<hash>.css, safe to cache as immutable
```

- Components (columns, grid, charts, gauges, sized images, …) get `data-cv-style="<hash>"`
  instead of `style=""`. `cascivo.css` holds one rule per hash, in `@layer cascivo.override`.
- Component scripts (sortable tables) go into `/cascivo.js` with `defer`.
- `islands_script()` gives `<script type="module" src="/cascivo-islands.js">`.
- `theme_script()` gives `<script src="/cascivo-theme.js">`. It has no `defer`: it must set
  `data-theme` before the first paint, so keep it in `<head>`. Without `hash_assets`, every page
  must call it with the same arguments.

Your own layouts must also have no inline `style` or `<script>`.

## Content collections

A collection is a folder in `content/` with a `_schema.toml` and one Markdown file per entry. The
file name is the slug.

```toml
# content/posts/_schema.toml
[fields]
title = { type = "string", required = true }
date = { type = "date", required = true }
description = { type = "string" }
tags = { type = "array" }
```

```md
+++
title = "Hello"
date = 2026-02-01
tags = ["news"]
+++
The body is Markdown.
```

Front matter is TOML between two `+++` lines. Field types:

| Type | Accepts |
| ---- | ------- |
| `string` | a string |
| `int` | an integer |
| `float` | a float or an integer |
| `bool` | `true` or `false` |
| `date` | a TOML date (`2026-01-31`) or a `"YYYY-MM-DD"` string |
| `array` | an array |

A missing required field, a wrong type and a field the schema does not list are all errors. Every
collection needs a schema file.

## Routes

Files in `pages/` become routes.

| File | URL |
| ---- | --- |
| `pages/index.md` | `/` |
| `pages/about.md` | `/about/` |
| `pages/blog/index.html` | `/blog/` |
| `pages/blog/[posts].html` | `/blog/<slug>/`, once per entry of `posts` |
| `pages/404.md` or `pages/404.html` | `/404.html` (`pages/de/404.html` gives `/de/404.html`) |

Markdown and `.html` pages have optional `+++` TOML front matter. In a Markdown page,
`layout = "post"` picks `layouts/post.html`; the default is `default`. Front matter keys are
available as `page.<key>`, for example `{{ head(page.title, page.description) }}`. A `.html` page
is a template. A dynamic route `[collection].html` must be a `.html` template, and the collection
must exist. Two files that give the same URL are an error.

Two front matter keys control the sitemap, on pages and on collection entries (no schema field
needed):

| Key | Meaning |
| --- | ------- |
| `sitemap = false` | Leave the page out of `sitemap.xml`. On a `[collection].html` template it leaves out every entry. |
| `lastmod = 2026-03-04` | Adds `<lastmod>` to its sitemap entry. A TOML date or a `YYYY-MM-DD` string. |

The 404 page renders with its layout like any page and is never in the sitemap. `head()` gives
it `robots` `noindex` by default. `cascivo-web dev` serves it, with status 404, for unknown URLs.

## Layouts and templates

Layouts and `.html` pages are [minijinja](https://docs.rs/minijinja) templates (Jinja syntax).
Use `{% extends "default.html" %}` and `{% block body %}` to share a frame.

| Variable | Value |
| -------- | ----- |
| `site` | `title`, `base_url`, `lang`, `theme`. In a locale, `lang` is that locale. |
| `page` | Front matter plus `url`. On a dynamic route: the entry (fields, `slug`, `url`, `content`). |
| `content` | The page or entry body as rendered HTML. |
| `collections` | `collections.<name>`: a list of entries with `slug`, `url`, `content` and the fields. |
| `locale` | The locale being rendered. |
| `alternates` | Translations of this page: a list of `{locale, url, href}`. `href` is absolute. |
| `t(key, **args)` | A message from `i18n/<locale>.toml`. |
| `cv(text)` | Renders `.cv` text to HTML. |

`url` on an entry exists only when a `[collection].html` route exists.

```html
<ul>{% for p in collections.posts|sort(attribute="date", reverse=true) %}
  <li><a href="{{ p.url }}">{{ p.title }}</a> {{ p.date }}</li>
{% endfor %}</ul>
{{ cv('page-header "Blog"') }}
```

Every page links one shared `/cascivo.css`. It holds the base styles, the theme and only the
component CSS the site uses. Layouts need no link tag. Component scripts are added to the page
for you.

## Components in Markdown

A line `::name[text]{attrs}` is one component. An attribute named like a positional argument fills
it, so you need not know the order. A `cv` code fence holds any `.cv` tree.

````md
::alert[Body text]{title="Tip" variant=info}

```cv
cols 3
  stat Users 1204
```
````

For the component list and `.cv` syntax see [USING-CASCIVO-HTML.md](USING-CASCIVO-HTML.md) or run
`cascivo-html guide`. Markdown inside a component is not supported.

## Locales

Add `[i18n]` to `site.toml`. The default locale is served at `/`. Every other locale gets a
prefix: `/de/`, `/de/about/`, `/de/blog/hello/`.

**Pages.** `pages/about.md` is the default locale. `pages/de/about.md` translates it. Do not put
default-locale pages under `pages/<default>/`; that is an error.

**Collections.** `content/posts/hello.md` is the default entry. `content/posts/de/hello.md`
translates it (same slug). Locale folders must name a configured locale, and not the default.

**`locale` on entries.** Every entry gets a `locale` value: the language its text is in. If your
schema declares its own `locale` field, yours is used.

**Fallback.** With `fallback = true` (default), a locale without a translation reuses the default
text: the page is rendered at `/de/about/` from the default source, and the entry appears in
the German collections with `locale = "en"`. With `fallback = false`, only real translations are
rendered. A missing page gives no `/de/...` URL, and a locale without translated entries has
an empty collection.

**Messages.** `i18n/<locale>.toml` holds UI strings. Nested tables are flattened with dots.

```toml
# i18n/en.toml
[nav]
home = "Home"
hi = "Hello {name}"
```

```html
{{ t('nav.home') }} {{ t('hi', name=user) }}
```

`{name}` placeholders are filled from keyword arguments. A missing key is a build error naming the
file. With `fallback`, a key missing in a locale is read from the default locale. Values must be
strings.

**hreflang.** Put this in your layout `<head>`:

```html
{% for a in alternates %}<link rel="alternate" hreflang="{{ a.locale }}" href="{{ a.href }}">{% endfor %}
```

With `base_url` set, `sitemap.xml` lists each page once, with `xhtml:link` entries for every
translation and an `x-default` link to the default locale.

**Why TOML, not Fluent.** A static page needs lookup and `{name}` filling, not plural selection
at run time. TOML is already the config format here and adds no dependency.

## RSS feeds

Each `[[feeds]]` entry writes one RSS 2.0 file (`rss.xml` by default).

- It reads `title` and `date` (both required) and `description` (optional) from each entry.
- It needs `base_url` for absolute links, and a dynamic route `[collection].html` for item links.
- Items are the newest `limit` entries. The output depends only on your files: `lastBuildDate` is
  the newest item, not the clock.
- With `[i18n]`, each locale gets `/<locale>/rss.xml`, but only when that locale has that
  collection's pages (a translation, or `fallback = true`).

Link it from a layout: `<link rel="alternate" type="application/rss+xml" href="/rss.xml">`.

## Deploy to Cloudflare

`cascivo-web deploy` builds the site, then runs `npx wrangler deploy` in the site folder
(Cloudflare Workers Static Assets). The starter's `wrangler.jsonc`:

```jsonc
{
  "name": "my-site",
  "compatibility_date": "2026-11-01",
  "assets": { "directory": "./dist", "not_found_handling": "404-page" }
}
```

```sh
cascivo-web deploy --dry-run          # build, then print the wrangler command
cascivo-web deploy                    # build and deploy
cascivo-web deploy -- --env staging   # args after -- go to `wrangler deploy`
```

A `wrangler.jsonc`, `wrangler.json` or `wrangler.toml` must exist in the site folder; without
one the command fails before it builds. You need Node (for `npx`) and a Cloudflare login:
`npx wrangler login`, or `CLOUDFLARE_API_TOKEN` in the environment. If you use `--out`, point
`assets.directory` at the same folder (the tool warns when they differ).

**Cloudflare Pages.** `--pages` (or `[deploy] target = "pages"`) runs
`npx wrangler pages deploy <dist> --project-name <name>` instead; no wrangler config is needed.
The project name comes from `--project-name` or `[deploy] project`. `_headers` and `_redirects`
in `public/` are copied to `dist/`, so Pages applies them.

```sh
cascivo-web deploy --pages --project-name my-site --dry-run
```

## Dev server

`cascivo-web dev [site] [--port 4321]` serves the site on `127.0.0.1`. It checks your files every
20 ms, re-renders on change (no cargo rebuild) and reloads open pages over Server-Sent Events.
A broken build prints the errors in the terminal and in the browser; fix the file and it recovers.

## Commands

```text
cascivo-web new <dir>
cascivo-web build [site] [--out <dir>] [--no-clean]
cascivo-web dev [site] [--port <n>]
cascivo-web deploy [site] [--out <dir>] [--no-clean] [--pages] [--project-name <name>] [--dry-run] [-- <wrangler args>]
```

`site` defaults to `.` and `--out` to `<site>/dist`. `build` and `deploy` delete the output folder
first, so removed pages do not linger; `--no-clean` keeps it. Only a plain folder inside the site
that holds no sources is deleted; any other `--out` prints a warning and is not cleaned. Exit code is `0` on success and `1` on error.

## Errors

A build reports every problem it finds, not only the first. Each one names the file and line:

```text
content/posts/hello.md:1: missing required field `date`
pages/blog/[posts].html: no collection `posts` under content/
layouts/default.html:7: undefined value
```

Writes are confined to the output folder, and paths are checked before they are written.

## Use it from Rust

```rust
let site = cascivo_web::Site::load(std::path::Path::new("my-site"))?;
let output = site.render()?;       // a map of path -> bytes
output.write(std::path::Path::new("dist"))?;
```

With the `axum` feature, `cascivo_web::router(&site)?` returns an `axum::Router` that serves the
rendered site from memory. Mount it with `merge` or `nest`.

## Limits

- No image pipeline. Images need a URL, a `data:` URI or a file in `public/` that you link
  yourself.
- No syntax highlighting, no islands or client-side hydration, and no custom `<head>` management
  beyond what your layout writes.
- No Markdown inside components.
- Output is static: no forms and no run-time data.

## Links

- Source: [`crates/cascivo-web`](https://github.com/cascivo/cascivo/tree/main/crates/cascivo-web)
- Components in Markdown: [USING-CASCIVO-HTML.md](USING-CASCIVO-HTML.md)
- Releasing: [RELEASING.md](RELEASING.md)
