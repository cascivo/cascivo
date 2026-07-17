---
"@cascivo/react": patch
---

Component source hygiene so vendored/copied source passes a strict host ESLint
config (`@tanstack/eslint-config`) without adopters inheriting lint failures in
code they didn't write: inline type specifiers converted to top-level `import
type`, provably-unnecessary type assertions removed, `prefer-const` applied, and
stale `eslint-disable` directives dropped. Behavior-neutral — all component
tests pass unchanged. A `pnpm lint:host-strict` CI guard keeps it clean, and
docs/USING-WITH-STRICT-ESLINT.md documents scoping the remaining stylistic rules
off your components directory.
