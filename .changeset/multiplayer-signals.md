---
'@cascivo/app': minor
'cascivo': minor
'@cascivo/mcp': minor
---

Multiplayer signals on Durable Objects.

- `@cascivo/app/sync` adds `connectRoom(url)`:
  - `room.signal(path, initial, parse)` and `room.map(prefix, parse)` are signals shared by
    everyone in a room.
  - `room.presence` and `setPresence` share cursors and similar per-person state.
  - `room.status` reports the connection, which reconnects on its own.
  - A value is last-writer-wins per path, in the order the room receives writes. Your own
    writes show as pending until the room confirms them.
- `@cascivo/app/sync-server` adds `SyncRoom`, a Durable Object that uses WebSocket
  hibernation and validates every message, and `roomResponse`, which routes a request to it.
- `cascivo create --framework cloudflare --example board` scaffolds a shared board with
  draggable notes and live cursors. It runs on a temporary account, so you can share it
  with no Cloudflare sign-up.
- The MCP tool `create_app` takes `examples`.
