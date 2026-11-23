---
'cascivo-html': minor
---

CSP-safe output and static-page fixes (#305). `Options::inline_styles = false` (CLI `--no-inline-styles`) replaces every `style=""` with a `data-cv-style` hook whose rules come from `Fragment::styles` and `style_rules`. `Options::script_src` (CLI `--script-src`, `cascivo-html script`) references client scripts instead of inlining them; `script_names` and `script_bundle` give the source. `\,`, `\|` and `\\` escape commas, bars and backslashes in row cells. `button href=…` renders a link styled as a button. `alert` and `notification` default to `role="note"`; `role=status|alert` opts into a live region.
