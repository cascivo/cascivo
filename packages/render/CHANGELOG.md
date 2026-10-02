# @cascivo/render

## 1.6.0

### Patch Changes

- Updated dependencies [9ffc904]
  - @cascivo/react@1.6.0
  - @cascivo/core@1.6.0
  - @cascivo/i18n@1.6.0
  - @cascivo/text@1.6.0

## 1.5.0

### Patch Changes

- @cascivo/core@1.5.0
- @cascivo/react@1.5.0
- @cascivo/i18n@1.5.0
- @cascivo/text@1.5.0

## 1.4.0

### Minor Changes

- b2a3d94: Agent setup in one command, and `@cascivo/render` on npm.

  - **`@cascivo/render` is published.** Render a JSON view config with real cascivo components,
    and read it back as Markdown from `@cascivo/render/text`. The component is now
    `CascivoView`; `CascadeView` remains as a deprecated alias until 2.0.0. The JSON Schema
    ships as `@cascivo/render/schema/view.v1.json`. It joins the lockstep family.
  - **`cascivo mcp init`** adds the cascivo MCP server to `.mcp.json` (Claude Code),
    `.cursor/mcp.json` or `.vscode/mcp.json` (`--client`), keeping any other servers.
  - **New MCP tool `render_view_as_markdown`:** validate a view config, render it with the
    project's own `@cascivo/render`, and return what it says as Markdown — so an agent can
    check a generated view before showing it.

- a5c3efb: Generative UI on Cloudflare's Agents SDK.

  - `@cascivo/render/validate` exports `validateView` with no React and no components, so a
    Worker or any other server can check a model's view before it reaches a browser. It also
    rejects inherited object keys such as `toString` as component names, which the old
    `in componentMap` check let through.
  - `cascivo create --framework cloudflare --example agent` scaffolds an `/assistant` page:
    - An `AIChatAgent` Durable Object on Workers AI calls a `show_view` tool.
    - The Worker validates every view against the component manifests and returns errors to
      the model, which fixes them.
    - The page renders the result with `<CascivoView>`.
    - `vite dev` answers from a scripted model, so it runs offline and without an account.
    - The example runs on React, because the Agents SDK's hooks call React 19's `use()`, which
      Preact does not implement. `--runtime preact` with it is refused.
  - Fresh `--framework cloudflare` apps now pass their own `lint` and `format:check`:
    - An empty `Env` no longer trips `no-empty-object-type`.
    - `tsconfig.json`, `wrangler.jsonc` and the generated sources are formatted as Prettier
      prints them.
    - `tsconfig.json` is also fixed for `react-vite` apps.
  - The MCP tool `create_app` accepts `examples: ['agent']`.

### Patch Changes

- a5c3efb: `validateView` (and so `<CascivoView>`, which validates before rendering) now refuses a
  URL-carrying prop whose scheme could run script: `javascript:`, `vbscript:`, `data:` and any
  other scheme except `http`, `https`, `mailto` and `tel`. It checks nested values too, such as
  `Header`'s `links[].href`. React 19 already blocks `javascript:` links, but Preact writes them
  to the DOM as given, so on Preact a generated or user-published view could carry a link that
  runs script when clicked. Relative URLs are unaffected.
- Updated dependencies [f4ff5ab]
- Updated dependencies [15caa11]
- Updated dependencies [15caa11]
- Updated dependencies [b2a3d94]
  - @cascivo/text@1.4.0
  - @cascivo/react@1.4.0
  - @cascivo/core@1.4.0
  - @cascivo/i18n@1.4.0
