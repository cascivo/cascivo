---
'@cascivo/render': minor
'@cascivo/mcp': minor
'cascivo': minor
---

Agent setup in one command, and `@cascivo/render` on npm.

- **`@cascivo/render` is published.** Render a JSON view config with real cascivo components,
  and read it back as Markdown from `@cascivo/render/text`. The component is now
  `CascivoView`; `CascadeView` remains as a deprecated alias until 2.0.0. The JSON Schema
  ships as `@cascivo/render/schema/view.v1.json`. It joins the lockstep family.
- **`cascivo mcp init`** adds the cascivo MCP server to `.mcp.json` (Claude Code),
  `.cursor/mcp.json` or `.vscode/mcp.json` (`--client`), keeping any other servers.
- **New MCP tool `render_view_as_markdown`:** validate a view config, render it with the
  project's own `@cascivo/render`, and return what it says as Markdown — so an agent can
  check a generated view before showing it.
