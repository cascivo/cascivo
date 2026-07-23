# @cascivo/docs

## 0.2.0

### Minor Changes

- 5c55ba7: Ship the entire docs surface as an npm package so it's reachable with no website.

  - **New package `@cascivo/docs`** bundles the complete generated documentation — `llms.txt`, `llms-full.txt`, per-component `llms/*.md`, `context/*`, the concept guides, `registry.json`, the token/icon catalogs, and a `versions.json` snapshot. Use it with **no install**: `npx -y @cascivo/docs` prints the index, `npx @cascivo/docs <component>` one reference, `npx @cascivo/docs guide <slug>` a guide, `npx @cascivo/docs --full` the whole library, `--list`/`--dir` to enumerate/grep. It reaches an adopter through the npm registry — the one channel proven to work when `npmjs.com` and `cascivo.com` are 403'd, proxied, or offline. Raw-tarball and installed (`exports`-map) consumption are supported too.
  - **`@cascivo/mcp` gains `list_guides` and `get_guide`** — the concept guides (getting-started, theming, troubleshooting, …) are reachable through MCP for the first time, resolved offline-first (monorepo → `@cascivo/docs` → bundled → network). The MCP server now depends on `@cascivo/docs`.
  - The offline docs channel is now referenced from every package README, the `dist/index.d.ts` quickstart, `llms.txt`, GETTING-STARTED, and TROUBLESHOOTING, enforced by a new `docs-package-refs` guard in `pnpm meta:check`.
