---
'@cascivo/mcp': patch
---

`get_guide` no longer resolves a slug containing `../`, `/` or other non-slug characters. Before,
a crafted slug reached any `.md` file the server process could read and shaped the fallback
request to cascivo.com. Component markdown for `get_context` gets the same check, in case a fetched
context bundle carries a crafted name. Valid slugs (lowercase words joined by hyphens) are
unchanged.
