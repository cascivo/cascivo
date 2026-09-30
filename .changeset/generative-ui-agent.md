---
'@cascivo/render': minor
'cascivo': minor
'@cascivo/mcp': minor
---

Generative UI on Cloudflare's Agents SDK.

- `@cascivo/render/validate` exports `validateView` with no React and no components, so a
  Worker or any other server can check a model's view before it reaches a browser. It also
  rejects inherited object keys such as `toString` as component names, which the old
  `in componentMap` check let through.
- `cascivo create --framework cloudflare --example agent` scaffolds an `/assistant` page:
  - An `AIChatAgent` Durable Object on Workers AI calls a `show_view` tool.
  - The Worker validates every view against the component manifests and returns errors to
    the model, which fixes them.
  - The page renders the result with `<CascivoView>`.
  - `vite dev` answers from a scripted model, so it runs offline and without an account.
  - The example runs on React, because the Agents SDK's hooks call React 19's `use()`, which
    Preact does not implement. `--runtime preact` with it is refused.
- Fresh `--framework cloudflare` apps now pass their own `lint` and `format:check`:
  - An empty `Env` no longer trips `no-empty-object-type`.
  - `tsconfig.json`, `wrangler.jsonc` and the generated sources are formatted as Prettier
    prints them.
  - `tsconfig.json` is also fixed for `react-vite` apps.
- The MCP tool `create_app` accepts `examples: ['agent']`.
