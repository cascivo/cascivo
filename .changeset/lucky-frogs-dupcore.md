---
'cascivo': minor
---

`doctor` now reports a duplicated `@cascivo/core`.

`@cascivo/react` and `@cascivo/charts` each depend on `@cascivo/core`, and the family
versions independently on 0.x. Non-overlapping ranges resolve a nested second copy — and
because cascivo's reactivity is a module-level signal registry, two copies means two
registries: a signal written through one is invisible to components subscribed through the
other. Nothing errors; handlers fire and the UI does not move, which is the hardest cascivo
symptom to diagnose. `doctor` now names it, and `doctor --ci` fails on it.
