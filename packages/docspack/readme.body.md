cascivo's documentation as a [docspack](https://docspack.dev) package: pre-chunked Markdown
plus a manifest, indexed locally into SQLite so an agent can **search the docs offline, scoped
to the version your lockfile installed**.

`@cascivo/docs` ships the same documentation as whole files to read. This package ships it as a
search index to query. Install whichever matches how your agent works — or both.

## Use it

```sh
pnpm add -D @cascivo/docspack docspack
npx docspack sync
npx docspack ask "how do I make a destructive button"
```

`sync` indexes every docspack package in your lockfile into `~/.docspack/store.db`. After that
`ask`, `search` and `list` make **no network requests at all**.

## Give an agent access

One line in `AGENTS.md` or `CLAUDE.md` is the whole setup — no MCP server, no per-client
configuration, nothing resident when nobody is asking:

```
Run `docspack ask "<question>"` for documentation on this project's
dependencies. It answers from the installed versions.
```

For clients that prefer a declared tool, `npx docspack mcp` serves the same index over MCP.

## What is in it

| Source               | Chunks                                                             |
| -------------------- | ------------------------------------------------------------------ |
| Component references | every component, chart, block, layout, section, flow and editor    |
| Concept guides       | theming, tokens, headless primitives, testing, framework setup     |
| Overview             | install, the two consumption paths, CSS layer and reactivity rules |

Each chunk carries the tags, variants, states and prop names from `registry.json`, so a query
naming a variant ("a destructive button") or an intent ("collapsible sections") reaches the
component that implements it. Each one also repeats its import line, so a retrieved fragment of
a props table still tells the agent where the component comes from.

## Ask well

Answers are capped at three chunks and ~3,000 tokens, so several narrow questions beat one
broad one:

```sh
npx docspack ask "which CSS layer do my overrides go in"   # good
npx docspack ask "css"                                     # too broad
npx docspack list                                          # what is indexed
```

## Versioning

The package version tracks this package, not the component library. Every chunk names the
cascivo registry version it was generated from, and `@cascivo/react`'s version is recorded in
the overview chunk — so an answer always states which release it describes. Keep the package
updated alongside `@cascivo/react` and re-run `docspack sync`.

## Building it

The payload is a build artifact, generated from the same `apps/site/public/` surface that
`pnpm regen` produces, so it cannot lag the source:

```sh
pnpm --filter @cascivo/docspack build     # write .llms/ and llms.txt
pnpm --filter @cascivo/docspack doctor    # docspack doctor --strict
pnpm --filter @cascivo/docspack test      # doctor + a retrieval eval
```
