# @cascivo/platform

## 0.0.3

### Patch Changes

- 3fcf3f1: Bump every published package so the next release run publishes the whole set.

  The 0.17.0 bump landed on `main` but never reached npm: the release job's build
  died inside `changesets/action` with `Failed to spawn process: Resource
temporarily unavailable (os error 11)` — an `EAGAIN` write to that action's
  stdout pipe, not a build failure. This changeset re-cuts the whole set on top of
  the workflow fix, so every package publishes from a release that runs its build
  in a runner-owned step.

- Updated dependencies [3fcf3f1]
  - @cascivo/tokens@0.5.10

## 0.0.2

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.
- Updated dependencies [66b251d]
  - @cascivo/tokens@0.5.9
