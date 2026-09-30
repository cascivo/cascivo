---
'@cascivo/app': minor
'cascivo': minor
'@cascivo/mcp': minor
---

D1 behind a DataTable.

- `@cascivo/app/db`:
  - `defineTable({ table, key, columns })` lists what may be sorted, searched and filtered.
  - `queryTable(db, table, query, parseRow)` turns `DataTable`'s server-mode `TableQuery`
    into SQL, with identifiers from the definition and every value bound, and returns
    `{ rows, total }`. A query outside the definition is a `TableQueryError`, which is an
    `HttpError(400)`.
  - `parseTableQuery` and `parseTablePage` check what crosses the network.
  - `queryRows` runs any statement through a parser.
  - `migrate(db, migrations)` lets the Worker apply its own schema, once per isolate, each
    migration in one transaction. A fresh deploy needs no migration step.
- `cascivo create --framework cloudflare --example crud` scaffolds a customers table with
  server-side sorting, search, filters and paging, plus create, edit and delete. It works on
  a temporary account. `starters/cloudflare-crud` has a Deploy button. The MCP tool
  `create_app` accepts `examples: ['crud']`.
