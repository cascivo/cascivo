---
name: cascivo:add
description: Add cascivo components to the current project. Resolves component names against the registry (fuzzy match), runs the CLI, and verifies imports compile.
---

# cascivo:add

## When to use

The user wants to add one or more cascivo components to their project (e.g. "add a Button and a Modal", "I need a data table").

## Procedure

### 1. Detect project config

Look for `cascivo.config.ts`, `cascivo.config.js`, or `cascivo.config.json` in the project root.

If none exists, tell the user:

> No cascivo config found. Run `npx cascivo init` first to initialise cascivo in this project, then re-run this skill.

Stop until they confirm init is done or the config exists.

### 2. Read the registry

Fetch the component list at runtime — do NOT use a hardcoded list.

- If a local `registry.json` exists at the repo root, read it.
- Otherwise fetch: `https://cascivo.com/registry.json`

Extract `components[].name` for the full list.

### 3. Resolve requested names (fuzzy)

For each name the user requested:

- Exact match → use it.
- No exact match → find the closest entries (Levenshtein distance ≤ 2, or name contains the requested string as a substring).
- If one close match: ask "Did you mean `<match>`?"
- If multiple close matches: list them and ask the user to confirm.
- If no match: tell the user the name wasn't found and suggest they run `npx cascivo list` to browse available components.

### 4. Run the CLI

```bash
npx cascivo add <resolved-names-space-separated>
```

Show the output to the user. If it exits non-zero, report the error and stop.

### 5. Verify imports compile

After the CLI succeeds, check whether TypeScript is available:

```bash
npx tsc --version
```

If available, run a no-emit type check:

```bash
npx tsc --noEmit
```

Report any type errors to the user. If the project doesn't use TypeScript, skip this step.

### 6. Confirm

Tell the user which components were added, where the files landed (from CLI output), and remind them to import from the generated path shown in the CLI output.
