---
'cascivo': patch
---

Internal: `pnpm framework:check` builds `cascivo create` output from packed tarballs.

The Astro CSS fix was verified only against a `workspace:*` example app, which Vite never
externalizes — so it passed while a real npm install still rendered unstyled. This canary
packs the tarballs, runs the real scaffolder for each framework, installs outside the
monorepo, builds, and asserts the emitted HTML's cascivo classes have rules. Each arm also
breaks its own wiring on purpose and requires the check to fail.

No user-facing change; it guards the config `create --framework astro` emits.
