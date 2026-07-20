# Ops — docs host mapping (cascivo.com / docs.cascivo.com)

Internal runbook for the two hostnames that serve the docs, and how to keep them
fresh. Context: a 2026-07-18 adopter read docs from `docs.cascivo.com` that were ~4
days stale (a fix committed 07-14 was not being served on 07-18), which no automated
signal caught. This note records the intended mapping; the automated enforcement is
`.github/workflows/docs-freshness.yml` + the `verify-site` job in `cf-pages.yml`.

## Intended mapping

Both hostnames serve the **same** built tree — the `apps/site` Cloudflare Pages
project (`cf-pages.yml` → `wrangler pages deploy apps/site/dist`, project
`cascade-ui-landing`, production branch `main`):

| Hostname            | Serves                                  | Cloudflare binding                          |
| ------------------- | --------------------------------------- | ------------------------------------------- |
| `cascivo.com`       | marketing + docs + `/llms/*` + `/r/*`   | custom domain on the `cascade-ui-landing` Pages project, `main` |
| `docs.cascivo.com`  | the same tree (mirror)                  | custom domain on the **same** Pages project, `main` |

Both must point at the same project's **production** deployment. If `docs.cascivo.com`
is bound to a different project, a stale branch, or an old preview, it will serve stale
bytes while `cascivo.com` is current — exactly the reported failure.

## Verify / fix (manual, Cloudflare dashboard)

An agent cannot change DNS/Pages bindings from this repo. To verify or fix:

1. Cloudflare dashboard → Pages → `cascade-ui-landing` → **Custom domains**.
2. Confirm **both** `cascivo.com` and `docs.cascivo.com` are listed and **Active**,
   and that the production branch is `main`.
3. If `docs.cascivo.com` is missing or attached elsewhere, add it here (and remove the
   stale binding from the other project).
4. Trigger a redeploy (`cf-pages.yml` → *Run workflow*, or push to `main`) and confirm
   the `verify-site` job passes for both hosts.

## Ongoing enforcement (automated — do not remove)

- **`verify-site`** (in `cf-pages.yml`, `needs: deploy-site`): after every production
  deploy, `scripts/checks/deployed-freshness.sh` curls both hosts and fails the
  workflow unless they serve the just-deployed `registry.json` `.version`.
- **`docs-freshness.yml`** (daily cron): the same probe, to catch rot **between**
  deploys. On failure it opens/updates a pinned issue labeled `docs-freshness`.

To run the probe manually against production:

```sh
bash scripts/checks/deployed-freshness.sh
# or a single host:
bash scripts/checks/deployed-freshness.sh https://docs.cascivo.com
```
