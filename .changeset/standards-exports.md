---
'@cascivo/tokens': minor
---

The tokens ship as W3C Design Tokens (DTCG 2025.10) in `@cascivo/tokens/dtcg/`:
`cascivo.tokens.json` (semantic tokens kept as aliases of the primitives), one
`themes/<theme>.tokens.json` per first-party theme, and `cascivo.resolver.json`, which
selects a theme through a `theme` modifier. Figma variables, Tokens Studio, Style Dictionary
and Terrazzo can load them directly. Values DTCG cannot express (`calc()`, `em`) are listed
under `$extensions["com.cascivo"].notExported`.
