---
'cascivo': minor
---

Every `cascivo create` now writes `cascivo.app.json` (from flags, prompts or `--from`), stamped with the CLI version, so every scaffolded app can use `cascivo app`. `cascivo app add example <name>` adds a cloudflare example to an existing app, and `cascivo app upgrade` regenerates the app with this CLI's templates. Both merge three ways against the app's original files, which are rebuilt with the CLI version the app records.
