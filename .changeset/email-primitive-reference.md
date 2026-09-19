---
'@cascivo/email': patch
'@cascivo/docs': patch
'@cascivo/docspack': patch
---

Email: a preview and a props table for every primitive, not just for the templates

The email target shipped twenty-two components and documented three templates. React Email
publishes a preview per component and it is the first place an adopter looks, so "which
pieces can I use, and what does each one look like" had no answer here short of reading
`src/components` — and an agent in that position hand-rolls a worse `<table>` rather than
reaching for `Row`/`Column`.

- **A primitive reference at `/docs/email/components`**, and the same content as one
  fetchable file at `/docs/email-primitives.md`. Every primitive gets its props, its
  defaults, and at least one worked example rendered as a real email document in four
  themes — the bytes an adopter would send, in an isolated iframe, not a screenshot.

- **Both surfaces are generated, from one copy of everything.** The props come off the
  TypeScript interfaces, so a prop cannot be added without appearing in the table. The
  snippet under each frame is printed from the very element tree that produced the frame,
  so a documented call cannot describe something the picture above it did not render. A
  gallery of examples and a printer replace the usual two-copies-that-drift arrangement.

- **`email:primitives:check` closes the gap that let this happen.** Email primitives carry
  no `.meta.ts`, so `meta-coverage` — the guard that stops a registry component shipping
  undocumented — never saw them. The new check is its analogue: a primitive exported from
  the package index and missing from the gallery, the reference or the previews fails the
  build.

- **The home page's email band gains an "All primitives" frame** — one message built from
  nearly every primitive, in all twelve themes, so the section answers "what is in the box"
  as well as "what does it look like".

- **Doc fixes found on the way.** `/docs/email` still claimed there is no `Markdown`
  component, which shipped in 0.3. `Heading` and `Style` had no summary at all. Four prop
  docstrings told adopters to put a rule in a `StyleBlock`, which is this package's own
  local import alias — the exported name is `Style`.
