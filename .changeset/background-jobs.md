---
'@cascivo/app': minor
'cascivo': minor
'@cascivo/mcp': minor
---

Background jobs with live progress.

- `@cascivo/app/jobs`:
  - `defineJob({ steps, output })` declares a job, shared by the runner and the page.
  - `watchJob(job, url)` gives the page the job's state as a signal: status, step,
    progress, message, and the parsed output.
- `@cascivo/app/jobs-server`: `jobReporter(job, env.ROOMS, id)` reports from whatever runs
  the job — a Workflow, a Queue consumer, `ctx.waitUntil`.
- A job's progress is a room only the server writes:
  - `writeRoom(namespace, name, path, value)` writes into any room from the Worker.
  - `roomResponse(…, { readOnly: true })` lets the browser watch a room but not write to it.
- When the room refuses a write, its error now names that write, so the client drops it
  instead of resending it forever.
- `cascivo create --framework cloudflare --example import` scaffolds a CSV import running as
  a Workflow, with its steps and progress live; a reload picks the job back up. The MCP tool
  `create_app` accepts `examples: ['import']`.
