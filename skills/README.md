# Cascade Claude Code Skills

Claude Code skills for working with the cascade design system.

## Available Skills

| Skill                  | File                                   | Purpose                                                                           |
| ---------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| `cascade:add`          | `skills/cascade-add/SKILL.md`          | Add components to your project — fuzzy name resolution, CLI, compile verification |
| `cascade:design-page`  | `skills/cascade-design-page/SKILL.md`  | Natural language → scaffold_view → validate_view → cascade generate               |
| `cascade:create-theme` | `skills/cascade-create-theme/SKILL.md` | Brand colors → semantic token overrides → WCAG AA contrast check                  |
| `cascade:extend`       | `skills/cascade-extend/SKILL.md`       | Scaffold a new component following cascade authoring rules (signals, CSS tokens)  |

## Installation

Add the `skills/` directory from this repository to your Claude Code skills path:

```json
// ~/.claude/settings.json
{
  "skills": ["/path/to/cascade/skills"]
}
```

Or point at the individual skill directories if your tools support per-skill paths.

## Key design decisions

- **All skills read the registry at runtime** — no hardcoded component lists. They fetch `registry.json` or `/llms/*.md` files so they always reflect the current component set.
- **cascade:create-theme** verifies WCAG AA contrast via `scripts/quality/contrast-check.ts` — not by assertion.
- **cascade:design-page** uses MCP `scaffold_view` → `validate_view` → `cascade generate` rather than generating JSX directly, which keeps the output schema-valid.
- **cascade:extend** fetches a reference component's source files from the registry to copy the four-file pattern.

## Agent endpoints

| URL               | Contents                                                |
| ----------------- | ------------------------------------------------------- |
| `/llms.txt`       | Project overview, authoring rules, full component index |
| `/llms/<name>.md` | Per-component: props table, examples, tokens, a11y      |
| `/registry.json`  | Machine-readable registry (CLI + MCP + docs source)     |
| `/view.v1.json`   | JSON Schema for cascade view configs                    |

Generate the llms.txt and per-component markdown files:

```bash
pnpm llms:generate
```
