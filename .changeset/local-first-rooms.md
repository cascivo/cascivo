---
'@cascivo/app': minor
'cascivo': minor
'@cascivo/mcp': minor
---

Local-first rooms.

- `connectRoom(url, { storage })` saves the room on the device after every change: its last
  state and every write the room has not confirmed.
  - On start the room renders from storage before the socket opens. Once it connects, the
    room's state replaces the saved copy.
  - Writes made offline survive a reload or a closed tab, and go out on the next connection.
  - The saved copy is parsed on load; another version or a corrupted copy is dropped.
- `room.unsynced` counts writes still waiting for the room.
- A write over the room's size limit now throws on the client, instead of being rejected by
  the room after it was queued.
- `SyncRoom.onWrite({ room, path, value })` is a hook for mirroring writes elsewhere, such as
  D1. It runs after the write is stored and sent, and a throw never reaches the clients.
- `cascivo create --framework cloudflare --example notes` scaffolds a notes page that keeps
  working when the connection drops. The MCP tool `create_app` accepts `examples: ['notes']`.
