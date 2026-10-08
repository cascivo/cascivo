---
'cascivo': minor
---

`cascivo create --workspace` writes the app into a pnpm workspace: `apps/web`, a `packages/ui` package for the team's own components, Vite+ running each package's scripts, a GitHub Actions workflow, and (React + Vite) Vitest with a smoke test. Every scaffold now also ships `CLAUDE.md` (which includes `AGENTS.md`) and a `.mcp.json` that registers the cascivo MCP server.
