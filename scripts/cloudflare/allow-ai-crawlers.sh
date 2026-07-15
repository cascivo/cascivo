#!/usr/bin/env bash
#
# Let AI crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, v0's fetcher,
# …) and the machine-readable resources through the Cloudflare edge for a Pages
# site. `wrangler` deploys Pages but cannot manage WAF rules or Bot Fight Mode, so
# this uses the Cloudflare API with the same credentials your deploy relies on.
#
# It is idempotent: it maintains a single WAF custom rule tagged
# `cascivo:allow-ai-crawlers`, updating it in place on re-runs.
#
# Usage:
#   scripts/cloudflare/allow-ai-crawlers.sh [flags] [domain]
#
# Flags:
#   --dry-run             Print what would change; make no API writes.
#   --disable-bot-fight   Also turn Bot Fight Mode off (off by default — opt in).
#   --verify-only         Skip all changes; just curl the AI URLs with crawler
#                         user-agents and assert HTTP 200 (needs no API token).
#
# Env:
#   CLOUDFLARE_API_TOKEN  Token with Zone:Read + WAF:Edit (+ Bot Management:Edit
#                         for --disable-bot-fight). Not needed for --verify-only.
#   CF_ZONE_ID            Optional; auto-resolved from the domain when unset.
#
# Requires: curl, jq.
set -euo pipefail

API="https://api.cloudflare.com/client/v4"
RULE_TAG="cascivo:allow-ai-crawlers"
PHASE="http_request_firewall_custom"

DOMAIN="cascivo.com"
DRY_RUN=0
DISABLE_BOT_FIGHT=0
VERIFY_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --disable-bot-fight) DISABLE_BOT_FIGHT=1 ;;
    --verify-only) VERIFY_ONLY=1 ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    --*) echo "Unknown flag: $arg" >&2; exit 2 ;;
    *) DOMAIN="$arg" ;;
  esac
done

# User-agents and paths to let through. Keep in sync with robots.txt / _headers.
UA_NEEDLES=(
  GPTBot OAI-SearchBot ChatGPT-User ClaudeBot Claude-Web anthropic-ai
  PerplexityBot Perplexity-User Google-Extended Applebot CCBot Bytespider
  Amazonbot cohere-ai Meta-ExternalAgent
)
VERIFY_PATHS=(/llms.txt /llms-full.txt /registry.json /r/shadcn/registry.json)

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }; }
need curl
need jq

# ── Verify: curl the AI URLs under crawler UAs, assert 200 ────────────────────
verify() {
  local ua path code fail=0
  echo "Verifying https://$DOMAIN — AI URLs under crawler user-agents:"
  for ua in GPTBot ClaudeBot PerplexityBot Google-Extended; do
    for path in "${VERIFY_PATHS[@]}"; do
      code=$(curl -sS -o /dev/null -w "%{http_code}" -A "$ua" \
        --max-time 20 "https://$DOMAIN$path" || echo 000)
      if [ "$code" = "200" ]; then
        printf '  \033[32mok\033[0m   %-14s %s\n' "$ua" "$path"
      else
        printf '  \033[31mFAIL\033[0m %-14s %s -> %s\n' "$ua" "$path" "$code"
        fail=1
      fi
    done
  done
  [ "$fail" = 0 ] && echo "All AI URLs reachable." || {
    echo "Some URLs are being blocked/challenged — see docs/CLOUDFLARE-AI-ACCESS.md." >&2
    return 1
  }
}

if [ "$VERIFY_ONLY" = 1 ]; then
  verify
  exit $?
fi

# ── API helpers ───────────────────────────────────────────────────────────────
: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN (or use --verify-only)}"

cf() { # cf METHOD PATH [json-body]
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -sS -X "$method" "$API$path" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" --data "$body"
  else
    curl -sS -X "$method" "$API$path" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
  fi
}

cf_ok() { # assert `.success == true`, else print errors and exit
  jq -e '.success == true' >/dev/null 2>&1 || {
    echo "Cloudflare API error:" >&2
    jq '.errors' >&2 2>/dev/null || cat >&2
    exit 1
  }
}

