---
name: cascivo-web
description: Build a static site (pages, Markdown content collections, locales, RSS, sitemap) with the `cascivo-web` CLI and deploy it to Cloudflare Workers Static Assets. Use for blogs, docs and marketing sites that need no React or JavaScript build.
---

# cascivo-web

Markdown + collections + minijinja layouts in, a `dist/` folder of static files out.

## Steps

1. Scaffold: `cascivo-web new my-site`, then `cd my-site`. Do not run `new` in a folder with files you care about.
2. Edit content. Posts: `content/posts/<slug>.md` with `+++` TOML front matter that matches
   `content/posts/_schema.toml` (types `string int float bool date array`; unknown fields are errors).
   Pages: `pages/*.md`. Templates: `layouts/*.html`. Static files: `public/`.
3. Build: `cascivo-web build`. Errors are `file:line: message` and list every problem; fix and re-run until it exits 0.
   Use `cascivo-web dev` (port 4321, live reload) only when the user wants a preview.
4. Locales: add `[i18n] default/locales/fallback` to `site.toml`, translations in `pages/<locale>/` and
   `content/<coll>/<locale>/`, strings in `i18n/<locale>.toml`, used as `{{ t('nav.home') }}`.
5. Deploy check: `cascivo-web deploy --dry-run` builds and prints the `npx wrangler deploy` command.
   **Never run `cascivo-web deploy` without `--dry-run` unless the user says so.** It needs Node and a
   Cloudflare login (`wrangler login` or `CLOUDFLARE_API_TOKEN`). Extra args: `deploy -- --env staging`.

If the binary is missing: `cargo install cascivo-web` (or `cargo install --path crates/cascivo-web` from the cascivo repo for unreleased changes).
Full guide: <https://cascivo.com/docs/guides/using-cascivo-web>.

## Facts

- Routes: `pages/index.md` is `/`, `about.md` is `/about/`, `blog/[posts].html` renders once per `posts` entry at `/blog/<slug>/`. Slugs are `a-z 0-9 -`.
- Template variables: `site`, `page`, `content`, `collections.<name>`, `locale`, `alternates`, `t()`, `cv()`.
- Components in Markdown: `::alert[Body]{title="Tip" variant=info}` or a ` ```cv ` fence. Do not guess component names; run `cascivo-html guide`.
- RSS: `[[feeds]] collection = "posts"` needs `base_url`, entries with `title` and `date`, and a `[posts].html` route.
- Images need URLs or files in `public/`; there is no image pipeline.
