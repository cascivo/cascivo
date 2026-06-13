---
id: spec-color-usage
title: Color Usage
---

# Color Usage

cascade uses a three-level token system for color. AI agents and component authors must use semantic tokens, never primitive color values.

## Token levels

- **Primitive** (`--cascade-blue-500`, `--cascade-gray-200`): raw color values. Never reference directly in components.
- **Semantic** (`--cascade-color-accent`, `--cascade-color-border`, `--cascade-color-destructive`): role-based. Use in components.
- **Component** (`--cascade-radius-button`): component-specific overrides.

## Semantic roles

| Token                              | Purpose                                       |
| ---------------------------------- | --------------------------------------------- |
| `--cascade-color-accent`           | Interactive elements, links, focus indicators |
| `--cascade-color-foreground`       | Primary text                                  |
| `--cascade-color-foreground-muted` | Secondary/muted text                          |
| `--cascade-color-background`       | Page background                               |
| `--cascade-color-surface`          | Card/panel surfaces                           |
| `--cascade-color-border`           | Borders and dividers                          |
| `--cascade-color-destructive`      | Error states, destructive actions             |
| `--cascade-color-success`          | Success states                                |
| `--cascade-color-warning`          | Warning states                                |
| `--cascade-color-error`            | Error states                                  |

## Rules

**Strict:** Never hard-code color values in component CSS. Always use semantic tokens. This is enforced by `cascade audit --ai`.

**Strict:** Use the semantic layer (`--cascade-color-*`) not the primitive layer (`--cascade-blue-*`) in components.

**Flexible:** Which semantic token to use for a given purpose — choose the role that fits the meaning.

## Rationale

Semantic tokens decouple visual values from meaning. Themes (light, dark, warm, and custom themes) override only the semantic layer, so components automatically adapt. Hard-coded values break theming. See [CLAUDE.md](/CLAUDE.md) for the full token architecture.

## AI guidance

Consult `/tokens.catalog.json` for the closed set. Use `get_tokens({ layer: 'semantic' })` via MCP to list semantic tokens.
