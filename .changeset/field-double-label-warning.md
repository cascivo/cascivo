---
'@cascivo/react': patch
---

`Field` warns in dev when it and its child control both define a `label`.

Wrapping a labelled control (`<Field label="Email"><Input label="Email" /></Field>`)
renders two `<label>` elements for the same control. Dev builds now emit a one-time
`console.warn` naming the collision; production is unaffected. The fix is to omit the
child's `label` inside a `Field` — the `Field` owns it. Docs and the `Field`/`Input`/
`Textarea` manifests now call this out.
