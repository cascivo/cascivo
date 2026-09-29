# Starters

These are ready-to-deploy cascivo projects. `cascivo create` writes each one, and no one edits them by hand:
`pnpm starters:generate` rewrites them from the built CLI. `scripts/checks/starters.test.ts` fails
when a committed starter no longer matches what the scaffolder writes.

Each directory is self-contained: it has real npm versions and no workspace links. That lets
the "Deploy to Cloudflare" button and `npm create cloudflare --template` use it straight from GitHub.

| Starter | What it is | Deploy |
| --- | --- | --- |
| [`cloudflare`](cloudflare) | A client-rendered app plus its API as one Worker. It has file routes, a typed API and a live SSE demo. | [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cascivo/cascivo/tree/main/starters/cloudflare) |
| [`cloudflare-board`](cloudflare-board) | `cloudflare`, plus a multiplayer `/board` page. Notes and cursors sync live through a Durable Object (`@cascivo/app/sync`). | [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cascivo/cascivo/tree/main/starters/cloudflare-board) |
| [`cloudflare-agent`](cloudflare-agent) | `cloudflare`, plus an `/assistant` page. An AI agent (Cloudflare's Agents SDK on Workers AI) answers with real cascivo components, validated against their manifests. Runs on React. | [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cascivo/cascivo/tree/main/starters/cloudflare-agent) |

```sh
npm create cloudflare@latest my-app -- --template cascivo/cascivo/starters/cloudflare
```

A starter pins the cascivo versions from the CLI it was generated with. It installs from npm
once those versions are published. Until a release goes out, a starter on `main` can be ahead
of npm.
