# Cloudflare — let AI crawlers reach the docs

cascivo.com is served from **Cloudflare Pages** (see `.github/workflows/cf-pages.yml`).
The site content is fully static and crawlable — every marketing/docs route is
prerendered to real HTML, and `llms.txt`, `llms-full.txt`, `registry.json`, and
`/r/*` are plain static files. So when an AI tool reports it "cannot access the
page," the block is almost never the app; it is the **Cloudflare edge challenging
the crawler** before the request reaches Pages.

The usual culprit is **Bot Fight Mode** (or Super Bot Fight Mode) plus managed WAF
rules: they issue a JS/managed challenge to known AI-bot user-agents and to
datacenter IPs. A normal browser solves the challenge; a server-side fetcher
(GPTBot, Google's Gemini fetcher, v0's fetcher, PerplexityBot, ClaudeBot…) cannot,
and gets a `403`/`503` challenge page instead of the content.

> **Diagnose first.** In the Cloudflare dashboard open **Security → Events** and
> filter the last 24h. If you see requests from those user-agents with action
> `Managed Challenge` / `Block` / `JS Challenge`, that confirms it. `curl -A
> "GPTBot" https://cascivo.com/llms.txt -i` from a non-residential IP reproduces
> it (`verify.sh` below automates this).

## What "fixed" looks like

Both of these must be true for the AI-facing URLs:

1. **Known AI-crawler user-agents are not challenged or blocked.**
2. **The machine-readable resources are reachable and CORS-enabled** so
   browser-based tools (v0) can `fetch()` them cross-origin. CORS + `X-Robots-Tag`
   are already handled in-repo by `apps/site/public/_headers`; this doc covers the
   edge-security half, which lives only in the Cloudflare account.

## Option A — Dashboard (click-ops)

1. **Turn Bot Fight Mode off (or scope it).**
   - Free plan: **Security → Bots** → toggle **Bot Fight Mode** _off_. It is a
     blunt instrument that challenges all automated traffic, including good bots.
   - Pro+ (Super Bot Fight Mode): set **Definitely automated** to _Allow_, or at
     least add the allow rule in step 2 so verified/AI bots are skipped.
2. **Add a WAF skip rule for AI crawlers + the machine-readable paths.**
   **Security → WAF → Custom rules → Create rule**:
   - Field/expression (edit to taste):
     ```
     (http.user_agent contains "GPTBot") or (http.user_agent contains "OAI-SearchBot")
     or (http.user_agent contains "ChatGPT-User") or (http.user_agent contains "ClaudeBot")
     or (http.user_agent contains "Claude-Web") or (http.user_agent contains "anthropic-ai")
     or (http.user_agent contains "PerplexityBot") or (http.user_agent contains "Perplexity-User")
     or (http.user_agent contains "Google-Extended") or (http.user_agent contains "Applebot")
     or (http.user_agent contains "CCBot") or (http.user_agent contains "Bytespider")
     or (http.user_agent contains "Amazonbot") or (http.user_agent contains "cohere-ai")
     or (http.user_agent contains "Meta-ExternalAgent")
     or (starts_with(http.request.uri.path, "/llms"))
     or (starts_with(http.request.uri.path, "/context/"))
     or (starts_with(http.request.uri.path, "/r/"))
     or (http.request.uri.path eq "/registry.json")
     ```
   - Action: **Skip** → check **All managed rules**, and under **More components
     to skip** enable everything relevant (Browser Integrity Check, Security
     Level, Rate Limiting, User Agent Blocking). Place it **first** so it runs
     before any challenge rule.
3. **Leave robots.txt permissive.** Already handled in-repo — `apps/site/public/robots.txt`
   names the AI crawlers with `Allow: /`.

## Option B — Script it

`wrangler` deploys Pages but **cannot** manage WAF rules or Bot Fight Mode — those
are zone-level settings behind the Cloudflare API. The script below uses that API
(the same credentials your `wrangler` deploy already relies on) and is safe to run
alongside your existing wrangler workflow.

```sh
# Needs: CLOUDFLARE_API_TOKEN (Zone.WAF + Zone.Bot Management edit, or an account
# token with those scopes), and curl + jq. Zone id is auto-resolved from the domain.
export CLOUDFLARE_API_TOKEN=***          # same token family as your CF Pages deploy
scripts/cloudflare/allow-ai-crawlers.sh cascivo.com

# Preview the changes without applying them:
scripts/cloudflare/allow-ai-crawlers.sh --dry-run cascivo.com

# Also flip Bot Fight Mode off (skipped by default so you can decide):
scripts/cloudflare/allow-ai-crawlers.sh --disable-bot-fight cascivo.com

# Verify only — curl the AI URLs with crawler user-agents and assert 200:
scripts/cloudflare/allow-ai-crawlers.sh --verify-only cascivo.com
```

The script is **idempotent**: it appends one WAF custom rule tagged
`cascivo:allow-ai-crawlers` and updates that same rule on re-runs instead of
duplicating it.

### API token scopes

Create the token at **My Profile → API Tokens → Create Token → Custom**:

- **Zone → Zone → Read** (to resolve the zone id)
- **Zone → WAF → Edit** (custom ruleset rule)
- **Zone → Bot Management → Edit** — only needed for `--disable-bot-fight`
- Zone Resources: **Include → Specific zone → cascivo.com**

## Verifying

`scripts/cloudflare/allow-ai-crawlers.sh --verify-only cascivo.com` (or the manual
curl) should return `200` with the real body for each URL under each crawler UA:

```sh
for ua in GPTBot ClaudeBot PerplexityBot Google-Extended; do
  echo "== $ua =="
  curl -sS -o /dev/null -w "%{http_code}\n" -A "$ua" https://cascivo.com/llms-full.txt
done
```

If any return `403`/`503`, re-check that the WAF skip rule is ordered first and that
Bot Fight Mode is off (or scoped). Note the Pages edge caches challenge decisions
briefly — allow a minute after changing settings, and check **Security → Events**
to see which rule acted.
