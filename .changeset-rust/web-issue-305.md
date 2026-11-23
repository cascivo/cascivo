---
'cascivo-web': minor
---

`public/` copies `_headers`, `_redirects` and `.well-known/` (only OS/VCS clutter is skipped); `pages/404.html` renders to `/404.html` with its layout, outside the sitemap, and `dev` serves it for unknown URLs; `[build] trailing_slash`; front matter on `.html` pages; `sitemap = false` and `lastmod` on pages and entries; `build` empties `dist/` first (`--no-clean`); `[head] robots` and `head(robots=false)`; `deploy --pages --project-name` (or `[deploy] target = "pages"`) runs `wrangler pages deploy`.
