---
'@cascivo/mcp': minor
---

New `show_view` tool: validates a `ViewConfig` and, in clients that support MCP Apps (the MCP UI extension), shows it to the user rendered with the real components, through the `ui://cascivo/view.html` resource. The page follows the host's light or dark theme. Clients without the extension get the validation result as text.
