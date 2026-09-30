---
'cascivo': minor
'@cascivo/mcp': minor
---

`cascivo create --framework cloudflare --example digest` emails the report page as a PDF
every Monday at 08:00 UTC, on a Cron Trigger.

- The Worker's `scheduled` handler renders `/report` with Browser Run (`exportPage`) and
  sends it through Email Service as an attachment.
- Every run is recorded in D1, sent, skipped (with what is missing) or failed.
- `/digest` lists the runs and has "Send now".
- The digest brings the `export` example along, for its report page.
- wrangler.jsonc now keeps every plain-text setting in one `vars` object, and one Email
  Service binding, when several examples need them.
- The MCP tool `create_app` accepts `examples: ['digest']`.
