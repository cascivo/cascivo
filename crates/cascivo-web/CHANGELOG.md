# cascivo-web

## 0.3.0

### Minor Changes

- `aria_current` template function, include errors carry their cause chain, and `theme_script()` defaults follow `Config.theme` / `dark_theme` instead of the poster themes.

- cascivo-web strict-CSP output and theming (#305): `[build] inline_styles = false` moves component styles into `cascivo.css` (`data-cv-style` hooks); `[build] external_scripts = true` writes component scripts, `theme_script()` and `islands_script()` to `/cascivo.js`, `/cascivo-theme.js` and `/cascivo-islands.js` (the theme script stays blocking); `[build] hash_assets = true` gives `cascivo.css` and those scripts content-hashed `/_cw/` names; `dark_theme` adds a `prefers-color-scheme: dark` theme to `cascivo.css`; a `[brand]` table (`primary`, `accent`, `radius`, `gap`, `density`, `font`, `mono`) generates token overrides. The starter's 404 page is now `pages/404.md` with the layout. cascivo-html adds `theme_css` and `theme_names`.

- `Engine`: request-time rendering of a page or one block of it (`render`, `render_block`) from `layouts/` and `templates/`, with `ReqCtx` (`request`, `user`, `flash`), per-request locale and forced HTML escaping; `Engine::load` + `reload`/`watch` for dev, `Engine::from_bundle` for embedded use. `build --bundle [--bundle-out <file>]` writes the `Bundle`. New features `cli`, `images`, `fs` (all default); `default-features = false` builds the engine alone and compiles for `wasm32-unknown-unknown`.

- `public/` copies `_headers`, `_redirects` and `.well-known/` (only OS/VCS clutter is skipped); `pages/404.html` renders to `/404.html` with its layout, outside the sitemap, and `dev` serves it for unknown URLs; `[build] trailing_slash`; front matter on `.html` pages; `sitemap = false` and `lastmod` on pages and entries; `build` empties `dist/` first (`--no-clean`); `[head] robots` and `head(robots=false)`; `deploy --pages --project-name` (or `[deploy] target = "pages"`) runs `wrangler pages deploy`.

- `cascivo-web new <dir> --dynamic [--target native|workers|containers] [--checkout <dir>]`: a `cascivo-server` starter with notes CRUD behind sign-in, a Solid island, a server island, SSE and the `/c/*` interaction demos. Every target shares the router, templates and `web/` (htmx, `@cascivo/elements`, the island); native and containers ship `tests/views.rs` (every fragment is its page's subtree, the CRUD flow), workers builds for `wasm32-unknown-unknown`. Library API: `cascivo_web::starter_dynamic::{Target, files, create}`.

### Patch Changes

- `Engine`: `theme_script()` and `islands_script()` add `nonce="…"` from the request's `ReqCtx::nonce` (inline or `[build] external_scripts`), so a strict `script-src 'nonce-…'` CSP admits them. The static build has no nonce and is unchanged.

## 0.2.1

### Patch Changes

- Updated internal dependencies.

## 0.2.0

### Minor Changes

- `img(priority=true | "<media>")` preloads the image (`<link rel=preload>` with srcset), loads it eagerly with `fetchpriority=high`; `format="keep"` copies the source unchanged.

## 0.1.0

### Minor Changes

- First release: static sites from Markdown and content collections with cascivo-html components; i18n locale routes with fallback and hreflang sitemap, RSS feeds, `cascivo-web new` starter for Cloudflare Workers Static Assets, `cascivo-web deploy`.
