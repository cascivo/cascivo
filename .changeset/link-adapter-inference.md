---
'@cascivo/core': patch
'@cascivo/react': patch
---

`setLinkComponent` now infers `LinkComponentProps` for an inline adapter.

An inline router adapter like `setLinkComponent(({ href, ...rest }) => <Link to={href}
{...rest} />)` previously got no parameter types (the parameter was `ElementType`), so
`href` was untyped — the exact seam where a router integration is most error-prone. An
added overload contextually types an inline function adapter as `LinkComponentProps`, so
`href` is inferred with no annotation. Every existing call still compiles (`'a'`, a
Next.js `Link`, a class component) via the `ElementType` fallback overload.
