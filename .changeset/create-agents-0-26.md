---
'cascivo': patch
---

`--example agent` builds again. `@cloudflare/ai-chat@0.12.1` needs `agents` 0.25 or later, but
the scaffold pinned `agents: ^0.24.0`, which in 0.x semver stops at 0.24.x, so the build
failed on missing exports. The agent and voice examples, and the `cloudflare-agent` starter,
now ask for `agents ^0.26.0` and `@cloudflare/ai-chat ^0.12.1`.
