---
name: factory
description: Run the cascade dark factory — generate, verify, and integrate the next queued component(s) from factory-backlog.json. Use when the user asks to run the factory, build queued components, or work the backlog. Runs entirely inside this Claude Code session (no API key, no headless claude -p).
---

# Cascade Dark Factory

You are the factory supervisor **and** the worker, running inside this Claude Code
session. There is no headless `claude -p`, no bash supervisor, and no Anthropic
API key. All state lives in `factory-backlog.json` and in git history, so any
future session can resume exactly where the last one stopped.

## State model

Each item in `factory-backlog.json` has:

- `status`: `pending` → `in-progress` → `review` → `done`, or `escalated`
- `milestone`: `null` → `scaffold` → `verify` → `integrate` → `finished`
- `attempts`: self-heal counter for the current `verify` milestone (cap 5)

`review` is the terminal state the factory produces: the component is built and
green, awaiting human sign-off. A human (or an explicit instruction) flips
`review` → `done`. `escalated` means self-heal gave up and a human is needed.

## Main loop

Repeat until no item has `status` of `pending` or `in-progress`:

1. **Select** the item with the lowest `priority` whose `status` is `pending`
   or `in-progress`. (`in-progress` means a previous session crashed mid-run —
   resume it at its recorded `milestone`.) If none, go to **Finish**.
2. **Claim** (only if `pending`): set `status = "in-progress"`, write the file,
   commit `factory: claim <name>`. This makes the claim visible to any other
   session before you do real work.
3. Run each milestone below that is not yet complete, in order. Commit after
   each so progress is never lost.
4. When milestones finish, set `status = "review"`, `milestone = "finished"`,
   commit `factory: <name> ready for review`, then return to step 1.

Use the Edit tool to update `factory-backlog.json` — do not shell out to `jq`.
Run `vp fmt factory-backlog.json` after edits so the commit stays clean.

## Milestone: scaffold

Read `packages/components/src/button/` for the canonical pattern and **follow
the Component Authoring Rules in `CLAUDE.md` Part 3 exactly** (signals not React
hooks; machines only for genuine internal state; visual states in CSS; no
`useEffect`/`useState`/`useContext`). For a simple display component, copy the
shape of `separator/` or `badge/`.

Create four files at `packages/components/src/<name>/`:

1. `<name>.tsx` — `'use client'`, typed props extending the right HTML attrs,
   `cn(styles[...], className)`, `data-variant`/`data-size`/`data-state` hooks.
2. `<name>.module.css` — `@layer cascade.component { }`, every value via
   `--cascivo-*` tokens, logical properties, `:has()`/`@container` where useful.
   **Motion is mandatory for open/close/enter/exit components**: CSS-only via
   `@starting-style` (+ `transition-behavior: allow-discrete` for top-layer or
   display-toggling elements), using the semantic motion tokens
   (`--cascivo-motion-enter/exit/emphasis`), animating only compositor-safe
   properties (`opacity`, `transform`/`translate`/`scale`). Never animate from
   JS. Reduced motion is handled globally by the tokens layer — do not add
   per-component `prefers-reduced-motion` rules unless opting _out_ (continuous
   indicators).
   User-visible strings (labels, aria-labels, empty states) must come from the
   `@cascade-ui/i18n` built-in catalog via `t(builtin...)` with a `labels` prop
   override — add new keys to `packages/i18n/src/builtin.ts` (en + de) as needed.
3. `<name>.meta.ts` — a `ComponentMeta` object (`import type` from
   `@cascade-ui/core`). Fill `props`, `tokens`, `accessibility`, `examples`,
   `tags` honestly from what you built. **Always include an `intent` block**;
   scaffold it with the placeholder below — the completeness check will fail
   until a human (or a later factory pass) authors the real content:

   ```ts
   intent: {
     // TODO: fill intent before merging — the completeness check will fail until this is authored
     whenToUse: ['TODO: describe when to use this component'],
     whenNotToUse: ['TODO: describe when NOT to use (what to use instead)'],
     antiPatterns: [],
     related: [],
     a11yRationale: 'TODO: explain why the a11y decisions (role, keyboard, aria) are what they are',
     flexibility: [
       { area: 'token names', level: 'strict', note: 'Visual props must resolve to --cascivo-* tokens' },
     ],
   },
   ```

4. `<name>.test.tsx` — vitest + `@testing-library/react`, covering render,
   each variant/size data attribute, and any documented behavior.

Set `milestone = "scaffold"`, commit `factory: scaffold <Name>`.

## Milestone: verify (the self-heal loop)

Run, from the repo root:

```
vp run @cascade-ui/components#test
vp check
```

- **Pass both:** set `milestone = "verify"`, commit `factory: <Name> passes verification`.
- **Fail:** read the output, fix the component (not the test, unless the test is
  wrong), increment `attempts`, and re-run. Repeat until green.
- **`attempts` reaches 5:** stop self-healing. Set `status = "escalated"`,
  commit `factory: escalate <Name> (verification failed after 5 attempts)`,
  and return to the main loop's step 1 to try the next item.

## Milestone: integrate

Wire the green component into the rest of the monorepo:

1. Add the export to `packages/components/package.json` `exports`:
   `"./<name>": "./src/<name>/<name>.tsx"` (keep the map formatted).
2. Add the prebuilt-distribution export to `packages/react/src/index.ts`:
   `export * from '../../components/src/<name>/<name>'`
3. Add a live demo to `apps/docs/src/demos.tsx` (`demos.<name> = () => ( … )`).
   The docs ComponentPage and sidebar are registry-driven and pick it up
   automatically.
4. Add `apps/storybook/stories/<Name>.stories.tsx` following the existing story
   pattern: every variant, every size, and an `Accessibility` story with
   `parameters: { a11y: { test: 'error' } }`.
5. Regenerate the registry: `pnpm registry:generate`.
6. Run the full gate: `vp check && vp run -r check && vp run -r test`. Fix any
   integration fallout (this also counts against the 5-attempt cap; escalate if
   exceeded).

Set `milestone = "integrate"`, commit `factory: integrate <Name>`.

## Finish

When the queue has no `pending`/`in-progress` items, post a short summary:
which components reached `review`, which `escalated`, and the next priority if
the queue is empty. Do **not** open a PR or push unless the user asked you to.

## Queueing new work

To add a component, append an item to `factory-backlog.json` with a unique
`name`, a `category`, the next `priority`, a one-paragraph `spec`,
`status: "pending"`, `milestone: null`, `attempts: 0`. The next `/factory` run
picks it up. The user can ask any session to "queue a `<Name>` in the factory
backlog" and you do exactly this.

## Continuous operation

This loop is restartable: invoke `/factory` whenever items are queued. For
hands-off operation in a long-lived session, `/loop 30m /factory` re-polls the
queue on an interval. Because every milestone is committed, an interrupted run
resumes cleanly — never re-scaffold a component whose `milestone` is already
past `scaffold`.
