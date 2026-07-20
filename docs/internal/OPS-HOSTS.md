# Ops — docs hosting (cascivo.com) and the retired docs.cascivo.com

Internal runbook for where the docs are served and how they stay fresh.

## Decision (2026-07): one canonical host

**`cascivo.com` is the single canonical host for everything** — marketing, the docs
SPA (`/docs/*`), the machine-readable surfaces (`/llms/*`, `/context/*`, the catalogs),
the shadcn registry (`/r/*`), and the fetchable guide mirror (`/docs/*.md`). It is the
only site this repo deploys (`.github/workflows/cf-pages.yml` → the `cascade-ui-landing`
Pages project). All generated URLs point here (`scripts/llms/generate.ts` `DOCS = SITE`;
`CASCIVO_HOST` in `packages/cli` and `packages/mcp`).

**`docs.cascivo.com` is retired.** It used to be a separate docs deployment; the docs
now live on the main site, and nothing in this repo builds or deploys that subdomain.
A stale/independent `docs.cascivo.com` was the root cause of the 2026-07-18 adopter
reading 4-day-old docs.

## Required ops action — redirect docs.cascivo.com → cascivo.com

Set a **301 redirect** from `docs.cascivo.com/*` to `https://cascivo.com/:splat` so the
many already-published `docs.cascivo.com/...` links (npm READMEs shipped in prior
releases, blog posts, search-index entries) keep resolving. In Cloudflare:

1. Dashboard → the zone for `cascivo.com` → **Rules → Redirect Rules** (or Bulk
   Redirects). Add: when hostname equals `docs.cascivo.com`, 301 to
   `https://cascivo.com${uri.path}` (preserve path + query).
2. Ensure `docs.cascivo.com` is **not** attached as a custom domain to any old/other
   Pages project (that would serve stale content instead of redirecting). Remove any
   such binding first.
3. Confirm: `curl -sI https://docs.cascivo.com/llms.txt` returns `301` with
   `location: https://cascivo.com/llms.txt`.

Alternative if you'd rather not keep the subdomain at all: drop the `docs.cascivo.com`
DNS record entirely. Downside: existing external links to `docs.cascivo.com/...` break
with no redirect. The redirect above is preferred.

## Ongoing enforcement (automated — do not remove)

- **`verify-site`** (`cf-pages.yml`, `needs: deploy-site`): after every production
  deploy, `scripts/checks/deployed-freshness.sh` asserts `cascivo.com` serves the
  just-deployed `registry.json` `.version`, and that `docs.cascivo.com` 301s to it.
- **`docs-freshness.yml`** (daily cron): the same probe, to catch rot **between**
  deploys (including the redirect breaking). On failure it opens/updates a pinned
  issue labeled `docs-freshness`.

Run the probe manually:

```sh
bash scripts/checks/deployed-freshness.sh
# skip the redirect assertion while the 301 is still being set up:
FRESHNESS_SKIP_REDIRECT=1 bash scripts/checks/deployed-freshness.sh
```

Until the redirect is configured, the `verify-site` / `docs-freshness` jobs will fail
on the redirect assertion — that is intended (it is the reminder to finish the ops
step). Set `FRESHNESS_SKIP_REDIRECT=1` on the job temporarily if you need to land other
changes first.
