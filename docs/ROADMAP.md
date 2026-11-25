# cascivo — Roadmap

The project has shipped its v1 scope: the component registry (current counts are
generated into the [README](../README.md)), 12 themes, the CLI copy-paste flow, the prebuilt `@cascivo/react` distribution,
and the AI context layer (manifests, MCP server, `llms.txt`, `context.json`,
token catalog, `audit --ai`).

## Where things are tracked now

- **What exists today** — the [README](../README.md) package tables and
  component index are generated from the registry and always current.
- **Release history** — per-package `CHANGELOG.md` files (changesets), the
  root [CHANGELOG](../CHANGELOG.md) index, and the machine-readable
  [`breaking-changes.json`](https://cascivo.com/breaking-changes.json).
- **Open work** — GitHub issues, and `factory-backlog.json` for components
  queued for the dark factory.

## htmx + Solid stack (no React)

Guides: [USING-HTMX-SOLID.md](USING-HTMX-SOLID.md), [USING-CASCIVO-SERVER.md](USING-CASCIVO-SERVER.md),
[CONTRACT.md](CONTRACT.md); measured comparison:
[COMPARE-REACT-VS-HTMX-SOLID.md](COMPARE-REACT-VS-HTMX-SOLID.md). Per-gap status (done / open) lives in
[plans/htmx-solid-gap-analysis.md](plans/htmx-solid-gap-analysis.md).

- **Done:** 14 elements + htmx glue, Solid components/helpers/testing, contract parity for 80+ emitters,
  distribution gates (`pack:check`, `isolated:check`, bundle budgets) cover `@cascivo/css`, `elements`, `solid`.
- **Open:** publishing `@cascivo/elements` and `@cascivo/solid` (flip `private`, add a changeset: a
  maintainer decision), Solid SSR, 18 chart types outside React, docs-site pages and visual baselines
  for elements.

## History

Development ran as 58 versioned implementation plans; they are preserved
verbatim in [`docs/internal/`](./internal/) (`ROADMAP-V2.md` …
`ROADMAP-V59.md`) together with the original project blueprint
(`FEATURES.md`), working audits, and migration feedback. They are internal
working documents — commands and paths in them may be stale.
