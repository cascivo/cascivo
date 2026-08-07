# `lint:host-eslint` — the adopter's real toolchain

This directory runs **real ESLint**, with the plugins an adopter actually installs, over
every file `cascivo add` copies into their project.

## Why a second lint guard exists

`pnpm lint:host-strict` (the sibling directory) was written for exactly this job. It runs
**oxlint**, which does not implement the React-Compiler-backed `react-hooks/refs`,
`react-hooks/purity`, or `react-hooks/static-components`. So it covers the _intersection_ of
two toolchains and is structurally blind to the difference.

On 2026-08-06 an adopter reported 13 ESLint errors in vendored source. Running the real
toolchain here found **117**, in five classes, none of which oxlint can express. A
re-implementation can only ever cover the intersection, and the gap is invisible from inside
it. This is Mechanism F in [`docs/internal/feedback/README.md`](../../../../docs/internal/feedback/README.md).

Keep both: oxlint is fast and offline for the classes it does cover; this one is the
authority.

## What it asserts

- **Zero errors** over `packages/components/src` under `eslint.config.js` — a TanStack Start
  scaffold's config with `@cascivo/eslint-config` spread last, exactly as the docs instruct.
- **The run was not vacuous.** ESLint 10 silently _skips_ files outside a flat config's base
  path, with a warning rather than an error. The first version of this guard reported
  "298 files, 0 errors" while linting nothing at all. `run.mjs` now fails on any skipped file
  and on any parser error, and `fixture.test.js` asserts the sample is really linted.
- **Every scope-off is load-bearing.** `fixture.test.js` lints the sample _without_
  `@cascivo/eslint-config` and asserts each rule the fragment turns off genuinely fires. A
  scope-off with nothing behind it is dead config that reads as coverage, and gets deleted.
- **`eslint.config.js` is the single owner of the published snippet.** The block in
  `docs/USING-WITH-STRICT-ESLINT.md` is compared against it byte for byte, and no surface may
  name `configs['recommended-latest']` (the legacy eslintrc shape, which applies nothing in a
  flat config) without the `.flat` form.

## Running it

```sh
pnpm lint:host-eslint                       # the gate
pnpm --filter @cascivo/host-lint-fixture test # the fixture's own tests
```

Both need `pnpm install` to have run — this directory is a workspace package so its pinned
toolchain installs with everything else. The versions are pinned exactly on purpose: a
floating range turns a correctness gate into a flake generator, and a plugin minor can change
which rules fire.

## When a new error class appears

Do not reach for a scope-off first. Triage it:

1. **Is it a real defect in cascivo's source?** Fix the source. (`react-hooks/purity` caught
   a genuine render-phase `Date.now()` this way.)
2. **Is it a rule cascivo's documented house style contradicts?** Scope it off in
   `@cascivo/eslint-config` with a written rationale naming the rule and what turning it off
   costs. `react-hooks/refs` is the model: `CLAUDE.md` prescribes the render-phase ref write.
3. **Is it a false positive on a specific line?** A local `eslint-disable-next-line` with a
   `--` reason. Keep it to the line, not the file.

Never add a scope-off without a rationale a reader can check. The whole reason this fixture
exists is that the previous list was authored from memory and covered less than it claimed.
