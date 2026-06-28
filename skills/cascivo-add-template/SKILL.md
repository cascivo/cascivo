---
name: cascivo:add-template
description: Install a cascivo marketplace template — a whole-page composition (page + its components + fixtures) the user owns and adapts. Browses the catalog, installs via the CLI, and verifies it compiles.
---

# cascivo:add-template

## When to use

The user wants a whole working page rather than individual components — e.g. "set me up a dashboard", "I need an auth screen", "start from a landing-page template", or "what templates are available?".

A **template** is a registry item (`type: "template"`) that bundles a page, the components it composes
(`registryDependencies`), and its fixtures. Installing one copies all of that into the project, which the user then
owns and adapts.

## Procedure

### 1. Detect project config

Look for `cascivo.config.{ts,js,json}` in the project root. If none exists, tell the user:

> No cascivo config found. Run `npx cascivo init` first (or `npx cascivo create my-app --template <spec>` to scaffold a fresh app from a template), then re-run this skill.

Stop until the config exists — unless the user wants a brand-new app, in which case use `cascivo create --template`.

### 2. Browse the catalog

List templates at runtime — do NOT use a hardcoded list:

- Prefer the `list_templates` MCP tool (filter by `category`, `tag`, `framework`, or `verifiedOnly`).
- Otherwise read the static catalog at `/marketplace.json` on the docs site, or browse `/docs/marketplace`.

### 3. Help the user pick

Match the user's intent to a template's `category`/`description`/`tags`. If several fit, list the candidates with
their `installSpec`, framework, and whether they're `verified`. Prefer verified templates; warn before installing an
unverified one (its source is community-contributed — the user owns and should review it).

Call `get_template` to show the chosen template's components, demo link, and screenshots before installing.

### 4. Install

```bash
npx cascivo add <installSpec>     # e.g. @cascivo/dashboard
```

…or, for a fresh app:

```bash
npx cascivo create my-app --template <installSpec>
```

The CLI installs the template's component closure into the components directory and writes the page/fixture files to
their targets. Show the output; if it exits non-zero, report the error and stop.

### 5. Verify it compiles

If TypeScript is available:

```bash
npx tsc --noEmit
```

Report any type errors. Then run `npx cascivo doctor` to confirm the installed source follows the house rules.

### 6. Confirm + next steps

Tell the user:

- Which template was installed and where the page + fixtures landed (from CLI output).
- The components it pulled in.
- The "now own and adapt" next steps: route the page, replace the fixtures with real data, and restyle via tokens.
