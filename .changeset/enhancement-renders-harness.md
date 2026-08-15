---
'@cascivo/charts': patch
---

`Stream` is `clientJs: 'enhancement'`, not `'required'`.

It was labelled `required` on the theory that a live feed frozen at one server-rendered frame
is not what the component is for. Rendering it disproves that: the server HTML carries the
SVG _and_ the accessible data table with every value, exactly like every other chart. The
"live" part is the app pushing data through `createStreamBuffer` — the app's JavaScript, not
the component's.

Caught by `packages/react/src/enhancement-renders.test.tsx`, which now server-renders every
`clientJs: 'enhancement'` component and asserts the server HTML is actually usable.
