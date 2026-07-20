# 404 — no cascivo doc at this path

There is no per-component doc at the URL you requested. This is a real HTTP 404,
not the docs SPA — the name is wrong or the component does not exist.

To find valid names:

- Component index (all names + one-line descriptions): https://cascivo.com/llms.txt
- Everything in one file: https://cascivo.com/llms-full.txt
- Machine-readable registry (JSON): https://cascivo.com/registry.json

Doc URLs follow the registry `name` exactly, e.g. `stat` → `/llms/stat.md` (there
is no `stat-card`). Several entry types are **namespaced** — the flat name does not
resolve, use the prefixed path:

- Charts: `/llms/chart/<name>.md` — e.g. `/llms/chart/area-chart.md` (there is no
  `/llms/area-chart.md`). Also `line-chart`, `bar-chart`, `sparkline`, `pie-chart`, …
- Page blocks: `/llms/block/<name>.md` — e.g. `/llms/block/dashboard-overview.md`.
- Layouts: `/llms/layout/<name>.md` — e.g. `/llms/layout/app-shell.md`.

Find the exact `name` for any entry in the registry (`/registry.json`) or the
component index in `/llms.txt`.
