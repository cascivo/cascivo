---
'@cascivo/app': minor
'cascivo': minor
'@cascivo/mcp': minor
---

Uploads into R2, with progress.

- `@cascivo/app/uploads`:
  - `defineUploads({ path, maxBytes, types })` is one policy shared by the page and the
    Worker. It refuses SVG and HTML, which would run script from your origin.
  - `startUpload(policy, file)` checks the file, then uploads it with `progress`, `status`
    and `result` signals. Files above 16 MiB go up in parts.
- `@cascivo/app/uploads-server`:
  - `handleUploads(policy, env.FILES, { images })` stores uploads under keys the Worker
    chooses, enforces the policy, and serves files back with `nosniff` and a sandboxing CSP.
    `?w=` returns a WebP preview through Cloudflare Images.
  - `listUploads(bucket)` lists stored files.
  - R2's and Images' bindings fit the structural types, with no Cloudflare type dependency.
- `cascivo create --framework cloudflare --example files` scaffolds an upload page on
  `FileUploader`, with previews. The MCP tool `create_app` accepts `examples: ['files']`.
