# Cascivo Claude Code Skills

Claude Code skills for working with the cascivo design system.

## Available Skills

| Skill                         | File                                          | Purpose                                                                                |
| ----------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------- |
| `cascivo-add`                 | `skills/cascivo-add/SKILL.md`                 | Add components to your project — fuzzy name resolution, CLI, compile verification      |
| `cascivo-add-template`        | `skills/cascivo-add-template/SKILL.md`        | Install a marketplace template (whole-page composition) — browse, install, verify      |
| `cascivo-design-page`         | `skills/cascivo-design-page/SKILL.md`         | Natural language → scaffold_view → validate_view → cascivo generate                    |
| `cascivo-create-theme`        | `skills/cascivo-create-theme/SKILL.md`        | Brand colors → semantic token overrides → WCAG AA contrast check                       |
| `cascivo-extend`              | `skills/cascivo-extend/SKILL.md`              | Scaffold a new component following cascivo authoring rules (signals, CSS tokens)       |
| `cascivo-email`               | `skills/cascivo-email/SKILL.md`               | Build a transactional email — table-based primitives, themed tokens, byte budget       |
| `cascivo-migrate-from-shadcn` | `skills/cascivo-migrate-from-shadcn/SKILL.md` | Move a shadcn/ui app to cascivo one file at a time, each file proven with `audit --ai` |

## Installation

One command, with the open [Agent Skills](https://agentskills.io) CLI — it detects Claude
Code, Cursor, Codex and the other supported agents and installs into each:

```sh
npx skills add cascivo/cascivo                      # pick from the list
npx skills add cascivo/cascivo --skill cascivo-add  # one skill
npx skills add cascivo/cascivo --skill '*' -y       # all of them, no prompts
```

Or point your agent at this directory by hand, e.g. for Claude Code:

```json
// ~/.claude/settings.json
{
  "skills": ["/path/to/cascivo/skills"]
}
```

The skills drive the MCP server, so install that too — `npx cascivo mcp init` writes the
client config for you.

## Key design decisions

- **All skills read the registry at runtime** — no hardcoded component lists. They fetch `registry.json` or `/llms/*.md` files so they always reflect the current component set.
- **cascivo-create-theme** verifies WCAG AA contrast via `scripts/quality/contrast-check.ts` — not by assertion.
- **cascivo-design-page** uses MCP `scaffold_view` → `validate_view` → `cascivo generate` rather than generating JSX directly, which keeps the output schema-valid.
- **cascivo-extend** fetches a reference component's source files from the registry to copy the four-file pattern.

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
