---
'cascivo': minor
---

`cascivo app add page "<title>" [--block <name>]` adds a page to an app made from a blueprint: it updates `cascivo.app.json` and writes the page, its block, and the route and nav entries, merging three ways with any generated file you have edited. Blocks can now bring a package (`dashboard-charts` adds `@cascivo/charts`), so all 19 page blocks are available to blueprints.

Fixed the three-way merge behind `cascivo update` (and now `app add page`): after a pure insertion it skipped the next base line, so that line disappeared from the result and the other side's later edits could be lost.
