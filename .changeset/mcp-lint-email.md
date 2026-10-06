---
'@cascivo/mcp': minor
---

`lint_email({ html, checkLinks?, cwd? })`: an agent can check a rendered email before it is
sent — unsupported client features and dead links — by running `cascivo email lint`, the same
check a human runs. Needs `@cascivo/email` installed in `cwd`.
