# @cascivo/render

## 1.10.0

### Minor Changes

- 33732bc: Add `@cascivo/render/a2ui/v0_9`: an A2UI v0.9 renderer. `createA2uiStore` validates and holds
  server messages as signals, `A2uiSurface` renders a surface with cascivo components, and two
  catalogs ship with it (the cascivo catalog and A2UI's basic catalog). Limits, URL checks and a
  safe `regex` function protect against hostile agents.

  `./validate` changes too: a prop named `url` is now URL-checked at any depth (as `href` and `src`
  already were), and `RadioCardGroup` props are now validated against the props it declares (an unknown prop is an
  error) instead of accepting any prop.

- b3fb29c: Generated component catalog (`@cascivo/render/schema/catalog.v1.json`) and an A2UI v0.9 custom
  catalog (`@cascivo/render/schema/a2ui/v0_9/catalog.json`), both derived from the component
  manifests. `validateView` now checks the shape of object and array props (required nested fields and their
  types; unknown nested fields and values are still accepted), and `view.v1.json` no longer rejects
  valid translation refs or lists TypeScript type names as enums.

### Patch Changes

- Updated dependencies [1af31ab]
- Updated dependencies [1af31ab]
- Updated dependencies [33732bc]
- Updated dependencies [1af31ab]
- Updated dependencies [1af31ab]
- Updated dependencies [1af31ab]
  - @cascivo/react@1.10.0
  - @cascivo/i18n@1.10.0
  - @cascivo/core@1.10.0
  - @cascivo/text@1.10.0

## 1.9.0

### Minor Changes

- dafb2cc: `<CascivoView components={{ Kpi, LineChart }}>` renders components beyond the built-in set: charts from `@cascivo/charts`, or an app's own. They are looked up before the built-ins and their props pass through unchecked. `validateView(view, { components })` accepts the same names, and `viewToMarkdown(view, { components })` reads them. `@cascivo/render` gains no dependency: only an app that renders charts installs `@cascivo/charts`.
- dafb2cc: `<CascivoView>` renders 18 more components, the ones a page is built from: `PageHeader`, `Heading`, `Text`, `Stat`, `Status`, `Progress`, `Steps`, `Timeline`, `AvatarGroup`, `Image`, `Code`, `Blockquote`, `List` and `ListItem`, and the `CardHeader`, `CardTitle`, `CardContent` and `CardFooter` parts of a card. A JSON view can now carry a dashboard's header and KPI stats.

### Patch Changes

- Updated dependencies [dafb2cc]
- Updated dependencies [dafb2cc]
- Updated dependencies [dafb2cc]
- Updated dependencies [dafb2cc]
- Updated dependencies [dafb2cc]
  - @cascivo/react@1.9.0
  - @cascivo/core@1.9.0
  - @cascivo/i18n@1.9.0
  - @cascivo/text@1.9.0

## 1.8.0

### Patch Changes

- @cascivo/core@1.8.0
- @cascivo/react@1.8.0
- @cascivo/i18n@1.8.0
- @cascivo/text@1.8.0

## 1.7.0

### Patch Changes

- Updated dependencies [db3f056]
- Updated dependencies [db3f056]
- Updated dependencies [db3f056]
- Updated dependencies [db3f056]
- Updated dependencies [db3f056]
- Updated dependencies [57dc995]
- Updated dependencies [db3f056]
  - @cascivo/react@1.7.0
  - @cascivo/i18n@1.7.0
  - @cascivo/core@1.7.0
  - @cascivo/text@1.7.0

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
