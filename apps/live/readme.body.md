The Worker behind the live strip on cascivo.com's landing page: one `@cascivo/app/sync` room on a Durable Object, where every visitor sees everyone else's pointer.

The room is public, so it accepts almost nothing:

- **Pointers only.** A browser can send `{ x, y }` as two fractions, or `null`. Anything else is dropped, and the room re-serializes what it relays, so no visitor can put text or images in front of another. The room is read-only: nothing is stored.
- **Limits.** 100 sockets per room, 20 pointer updates per socket per second (the page sends 10), and 20 new connections per IP per minute (`ratelimits` in `wrangler.jsonc`).
- **Allowed pages.** Only origins in `ALLOWED_ORIGINS` may open the room. That stops other sites from embedding it; it is not authentication, which is why the limits above exist.

## Run it locally

```sh
pnpm --filter @cascivo/live dev        # the Worker on http://localhost:8790
# in apps/site:
VITE_CASCIVO_LIVE_URL=ws://localhost:8790/room npx vite --port 5173
```

Open the landing page in two windows and move the pointer over the strip.

## Deploy

Deploying makes the room public, so CI does it only when you opt in:

1. Set the repository variable `CASCIVO_LIVE_DEPLOY` to `true`. The `deploy-live` job in `.github/workflows/cf-pages.yml` then deploys this Worker on the next push to `main` that touches `apps/live` or `packages/app` (or on a manual run). The `CF_API_TOKEN` it uses needs the Workers Scripts edit permission.
2. Set the repository variable `CASCIVO_LIVE_URL` to the room's URL, for example `wss://cascivo-live.<your-subdomain>.workers.dev/room`, and redeploy the site. Without it the site builds without the strip.

If the site moves to another host, add it to `ALLOWED_ORIGINS` in `wrangler.jsonc`.
