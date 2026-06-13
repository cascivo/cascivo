# Cascivo Claude Code Skills

Claude Code skills for working with the cascivo design system.

## Available Skills

| Skill                  | File                                   | Purpose                                                                           |
| ---------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| `cascivo:add`          | `skills/cascivo-add/SKILL.md`          | Add components to your project — fuzzy name resolution, CLI, compile verification |
| `cascivo:design-page`  | `skills/cascivo-design-page/SKILL.md`  | Natural language → scaffold_view → validate_view → cascivo generate               |
| `cascivo:create-theme` | `skills/cascivo-create-theme/SKILL.md` | Brand colors → semantic token overrides → WCAG AA contrast check                  |
| `cascivo:extend`       | `skills/cascivo-extend/SKILL.md`       | Scaffold a new component following cascivo authoring rules (signals, CSS tokens)  |

## Installation

Add the `skills/` directory from this repository to your Claude Code skills path:

```json
// ~/.claude/settings.json
{
  "skills": ["/path/to/cascivo/skills"]
}
```

Or point at the individual skill directories if your tools support per-skill paths.

## Key design decisions

- **All skills read the registry at runtime** — no hardcoded component lists. They fetch `registry.json` or `/llms/*.md` files so they always reflect the current component set.
- **cascivo:create-theme** verifies WCAG AA contrast via `scripts/quality/contrast-check.ts` — not by assertion.
- **cascivo:design-page** uses MCP `scaffold_view` → `validate_view` → `cascivo generate` rather than generating JSX directly, which keeps the output schema-valid.
- **cascivo:extend** fetches a reference component's source files from the registry to copy the four-file pattern.

## Agent endpoints

| URL               | Contents                                                |
| ----------------- | ------------------------------------------------------- |
| `/llms.txt`       | Project overview, authoring rules, full component index |
| `/llms/<name>.md` | Per-component: props table, examples, tokens, a11y      |
| `/registry.json`  | Machine-readable registry (CLI + MCP + docs source)     |
| `/view.v1.json`   | JSON Schema for cascivo view configs                    |

Generate the llms.txt and per-component markdown files:

```bash
pnpm llms:generate
```
