---
'cascivo': minor
'@cascivo/mcp': patch
---

`cascivo create --framework cloudflare --example newsletter`: a newsletter sent through Amazon
SES. Readers sign up with double opt-in (a confirmation link, valid a day, resent at most every
ten minutes). `/newsletter/send` writes an issue in Markdown, previews it as rendered by
`@cascivo/email`, and queues it for every confirmed reader. A Queue consumer sends each copy
through `@cascivo/app/ses` with its own unsubscribe link and one-click `List-Unsubscribe`
headers, and records it, so a retried message never mails anyone twice. Bounces and complaints
arrive from SNS, are signature-checked, and suppress the address. The composer is guarded by
`NEWSLETTER_KEY`. In `vite dev` with no AWS credentials, emails are logged and the sign-up page
shows the confirmation link. With `--example live`, the two queues share one `queues` block and
one handler. The MCP `create_app` tool accepts the new example.
