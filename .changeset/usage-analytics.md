---
'@cascivo/app': minor
'cascivo': minor
'@cascivo/mcp': minor
---

Usage analytics on Workers Analytics Engine.

- `@cascivo/app/analytics`:
  - `defineMetrics({ dataset, blobs, doubles, index })` names Analytics Engine's positional
    columns once.
  - `metrics.write(env.USAGE, { … })` writes by name. Missing values are filled, and each
    blob is cut to Analytics Engine's limits.
  - `metrics.sql()` writes queries against names.
- `queryAnalytics(credentials, sql, parseRow)` runs a query over the SQL API and parses
  each row. `numberField` and `stringField` accept Analytics Engine's JSON forms.
- `cascivo create --framework cloudflare --example usage` records every API request and
  charts the last 24 hours: requests per hour, the busiest routes, errors and latency.
  Reading needs `CF_ACCOUNT_ID` and `CF_API_TOKEN` secrets; until they exist, the page says
  what to set. The MCP tool `create_app` accepts `examples: ['usage']`.
