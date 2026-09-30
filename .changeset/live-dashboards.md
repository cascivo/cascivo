---
'@cascivo/app': minor
'cascivo': minor
'@cascivo/mcp': minor
---

Live dashboards fed by Queues.

- `@cascivo/app/live`: `defineLive({ metrics, window, bucket })` declares the metrics and how
  much per-second history to keep. `watchLive(live, url)` gives the window as a signal for
  the charts, sliding every second with or without events.
- `@cascivo/app/live-server`: `LiveRoom` is a `SyncRoom` Durable Object that keeps
  per-bucket totals. `recordLive` adds a Queue batch into it, drops malformed events, and
  throws so the Queue retries when the room cannot be reached.
- `SyncRoom` gains `read`, `write` and `paths` for subclasses. `roomResponse` now strips
  every `x-cascivo-room-*` header a caller sends, not only the two it knew about.
- `cascivo create --framework cloudflare --example live` scaffolds an `/ops` dashboard:
  - `POST /api/events` sends events to a Queue.
  - The Worker's `queue` handler records them.
  - Every open copy of the page updates each second.
  - The MCP tool `create_app` accepts `examples: ['live']`.
