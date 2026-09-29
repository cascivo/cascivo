---
'@cascivo/app': minor
---

`@cascivo/app/flags`: feature flags evaluated in the Worker, parsed in the browser.

- `defineFlags({ newCheckout: false, theme: themeFlag() })` is one definition shared by
  both sides. Each flag's default is also its type.
- `flags.evaluate(env.FLAGS, context)` evaluates every flag against Cloudflare Flagship's
  binding, or any evaluator with the same four getters.
- `flags.parse` checks the result that reaches the browser. Use it as an endpoint's
  `output`.
- A flag that fails, is missing or has the wrong type keeps its default, on both sides.
- `objectFlag(default, parse)` declares an object-valued flag with its own parser.
- `themeFlag()` runs a theme experiment:
  - `parseThemeOverride` accepts a theme name and `--cascivo-*` tokens whose values cannot
    escape a declaration or load a URL.
  - `applyThemeOverride(element, override)` applies it and returns an undo.
