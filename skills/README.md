# Cascade Claude Code Skills

Claude Code skills for working with the cascade design system.

## Available Skills

| Skill | Purpose |
|---|---|
| `cascade:add` | Add a component to your project with customization guidance |
| `cascade:design-page` | Generate a page layout using cascade components |
| `cascade:create-theme` | Create a custom theme from your brand colors |
| `cascade:extend` | Extend or fork an existing component |

## Installation

Add the `skills/` directory from this repository to your Claude Code skills path:

```json
// ~/.claude/settings.json
{
  "skills": ["/path/to/cascade/skills"]
}
```

Skills are implemented in Plans 5–6 alongside the MCP server and CLI.
