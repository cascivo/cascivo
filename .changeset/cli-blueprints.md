---
'cascivo': minor
---

`cascivo create --from cascivo.app.json` compiles a blueprint: the app's name, framework, theme, runtime, examples and auth, plus `pages: [{ title, block? }]`. Each page renders a registry block whose source is written to `src/blocks/` (its imports rewritten to `@cascivo/react`), wired into the routes and the side nav. A blueprint is held to the same rules as the flags, an unknown field or block fails with the list of valid ones, and the blueprint is kept in the app as `cascivo.app.json`. A long `--sections` list no longer fails the React + Vite app's own `format:check`.
