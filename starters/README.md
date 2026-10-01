# Starters

These are ready-to-deploy cascivo projects, and no one edits them by hand. `pnpm starters:generate`
rewrites them: the `cloudflare*` starters from the built CLI (`cascivo create`), and the example
apps from their source in `apps/examples/` (`scripts/starters/examples.ts`).
`scripts/checks/starters.test.ts` fails when a committed starter no longer matches what it is
generated from.

Each directory is self-contained: it has real npm versions and no workspace links. That lets
the "Deploy to Cloudflare" button and `npm create cloudflare --template` use it straight from GitHub.

| Starter | What it is | Deploy |
| --- | --- | --- |
| [`cloudflare`](cloudflare) | A client-rendered app plus its API as one Worker. It has file routes, a typed API and a live SSE demo. | [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cascivo/cascivo/tree/main/starters/cloudflare) |
| [`cloudflare-board`](cloudflare-board) | `cloudflare`, plus a multiplayer `/board` page. Notes and cursors sync live through a Durable Object (`@cascivo/app/sync`). | [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cascivo/cascivo/tree/main/starters/cloudflare-board) |
| [`cloudflare-agent`](cloudflare-agent) | `cloudflare`, plus an `/assistant` page. An AI agent (Cloudflare's Agents SDK on Workers AI) answers with real cascivo components, validated against their manifests. Runs on React. | [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cascivo/cascivo/tree/main/starters/cloudflare-agent) |
| [`cloudflare-crud`](cloudflare-crud) | `cloudflare`, plus a `/customers` page: a D1 table behind `DataTable`'s server mode, with create, edit and delete. The Worker creates its own schema, so it deploys with no setup. | [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cascivo/cascivo/tree/main/starters/cloudflare-crud) |
| [`stage`](stage) | The [Stage](../apps/examples/stage) example app: live Q&A and polls for talks. The audience asks, upvotes and votes from their phones, the host moderates, and a projector view shows the spotlight. One Durable Object per session. | [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cascivo/cascivo/tree/main/starters/stage) |

```sh
npm create cloudflare@latest my-app -- --template cascivo/cascivo/starters/cloudflare
```

To try one inside this repository, install it in its own directory:

```sh
cd starters/cloudflare-board
pnpm install   # or npm install
pnpm dev
```

Each starter has its own `pnpm-workspace.yaml`. Without it, `pnpm install` would install the
cascivo monorepo instead of the starter, and `pnpm dev` would fail to resolve
`@preact/preset-vite` and `@cloudflare/vite-plugin`. The file also approves the install
scripts of `esbuild` and `workerd`, which pnpm 11 and later refuse by default. npm ignores it.

A starter pins the cascivo versions from the CLI it was generated with. It installs from npm
once those versions are published. Until a release goes out, a starter on `main` can be ahead
of npm.
