---
'@cascivo/core': patch
---

Add an optional `importSymbols` field to `ComponentMeta` so a component whose display
`name` is not itself an export (compound/imperative modules — `SkipNav` ships
`SkipNavLink`/`SkipNavTarget`, `Toast` ships `ToastProvider`/`useToast`) renders a
correct `import { … }` line in its generated docs instead of a broken
`import { SkipNav }`. Also corrects the DataTable `rows` prop description (was a
pasted "Number of visible text rows.") and documents 26 previously-undocumented props
across the manifests, now enforced by the props-parity Direction-B gate.
