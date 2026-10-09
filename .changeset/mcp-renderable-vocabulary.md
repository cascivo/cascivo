---
'@cascivo/mcp': minor
---

The view tools now agree with the renderer. `get_view_grammar`, `scaffold_view` and `validate_view` offer only the components `<CascivoView>` can draw; before, they accepted all 214 registry names, and a "valid" view could render as nothing. A real component the renderer cannot draw is reported as such, and `validate_view` takes `target: "tsx"` for a view that `cascivo generate` turns into source, where any copied component is allowed. `GridItem` and `RadioCardGroup` now validate.

The agent surface is smaller:

- `get_view_grammar` returns the prompt once (12.7 KB unscoped, down from 92 KB). `detail: true` adds the JSON vocabulary.
- `get_component` takes `compact: true` (props, one example, a11y).
- `create_app`'s setup notes for examples and sign-in come back with its result rather than riding in the tool description on every turn.

`create_app` accepts every first-party theme and a `template`. `add_to_project` takes `names` and installs them in one CLI call. Names that would be read as a CLI flag are refused.
