---
'@cascivo/docs': patch
'@cascivo/docspack': patch
---

Ship #235's docs surface, and make `cascivo-docs <topic>` fall back to a guide

#235 was released as `@cascivo/email` only, but two other published packages carry
part of that change and neither was named in a changeset — so the work is merged and
invisible to adopters, which is the failure mode `docs/RELEASING.md` calls a
correctness property rather than a preference.

Both packages build their payload from `apps/site/public/` at publish time, so a
version bump is the only way their content moves:

- **`@cascivo/docs`** copies that surface into `content/`. #235 added the
  `recipe-email` and `email-client-support` guides and gave `llms.txt` /
  `llms-full.txt` their first `@cascivo/email` section. Without a release,
  `npx @cascivo/docs guide recipe-email` still answers "no doc".
- **`@cascivo/docspack`** reshapes the same surface into its `.llms/` chunks, so
  `docspack ask` indexes the email package only from a published version.

`@cascivo/docs` also carries a CLI fix from #235: a bare topic now falls back to a
guide of the same slug, and an unresolved topic suggests near matches instead of
dead-ending. An adopter typed `cascivo-docs email` and got `no doc for "email"` while
`guide recipe-email` sat right there.

No API change in either package — the bump exists to move already-merged content.
