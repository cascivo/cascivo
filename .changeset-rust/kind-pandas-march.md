---
'cascivo-html': minor
---

Add the `contract` module: generated `cv-<unit>-<local>` class consts and `data-*` value enums per unit (from `@cascivo/css` contract.json). Emitters use them instead of class literals, and components whose anatomy says `emit: 'auto'` (button) get generated emitters. Output is unchanged.
