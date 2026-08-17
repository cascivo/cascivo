---
'@cascivo/docspack': minor
---

New package: `@cascivo/docspack` — cascivo's documentation in the [docspack](https://docspack.dev)
format, so an agent can search it offline instead of reading it.

`@cascivo/docs` ships the documentation as whole files to print. This ships the same
documentation as a local search index: `pnpm add -D @cascivo/docspack docspack`, `npx docspack
sync`, and `npx docspack ask "<question>"` answers from `~/.docspack/store.db` with no network
access, scoped to the versions the lockfile installed. One line in `AGENTS.md` or `CLAUDE.md` is
the whole agent setup, and `npx docspack mcp` serves the same index over MCP for clients that
prefer a declared tool.

The payload is generated from the same `apps/site/public/` surface `pnpm regen` produces — ~600
chunks covering every component, chart, block, layout, section, flow and editor reference, the
concept guides, and the overview — so it cannot lag the source. Chunks carry the tags, variants,
states and prop names from `registry.json`, which a generic Markdown build cannot know, and each
one repeats its import line so a retrieved fragment still tells an agent where the component
comes from. `docspack doctor --strict` and a 20-question retrieval eval both run in CI.