# ── Resolve zone id ───────────────────────────────────────────────────────────
ZONE_ID="${CF_ZONE_ID:-}"
if [ -z "$ZONE_ID" ]; then
  resp=$(cf GET "/zones?name=$DOMAIN&status=active")
  ZONE_ID=$(echo "$resp" | jq -r '.result[0].id // empty')
  [ -n "$ZONE_ID" ] || { echo "Could not resolve zone for $DOMAIN. Set CF_ZONE_ID." >&2; echo "$resp" | jq '.errors' >&2; exit 1; }
fi
echo "Zone: $DOMAIN ($ZONE_ID)"

# ── Build the skip rule ───────────────────────────────────────────────────────
ua_expr=""
for n in "${UA_NEEDLES[@]}"; do
  ua_expr+="(http.user_agent contains \"$n\") or "
done
EXPR="${ua_expr}(starts_with(http.request.uri.path, \"/llms\")) or (starts_with(http.request.uri.path, \"/context/\")) or (starts_with(http.request.uri.path, \"/r/\")) or (http.request.uri.path eq \"/registry.json\")"

RULE_JSON=$(jq -n --arg expr "$EXPR" --arg desc "$RULE_TAG" '{
  action: "skip",
  expression: $expr,
  description: $desc,
  enabled: true,
  action_parameters: {
    phases: ["http_ratelimit", "http_request_firewall_managed"],
    products: ["bic", "hot", "securityLevel", "uaBlock", "waf", "zoneLockdown", "rateLimit"]
  }
}')

if [ "$DRY_RUN" = 1 ]; then
  echo "[dry-run] Would ensure WAF skip rule ($RULE_TAG) in phase $PHASE:"
  echo "$RULE_JSON" | jq .
  [ "$DISABLE_BOT_FIGHT" = 1 ] && echo "[dry-run] Would set Bot Fight Mode: fight_mode=false"
  echo "[dry-run] No changes made."
  exit 0
fi

# ── Bot Fight Mode (opt-in) ───────────────────────────────────────────────────
if [ "$DISABLE_BOT_FIGHT" = 1 ]; then
  echo "Disabling Bot Fight Mode (fight_mode=false)…"
  cf PUT "/zones/$ZONE_ID/bot_management" '{"fight_mode":false}' | cf_ok
  echo "  done."
fi

# ── Ensure the custom-firewall entrypoint ruleset exists ──────────────────────
entry=$(cf GET "/zones/$ZONE_ID/rulesets/phases/$PHASE/entrypoint")
if echo "$entry" | jq -e '.success == true' >/dev/null 2>&1; then
  RULESET_ID=$(echo "$entry" | jq -r '.result.id')
  EXISTING_RULE_ID=$(echo "$entry" | jq -r --arg t "$RULE_TAG" '.result.rules[]? | select(.description == $t) | .id' | head -n1)
else
  # No custom phase ruleset yet — create it with our rule as the first entry.
  echo "No $PHASE entrypoint ruleset — creating one."
  created=$(cf PUT "/zones/$ZONE_ID/rulesets/phases/$PHASE/entrypoint" \
    "$(jq -n --argjson rule "$RULE_JSON" '{rules: [$rule]}')")
  echo "$created" | cf_ok
  echo "Created ruleset with AI-crawler skip rule. Verifying…"
  verify || true
  exit 0
fi

# ── Append or update our single tagged rule ───────────────────────────────────
if [ -n "${EXISTING_RULE_ID:-}" ]; then
  echo "Updating existing skip rule ($EXISTING_RULE_ID)…"
  cf PATCH "/zones/$ZONE_ID/rulesets/$RULESET_ID/rules/$EXISTING_RULE_ID" "$RULE_JSON" | cf_ok
else
  echo "Appending skip rule to ruleset $RULESET_ID…"
  cf POST "/zones/$ZONE_ID/rulesets/$RULESET_ID/rules" "$RULE_JSON" | cf_ok
fi
echo "WAF rule in place."

echo
verify || true
echo
echo "Note: order the '$RULE_TAG' rule FIRST in Security → WAF → Custom rules so it"
echo "runs before any challenge rule. See docs/CLOUDFLARE-AI-ACCESS.md."
