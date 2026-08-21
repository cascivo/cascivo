---
'@cascivo/react': minor
'@cascivo/core': minor
'@cascivo/mcp': minor
'cascivo': minor
---

One accessible-name spelling that always works, plus foreign component names that resolve.

`ariaLabel` and `label` are now two spellings of one idea: every component that takes an
invisible accessible name takes both, enforced by a new guard rather than documented and
hoped for. `<OverflowMenu label=…>`, `<SideNav label=…>`, `<Switcher ariaLabel=…>` and
`<CommandMenu ariaLabel=…>` all compile. `Fab` joins `IconButton` in typing its required
name as an XOR of the two.

`DataTable` gains `ariaLabel`, so a table without a visible `title` can be named at all; it
dev-warns when it has neither. `Field` accepts `hint` as an alias of `description` — the name
the eight form controls already use for the same text — and warns when a Field and its child
control both supply it.

`packages/components/aliases.json` maps the names peer systems use onto cascivo components:
`cascivo add switch` installs `toggle` and says so, the MCP `get_component("Dialog")` returns
`modal`, `llms.txt` lists the mappings, and `import { Switch } from '@cascivo/react'`
compiles.

`PropMeta` gains `nameVisibility`, which every `label`/`ariaLabel` prop must declare — the
generated prop tables derive "Rendered on screen." / "Not rendered — screen readers only."
from it, so a description can no longer contradict the behaviour.
