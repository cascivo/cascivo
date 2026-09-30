---
'cascivo': minor
'@cascivo/mcp': minor
---

`cascivo create --framework cloudflare --example search` finds help articles by meaning.

- Each article, seeded into D1, is embedded with Workers AI (`@cf/baai/bge-base-en-v1.5`) into
  a Vectorize index. "Index articles" does it, and it is rate-limited.
- A question is embedded the same way and matched against the index.
- Neither Workers AI nor Vectorize runs locally, so `vite dev` searches by keyword with SQLite
  full-text search, and the page says so. User input is quoted, so it never reaches the
  full-text query syntax.
- The model's reply is checked before use.
- The Workers AI binding no longer implies the Agents SDK wiring (`/agents/*`,
  `nodejs_compat`).
- The MCP tool `create_app` accepts `examples: ['search']`.
