---
'@cascivo/mcp': minor
---

The MCP server now ships `instructions` carrying the cascivo CSS layer contract, so
every MCP-connected agent receives the layer-discipline rules (no unlayered CSS, no
invented layer names, native nesting over sublayers, `layer(vendor)` for third-party
CSS) before generating styles.
