---
'@cascivo/app': minor
'@cascivo/email': minor
'cascivo': minor
'@cascivo/mcp': minor
---

PDF and PNG export through Browser Run.

- `@cascivo/app/export`:
  - `handleExport(request, { launch })` serves
    `/api/export?page=/reports&format=pdf|png`. It renders a page of the app at its own
    origin, and refuses other origins and `/api/` paths.
  - `exportPage` returns the file directly, for a Cron Trigger or a Workflow.
  - `isExporting()` lets the app drop its shell in the export.
  - `exportUrl()` builds the download link.
  - `@cloudflare/puppeteer`'s `Browser` fits the structural types.
- `@cascivo/email`: `sendEmail` takes `attachments`. An attachment's filename and type are
  checked for CR/LF like any header.
- `cascivo create --framework cloudflare --example export` scaffolds a report page with PDF
  and PNG downloads. The MCP tool `create_app` accepts `examples: ['export']`.
