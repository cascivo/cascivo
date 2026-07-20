#!/usr/bin/env bash
#
# Deployed-docs freshness probe (docs freshness invariant, layers 3 + 4).
#
# Asserts that a live docs host serves content generated from THIS checkout's
# registry.json — i.e. the deploy actually propagated and the host is bound to the
# current site. Used two ways:
#   - post-deploy (cf-pages.yml verify-site job): confirm the just-shipped bytes are live.
#   - scheduled (docs-freshness.yml): catch out-of-band rot (domain rebind, CDN stale,
#     expired deploy) between deploys.
#
# Usage:  scripts/checks/deployed-freshness.sh [HOST ...]
#   HOST defaults to the two production hosts. Exits non-zero on the first failure.
#
# Env:
#   FRESHNESS_RETRIES   attempts per URL (default 10) — absorbs CDN propagation.
#   FRESHNESS_SLEEP     seconds between attempts (default 15).
#   FRESHNESS_NO_CACHE  if set, also send a cache-busting request (default: on).

set -uo pipefail

HOSTS=("$@")
if [[ ${#HOSTS[@]} -eq 0 ]]; then
  # cascivo.com is the single canonical host. docs.cascivo.com is retired (301 →
  # cascivo.com); pass it explicitly if you want to probe the redirect separately.
  HOSTS=("https://cascivo.com")
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION="$(node -e "process.stdout.write(require('$ROOT/registry.json').version)")"
if [[ -z "$VERSION" ]]; then
  echo "::error::could not read registry.json version"
  exit 2
fi
echo "Expecting served docs to be generated from registry v$VERSION"

RETRIES="${FRESHNESS_RETRIES:-10}"
SLEEP="${FRESHNESS_SLEEP:-15}"
FAILED=0

# Fetch a URL (with retries + cache-busting) and echo the body; return 1 on HTTP failure.
fetch() {
  local url="$1"
  local body
  for ((i = 1; i <= RETRIES; i++)); do
    body="$(curl -fsSL -H 'Cache-Control: no-cache' "${url}?_cb=$i" 2>/dev/null)" && {
      printf '%s' "$body"
      return 0
    }
    sleep "$SLEEP"
  done
  return 1
}

# assert_contains URL NEEDLE...  — fetch URL once, assert every needle is present.
assert_contains() {
  local url="$1"
  shift
  local body
  if ! body="$(fetch "$url")"; then
    echo "::error::$url did not return 200 after $RETRIES attempts"
    FAILED=1
    return
  fi
  local needle
  for needle in "$@"; do
    if ! grep -qF -- "$needle" <<<"$body"; then
      echo "::error::$url is missing expected content: '$needle' (stale deploy or wrong host binding?)"
      FAILED=1
    fi
  done
}

# assert_404 URL — a guessed-name miss must be a real 404, not the SPA shell.
assert_404() {
  local url="$1"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url")"
  if [[ "$code" != "404" ]]; then
    echo "::error::$url returned HTTP $code, expected 404 (machine-readable 404 rules not live on this host?)"
    FAILED=1
  fi
}

for HOST in "${HOSTS[@]}"; do
  echo "── Probing $HOST ──"
  # llms.txt carries the top-of-file version stamp.
  assert_contains "$HOST/llms.txt" "registry v$VERSION"
  # Canary files chosen from the 2026-07-18 report: stat.md was stale (missing `visual`);
  # area-chart is namespaced (guessed flat name 404s); both must serve current content.
  assert_contains "$HOST/llms/stat.md" '`visual`' "registry v$VERSION"
  assert_contains "$HOST/llms/chart/area-chart.md" '`series`'
  # Fetchable getting-started markdown.
  assert_contains "$HOST/docs/getting-started.md" "registry v$VERSION"
  # A guessed-wrong name is a real 404 with the hint body (not the HTML SPA shell).
  assert_404 "$HOST/llms/definitely-not-a-component.md"
  assert_contains "$HOST/llms/definitely-not-a-component.md" "no cascivo doc at this path"
done

# Retired subdomain must 301 to the canonical host (not serve stale content). Skippable
# via FRESHNESS_SKIP_REDIRECT=1 while the DNS/Cloudflare redirect is still being set up.
if [[ -z "${FRESHNESS_SKIP_REDIRECT:-}" ]]; then
  echo "── Checking docs.cascivo.com redirects to the canonical host ──"
  loc="$(curl -s -o /dev/null -w '%{redirect_url}' "https://docs.cascivo.com/llms.txt")"
  if [[ "$loc" != https://cascivo.com/* ]]; then
    echo "::error::https://docs.cascivo.com/llms.txt does not 301 to cascivo.com (got: '${loc:-<none>}'). See docs/internal/OPS-HOSTS.md."
    FAILED=1
  fi
fi

if [[ "$FAILED" -ne 0 ]]; then
  echo "::error::deployed-docs freshness check FAILED — production is not serving registry v$VERSION"
  exit 1
fi
echo "All hosts serve registry v$VERSION. Docs are fresh."
