---
'cascivo': minor
---

`cascivo generate` writes code that compiles. Imports point at each component's registry directory (`DataTable` → `./data-table`, not `./datatable/datatable`), and sub-components share their owner's import. `--from @cascivo/react` imports everything from the prebuilt package instead. The input is parsed at the boundary: component, prop and state names must be identifiers, and text or attribute values containing quotes or JSX syntax are emitted as expressions, so a model-written view can no longer produce invalid or injected TSX.
