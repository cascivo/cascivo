---
'cascivo': patch
'@cascivo/registry': patch
---

Validate registry payloads at the network boundary, and refuse writes outside the project.

`cascivo add` fetched a registry item and reached it with a bare `as RegistryItem`.
Nothing between the socket and `writeFileSafe` checked a single field, and two of
those unchecked fields decide where files land on disk:

- **`files[].target`** is resolved with `resolve(cwd, target)` for template items.
  `resolve` walks out of the project without complaint, so a registry returning
  `{ "type": "template", "files": [{ "target": "../../.zshrc" }] }` wrote an
  arbitrary file on the machine running `cascivo add`. An absolute target
  (`/etc/cron.d/…`) worked the same way.
- **`name`** feeds the output directory. `..` survived the `split('/').pop()`
  that was meant to flatten it, escaping the configured components directory.

Both are reachable from any registry an adopter has configured, including a
third-party namespace resolved through the cascivo.com directory.

`validateItem` already existed and was thorough, but it was only ever reached from
the `cascivo registry validate` authoring command — never on the install path — and
it did not inspect `files[]` at all. It now checks each file entry and rejects a
`name` or `target` that is absolute, drive-relative, UNC, or contains a `..`
segment. The new `parseItem(raw, source)` is the throwing form the install path
uses, and it names the registry URL in the error.

Defense in depth: `resolveOutputPath` and `resolveTemplateTarget` now assert the
resolved destination is inside the directory they are supposed to write into, so a
future call site that bypasses the parser still cannot escape.

The other network-JSON boundaries were unchecked the same way and are now parsed
rather than asserted: the registry directory (a non-http `registryUrl` is dropped
instead of becoming a fetch base), the audit contract, `eject`'s registry and token
catalog, `search`'s namespace index, and the HTTP error-body message. Malformed
input at each now produces an error naming the source instead of a `TypeError`
somewhere downstream.
