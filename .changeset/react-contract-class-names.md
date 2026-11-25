---
'@cascivo/react': minor
---

Components now render the unhashed contract class names from `@cascivo/css` (`cv-button-button`, `cv-button-label`) instead of build hashes (`_button_1r5fv_83`). Rules, nesting and specificity are unchanged, so nothing looks different. Hashed names were never API; if you targeted one, use the `cv-*` class listed in `@cascivo/css/contract.json` or a `data-cascivo-*` style hook.
