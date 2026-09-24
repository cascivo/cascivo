---
name: cascivo-migrate-from-shadcn
description: Migrate a React app from shadcn/ui (Tailwind + Radix or Base UI) to cascivo one file at a time — map components and variants, replace utility classes with tokens and layered CSS, and prove each file with `cascivo audit --ai` before moving on. Use when the user asks to move off shadcn/ui, replace Tailwind components with cascivo, or port a shadcn page.
---

# cascivo-migrate-from-shadcn

## When to use

The project uses shadcn/ui components (usually under `components/ui/`, styled with Tailwind
through `cn()`), and the user wants cascivo instead — the whole app, or one page to start.

Do **not** use this for a project that has never used shadcn; use `cascivo-add` there.

## Ground rules

- **One file at a time, audited.** Never rewrite the whole app in one pass. Migrate a file,
  run the audit on it, fix what it reports, then move on. The two libraries run side by side
  until the last import is gone, so every intermediate state must build.
- **Read the mapping, don't recall it.** Your training data knows shadcn far better than
  cascivo, and the names that look the same are exactly where you will be wrong. Before
  touching a file, read:
  - https://cascivo.com/docs/migrating-from-shadcn.md — the component map, variant table and
    CSS setup delta (the source of truth for everything below)
  - https://cascivo.com/llms/<name>.md for every cascivo component you are about to write
- **Prefer the MCP tools when they are available** (`npx cascivo mcp init` installs them):
  `get_component` for real props, `select_component` when the mapping is unclear,
  `get_tokens` before writing any colour, size or spacing.

## Procedure

### 1. Set up cascivo next to shadcn (once)

1. Check for a cascivo config. If there is none, run `npx cascivo init`.
2. Import a theme once at the app root and put `data-theme` on the root element:
   ```tsx
   import '@cascivo/themes/light-dark.css'
   // <html data-theme="light"> or any wrapping element
   ```
   Without this, cascivo components render uncoloured. Keep the Tailwind setup for now —
   shadcn files still need it until they are migrated.
3. Build the app. Do not continue until it builds.

### 2. Make the inventory

List every file that imports from the shadcn `components/ui/` directory (or the project's
alias for it). For each, note which shadcn components it uses. Present the list, ordered
leaves first (files no other migrated file depends on), and confirm scope with the user.

### 3. Migrate one file

For the next file in the list:

1. **Add the cascivo components it needs** with `npx cascivo add <names…>` (or import from
   `@cascivo/react` if the project uses the prebuilt package — ask once, then stay consistent).
2. **Swap imports and JSX** using the component map. Watch the deltas that catch everyone:
   - **Button variants differ.** `default` → `primary`; `outline` → `secondary` (there is no
     `outline`); `link` → a `Link` component. `ghost`, `secondary`, `destructive` keep
     their names.
   - **`Flex` defaults to vertical** — pass `direction="horizontal"` for a row. **`Stack`
     overlaps its children**; it is not a spacing column.
   - **Space props are numeric steps:** `gap={4}`, never `gap="4"` or `className="gap-4"`.
   - **Form controls take `label`, `hint` and `error` directly.** Delete the
     `FormField`/`FormItem`/`FormLabel`/`FormMessage` wrappers instead of porting them.
   - **Collections are `items`**, form choices are `options`, chart points are `data`.
   - **Value callbacks are `onValueChange(value)`**; `onChange` is reserved for the DOM event.
3. **Replace utility classes.** There is no `cn()`. Variants and states are props. Layout
   is `Flex` / `Grid` with numeric `gap`. Anything left that is truly custom goes in a CSS
   Module inside `@layer cascivo.override { … }`, using `--cascivo-*` tokens from
   `get_tokens` — never a raw colour, pixel size or unlayered rule.
4. **State:** in a React app, a component that reads a signal's `.value` during render
   must call `useSignals()` first, or it will not re-render. Plain `useState` in the
   project's own code can stay; do not convert app state for its own sake.

### 4. Prove the file

```sh
npx cascivo audit --ai <the file> <its .css, if any>
```

Fix every **error** (unknown prop, missing required prop) and every **warn** unless the user
has a stated reason to keep it. Re-run until the audit is clean, then type-check and build.
Only then mark the file done and move to the next one.

### 5. Remove shadcn (last)

When no file imports from `components/ui/` any more:

1. Delete the shadcn component files and `lib/utils.ts` (`cn`), if nothing else uses them.
2. Remove `@radix-ui/*` or `@base-ui/*`, `class-variance-authority`, `clsx` and
   `tailwind-merge` — but only if no remaining code imports them.
3. Remove Tailwind **only if the user wants it gone** and nothing else uses it. cascivo does
   not need it, but it does not conflict with it either (`docs/USING-WITH-TAILWIND.md`).
4. Run the audit over the whole source tree and build once more.

## Report back

After each file: the file, the components swapped, anything the mapping did not cover and
how you resolved it, and the audit result. At the end: the files migrated, the packages
removed, and anything left for the user to decide.
