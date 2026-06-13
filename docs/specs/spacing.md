---
id: spec-spacing
title: Spacing
---

# Spacing

cascade uses a fixed spacing scale defined as `--cascade-space-*` tokens. All spacing in components must reference these tokens rather than hard-coded pixel values.

## The scale

The scale follows a 4px base unit with named steps:

- `--cascade-space-0`: 0px
- `--cascade-space-1`: 0.25rem (4px)
- `--cascade-space-2`: 0.5rem (8px)
- `--cascade-space-3`: 0.75rem (12px)
- `--cascade-space-4`: 1rem (16px)
- `--cascade-space-5`: 1.25rem (20px)
- `--cascade-space-6`: 1.5rem (24px)
- `--cascade-space-8`: 2rem (32px)
- `--cascade-space-10`: 2.5rem (40px)
- `--cascade-space-12`: 3rem (48px)
- `--cascade-space-16`: 4rem (64px)

See [Token Catalog](/tokens.catalog.json) for the full set.

## Rules

**Strict:** Always use a named step from the scale. Never use arbitrary pixel or rem values.

**Flexible:** Which step to use for a given spacing context (padding, gap, margin) is flexible — choose the step that fits the layout and visual hierarchy.

## Rationale

A fixed scale ensures spatial consistency across the system. When every component uses the same steps, layouts align naturally without negotiation.

## AI guidance

When generating component code, select from the closed set of `--cascade-space-*` tokens. The `cascade audit --ai` command flags hard-coded spacing values that match a token in the catalog.
