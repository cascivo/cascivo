---
'cascivo': minor
---

`cascivo create --framework cloudflare --auth oauth` scaffolds GitHub and Google sign-in on
`/account`, and `--auth email,oauth` puts it beside emailed sign-in links. Each provider is
offered once its client id and secret are set (`.dev.vars` locally, `wrangler secret put`
deployed); `AUTH_SECRET` seals the sign-in state. A failed sign-in comes back to `/account`
with the reason. As with `--auth email`, every API write needs a signed-in user, and
`--example checkout` adds `/billing`; an account without an email gets Stripe's checkout asking
for one.
