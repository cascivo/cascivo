# 404 — no cascivo doc at this path

There is no per-component doc at the URL you requested. This is a real HTTP 404,
not the docs SPA — the name is wrong or the component does not exist.

To find valid names:

- Component index (all names + one-line descriptions): https://cascivo.com/llms.txt
- Everything in one file: https://cascivo.com/llms-full.txt
- Machine-readable registry (JSON): https://cascivo.com/registry.json

Doc URLs follow the registry `name` exactly, e.g. `stat` → `/llms/stat.md` (there
is no `stat-card`). Page blocks are namespaced: `/llms/block/<name>.md` (e.g.
`/llms/block/dashboard-overview.md`).
