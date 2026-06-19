---
'cascivo': patch
---

Fix `cascivo list`/`add` 404s: the default registry index now points at the
canonical hosted URL `https://cascivo.com/registry.json` instead of a branch's
GitHub raw URL (which 404s for unauthenticated/private-repo requests). Matches
the registry URL already documented in `llms.txt`. Override with the
`registry` field in `cascivo.config.*` or `CASCIVO_REGISTRY` as before.
