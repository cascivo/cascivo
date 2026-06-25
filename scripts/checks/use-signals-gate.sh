#!/usr/bin/env bash
# Fails if a React-app component reads signal .value in render without useSignals().
# Heuristic: any .tsx under the React apps that contains `.value` AND `useSignal(`
# must also contain `useSignals()`. (Preact docs app excluded — natively reactive.)
set -euo pipefail
fail=0
for f in $(grep -rl --include='*.tsx' 'useSignal(' apps/site/src apps/examples apps/bench 2>/dev/null); do
  if grep -q '\.value' "$f" && ! grep -q 'useSignals()' "$f"; then
    echo "MISSING useSignals(): $f"
    fail=1
  fi
done
exit $fail
