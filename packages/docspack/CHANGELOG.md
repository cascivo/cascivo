# @cascivo/docspack

## 0.2.2

### Patch Changes

- 5da5a77: Ship #235's docs surface, and make `cascivo-docs <topic>` fall back to a guide

  #235 was released as `@cascivo/email` only, but two other published packages carry
  part of that change and neither was named in a changeset — so the work is merged and
  invisible to adopters, which is the failure mode `docs/RELEASING.md` calls a
  correctness property rather than a preference.

  Both packages build their payload from `apps/site/public/` at publish time, so a
  version bump is the only way their content moves:

  - **`@cascivo/docs`** copies that surface into `content/`. #235 added the
    `recipe-email` and `email-client-support` guides and gave `llms.txt` /
    `llms-full.txt` their first `@cascivo/email` section. Without a release,
    `npx @cascivo/docs guide recipe-email` still answers "no doc".
  - **`@cascivo/docspack`** reshapes the same surface into its `.llms/` chunks, so
    `docspack ask` indexes the email package only from a published version.

  `@cascivo/docs` also carries a CLI fix from #235: a bare topic now falls back to a
  guide of the same slug, and an unresolved topic suggests near matches instead of
  dead-ending. An adopter typed `cascivo-docs email` and got `no doc for "email"` while
  `guide recipe-email` sat right there.

  No API change in either package — the bump exists to move already-merged content.

## 0.2.1

### Patch Changes

- a0bb1cf: Release every published package.

  This changeset names all twenty published packages so the next release cuts a version for each
  of them, including the four that no other pending changeset touches (`@cascivo/docs`,
  `@cascivo/docspack`, `@cascivo/eslint-plugin`, `@cascivo/vite-plugin`).

  The bump is `patch` everywhere; where another pending changeset asks for a `minor` or `major`,
  that higher bump still wins.

## 0.2.0

### Minor Changes

- 51ca93a: New package: `@cascivo/docspack` — cascivo's documentation in the [docspack](https://docspack.dev)
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
