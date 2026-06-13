---
id: spec-color-usage
title: Color Usage
---

# Color Usage

cascade uses a three-level token system for color. AI agents and component authors must use semantic tokens, never primitive color values.

## Token levels

- **Primitive** (`--cascivo-blue-500`, `--cascivo-gray-200`): raw color values. Never reference directly in components.
- **Semantic** (`--cascivo-color-accent`, `--cascivo-color-border`, `--cascivo-color-destructive`): role-based. Use in components.
- **Component** (`--cascivo-radius-button`): component-specific overrides.

## Semantic roles

| Token                              | Purpose                                       |
| ---------------------------------- | --------------------------------------------- |
| `--cascivo-color-accent`           | Interactive elements, links, focus indicators |
| `--cascivo-color-foreground`       | Primary text                                  |
| `--cascivo-color-foreground-muted` | Secondary/muted text                          |
| `--cascivo-color-background`       | Page background                               |
| `--cascivo-color-surface`          | Card/panel surfaces                           |
| `--cascivo-color-border`           | Borders and dividers                          |
| `--cascivo-color-destructive`      | Error states, destructive actions             |
| `--cascivo-color-success`          | Success states                                |
| `--cascivo-color-warning`          | Warning states                                |
| `--cascivo-color-error`            | Error states                                  |

## Rules

**Strict:** Never hard-code color values in component CSS. Always use semantic tokens. This is enforced by `cascade audit --ai`.

**Strict:** Use the semantic layer (`--cascivo-color-*`) not the primitive layer (`--cascivo-blue-*`) in components.

**Flexible:** Which semantic token to use for a given purpose — choose the role that fits the meaning.

## Rationale

Semantic tokens decouple visual values from meaning. Themes (light, dark, warm, and custom themes) override only the semantic layer, so components automatically adapt. Hard-coded values break theming. See [CLAUDE.md](/CLAUDE.md) for the full token architecture.

## AI guidance

Consult `/tokens.catalog.json` for the closed set. Use `get_tokens({ layer: 'semantic' })` via MCP to list semantic tokens.
