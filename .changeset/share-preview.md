---
'cascivo': minor
'@cascivo/mcp': minor
---

Share a running preview without a Cloudflare account.

- `cascivo create --framework cloudflare` adds a `deploy:preview` script. It builds the app,
  then runs `wrangler deploy --temporary`, which prints a public `workers.dev` URL and a
  claim URL. The deployment is deleted after 60 minutes unless you claim it.
- The `react-vite` and `astro` scaffolds' READMEs explain how to share a static build. Drop
  `dist/` onto Cloudflare Drop, or run `wrangler deploy --temporary --assets dist`.
- MCP:
  - `create_app` takes `framework` (`react-vite`, `astro` or `cloudflare`) and `runtime`.
  - The new `deploy_preview` tool runs `deploy:preview` and returns the live URL and claim URL.
- New skill: `cascivo-share-preview`.
