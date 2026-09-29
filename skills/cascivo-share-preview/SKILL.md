---
name: cascivo-share-preview
description: Put a cascivo app on a public URL with no Cloudflare account. Use it when the user wants to see, share or demo what you built. It uses a temporary Cloudflare account (with a claim link) for apps that have a Worker, and Cloudflare Drop for static builds.
---

# cascivo-share-preview

## When to use

Use this skill when the user wants the app running somewhere they can open or share. Typical requests:

- "Show me it live."
- "Give me a link."
- "Deploy a preview."
- "Can my team see this?"

This skill needs no Cloudflare account and no credentials. It creates a preview, not a production deploy. Every preview is **public** and is **deleted after 60 minutes** unless the user claims it.

## Pick the path by project shape

| Project                                               | How to tell                                        | Path                                                   |
| ----------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| `cascivo create --framework cloudflare`               | has `wrangler.jsonc` and a `deploy:preview` script | temporary account, which serves the Worker and the app |
| `react-vite` or `astro` scaffold, or any static build | has no Worker; `vite build` writes `dist/`         | Cloudflare Drop, or the config-free CLI equivalent     |

## Worker app (`--framework cloudflare`)

1. Run `npm run deploy:preview`, or call the MCP tool `deploy_preview` with `{ cwd }`. The script builds the app, then runs `wrangler deploy --temporary`.
2. The output contains two URLs. **Give the user both**:
   - `https://<name>.<random>.workers.dev` is the live app.
   - `https://dash.cloudflare.com/claim-preview?claimToken=…` is the claim URL. The user opens it and signs in (or signs up) within 60 minutes to keep the deployment and everything it created.
3. Tell the user the preview is public, and that it disappears after 60 minutes unless they claim it.

These failures are expected. Handle them as follows:

- **"You're already authenticated with Cloudflare, so `--temporary` can't be used."** The user already has an account. Offer `npm run deploy`, which deploys to their own account. Do not log them out yourself.
- **The app binds Workers AI or R2.** A temporary account does not provide these. Deploy with `npm run deploy` to a real account instead.
- **A plain HTTP client sees a "Just a moment…" page.** Cloudflare's bot protection is in front of the preview, and a browser passes it. So verify the preview in a browser, not with `curl`.

## Static build

1. Build the app: `npm run build`.
2. Choose one way to publish:
   - **The user deploys it.** Tell them to drag `dist/` onto <https://www.cloudflare.com/drop/>. Drop takes at most 1,000 files, each up to 25 MiB.
   - **You deploy it.** Run `npx wrangler deploy --temporary --assets dist --name <app-name> --compatibility-date <date>`. The output is the same pair of live and claim URLs.

## Do not

- Do not deploy without telling the user that the preview is public.
- Do not put secrets or real user data into a preview.
- Do not describe a preview as the user's production site. It is theirs only after they claim it.
