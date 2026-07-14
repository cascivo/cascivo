---
'@cascivo/tokens': minor
'@cascivo/themes': minor
'@cascivo/react': minor
'cascivo': minor
---

Layer order: add a declared `cascivo.blocks` slot to the canonical `@layer`
statement (between `cascivo.theme` and `cascivo.override`), and fold the
`@function` helpers from the undeclared `cascivo.functions` layer into
`cascivo.tokens`.

Previously the shipped composite blocks (`@layer cascivo.blocks.<name>`) and the
`@function` helpers used layer names that no order statement declared, so they were
appended **above** `cascivo.override` and silently beat the consumer escape hatch.
They now sit in their intended slots: blocks just above themes, functions with the
tokens.

Migration: if you relied on a shipped block's CSS beating your
`@layer cascivo.override { … }` rules, that was the bug this fixes — move those
overrides to win as intended. The `cascivo create` scaffold and example apps now
emit the 7-layer canonical statement.
