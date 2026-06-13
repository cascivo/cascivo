---
id: spec-decision-hierarchy
title: Decision Hierarchy
---

# Decision Hierarchy

When guidance conflicts, resolve it in this order:

1. **Accessibility (WCAG 2.1 AA)** — non-negotiable. A visually pleasing solution that fails accessibility is wrong.
2. **Token contract** — visual values must resolve to `--cascivo-*` tokens. No hard-coding.
3. **Semantic correctness** — use the right element (`<button>` for actions, `<a>` for navigation).
4. **Component intent** — use components for their designed purpose (Toast for transient, Alert for persistent).
5. **Brand/visual preference** — choose spacing steps, sizing, and layout that serve the use case.
6. **Convenience** — never trade correctness for brevity.

## Examples

- A design calls for a purple button. Purple is not a cascade color token. **Resolution:** use the theme's accent color or add a component-level CSS override using a semantic token, not a hard-coded purple value.
- An agent uses `<Button>` to navigate to another page. **Resolution:** use `<a>` — accessibility (#1) and semantic correctness (#3) both require it.
- A required a11y attribute makes a component prop mandatory. **Resolution:** the prop is required; an AI agent omitting it fails rule #1.

## Rationale

Without an explicit hierarchy, conflicting signals lead to inconsistent decisions. The hierarchy embeds cascade's values: accessibility before aesthetics, semantics before shortcuts.
