---
id: spec-content-tone
title: Content Tone
---

# Content Tone

cascade components with user-visible chrome text (labels, aria strings, empty states) follow these voice guidelines.

## Voice rules

- **Imperative verb-first** for action labels: "Delete item", "Save changes", "Open menu"
- **Sentence case** — capitalize only the first word and proper nouns
- **Concise** — prefer ≤5 words for labels, ≤15 words for descriptions
- **No "Click here"** or other interaction-presumptive language (keyboard/touch users exist)
- **No ellipsis** in button labels (ellipsis implies incomplete action — avoid)

## i18n-first rule

All user-visible chrome strings in cascade components use `@cascade-ui/i18n`. The built-in catalog provides defaults; components accept a `labels` prop to override per-instance.

**Strict:** Component chrome strings (aria-labels, placeholder text, button labels, empty states) must come from the i18n catalog via `t(builtin.<component>.<key>)`. Never hard-code English strings in component source.

**Flexible:** Application-level copy (page titles, content copy) is outside cascade's scope — use whatever copy approach fits the application.

## AI guidance

When generating component code, pass user-visible strings via the `labels` prop, not as hard-coded children. The `cascade audit --ai --raw-strings` check warns when English prose appears as a literal text child on a component that expects i18n labels.
