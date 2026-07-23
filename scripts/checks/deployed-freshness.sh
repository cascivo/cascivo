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

# assert_absent URL NEEDLE... — fetch URL once, assert NONE of the needles is present.
assert_absent() {
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
    if grep -qF -- "$needle" <<<"$body"; then
      echo "::error::$url unexpectedly contains '$needle' (stale deploy?)"
      FAILED=1
    fi
  done
}

# assert_http_ok URL — assert the URL returns HTTP 200 (retries for CDN propagation).
# Used for SPA routes whose body is the app shell (no stable prerendered needle), where
# the fix under test is "resolves instead of 404". Follows redirects (-L): a prerendered
# directory-index route 308s to its trailing-slash form before serving 200, and that
# resolves fine for any browser/agent — matches the -fsSL used by fetch() above.
assert_http_ok() {
  local url="$1"
  local i code
  for ((i = 1; i <= RETRIES; i++)); do
    code="$(curl -sL -o /dev/null -w '%{http_code}' "${url}?_cb=$i")"
    [[ "$code" == "200" ]] && return 0
    sleep "$SLEEP"
  done
  echo "::error::$url did not return HTTP 200 (last ${code:-none}) after $RETRIES attempts"
  FAILED=1
}

# assert_404_body URL NEEDLE... — a guessed-name miss must return HTTP 404 AND a body
# containing every needle (the machine-readable hint, not the SPA HTML shell). Retries
# to absorb CDN propagation. Unlike assert_contains this must NOT use `curl -f`, which
# aborts on 404 before the body is read — so it reads status and body separately.
assert_404_body() {
  local url="$1"
  shift
  local i code body needle ok
  for ((i = 1; i <= RETRIES; i++)); do
    code="$(curl -s -o /dev/null -w '%{http_code}' "${url}?_cb=$i")"
    body="$(curl -s -H 'Cache-Control: no-cache' "${url}?_cb=$i")"
    ok=1
    [[ "$code" == "404" ]] || ok=0
    for needle in "$@"; do
      grep -qF -- "$needle" <<<"$body" || ok=0
    done
    if [[ "$ok" -eq 1 ]]; then
      return 0
    fi
    sleep "$SLEEP"
  done
  echo "::error::$url did not serve a machine-readable 404 (last HTTP ${code:-none}) with expected body after $RETRIES attempts"
  FAILED=1
}

for HOST in "${HOSTS[@]}"; do
  echo "── Probing $HOST ──"
  # llms.txt carries the top-of-file version stamp.
  assert_contains "$HOST/llms.txt" "registry v$VERSION"
  # Canary files chosen from the 2026-07-18 report: stat.md was stale (missing `visual`);
  # area-chart is namespaced (guessed flat name 404s); both must serve current content.
  assert_contains "$HOST/llms/stat.md" '`visual`' "registry v$VERSION"
  assert_contains "$HOST/llms/chart/area-chart.md" '`series`'
  # A second per-component API canary + a theme surface (2026-07-20 report: the adopter
  # couldn't find per-component/per-theme reference docs on the deployed host).
  assert_contains "$HOST/llms/data-table.md" '`searchable`'
  assert_contains "$HOST/docs/theming.md" 'data-theme'
  # Fetchable getting-started markdown — must carry the SSR call-out (noExternal) and the
  # aggregate-stylesheet story (styles.css), the two things this adopter went looking for.
  # Plus the 2026-07-22 report's surfaces: the .css-suffixed theme import (TS2882-safe) and
  # the useTheme tuple shape (adopters kept guessing next-themes' object destructuring).
  assert_contains "$HOST/docs/getting-started.md" \
    "registry v$VERSION" "noExternal" "styles.css" "themes/all.css" "[theme, setTheme]"
  # The SSR recipe must be reachable, carry the hydration guidance, and the 0.10
  # version boundary (zero-config SSR via the node export condition, WS-A).
  assert_contains "$HOST/docs/using-with-vite-ssr.md" \
    "noExternal" "suppressHydrationWarning" "0.10"
  # The layout llms doc is copy-paste-only and must NOT advertise a phantom
  # `@cascivo/layout/…` package import (2026-07-22 report finding #6, stale-deploy class).
  assert_contains "$HOST/llms/layout/dashboard-layout.md" "Copy-paste only"
  assert_absent "$HOST/llms/layout/dashboard-layout.md" "@cascivo/layout/"
  # The most-guessable components URL must resolve, not 404 (2026-07-22 report finding #10).
  assert_http_ok "$HOST/docs/components"
  # A guessed-wrong name must be a real 404 whose BODY is the machine-readable hint
  # (llms-404.md / r-404.json), not the HTML SPA shell — an agent that gets a 200 (or
  # an HTML 404) would read the shell as if it were the doc. Served by the Pages
  # Function in apps/site/functions/, since Cloudflare `_redirects` can't set a 404
  # status. This is the "empty shell" symptom the 2026-07-18 report hit.
  assert_404_body "$HOST/llms/definitely-not-a-component.md" "no cascivo doc at this path"
  assert_404_body "$HOST/r/definitely-not-a-component.json" "not_found"
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
