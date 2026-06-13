---
id: spec-exceptions
title: Historical Exceptions
---

# Historical Exceptions

This log records cascade's deliberate rule exceptions with rationale. Preserving the WHY prevents AI regression — future agents can see that an exception is intentional, not a mistake to fix.

## Exception format

Each entry includes:

- **id**: stable identifier
- **what**: what rule is broken and how
- **breaksRule**: which design rule this exception violates
- **why**: why the exception exists

## Exceptions

### EXC-001: Accordion uses grid-template-rows animation

**What:** `accordion.module.css` transitions `grid-template-rows: 0fr → 1fr` to animate height.

**Breaks rule:** "Never animate layout-affecting properties (height, max-height, etc.)"

**Why:** The `grid-template-rows` trick is the only CSS-only method to animate `height: auto` without JavaScript. It is technically a layout property but uses subgrid containment to avoid reflow costs associated with `height` transitions. The animation audit script explicitly allowlists this component for this reason.

---

_No other exceptions on record as of 2026-06-13._
