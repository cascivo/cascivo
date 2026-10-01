---
'@cascivo/app': minor
---

`SyncRoom.canWrite` and `roomResponse(…, { claims })`: decide who may write what in a room.

- Override `canWrite({ room, path, value, connection })` on a `SyncRoom` subclass. Return
  `true` to store a browser's write, or `false` / a message to refuse it. The writer gets the
  message as the write's error and drops the write; nobody else sees it. Writes from the
  Worker (`writeRoom`, `write`) skip the rule. A rule that throws refuses the write.
- `roomResponse(request, ns, name, { claims })` passes what the Worker verified about the
  connection (a role, a user id) to `canWrite` as `connection.claims`. A browser cannot set
  it: `roomResponse` strips every `x-cascivo-room-*` header a caller sends. JSON, at most 4 KB.
- `Json`, the type of every room value, is now exported from `@cascivo/app/sync` and
  `@cascivo/app/sync-server`, so a subclass can type what it passes to `write`.
