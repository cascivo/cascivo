---
'@cascivo/core': minor
'@cascivo/registry': minor
---

Component manifests gain an optional `agent` section (`AgentMeta`) that maps agent actions onto
existing props. `@cascivo/registry` validates it in `validateItem`/`parseItem`.
