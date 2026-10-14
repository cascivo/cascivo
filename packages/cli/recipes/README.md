# Scaffold recipes

Each directory is one feature `cascivo create` can write: the `cloudflare` base, one per
`--example`, and the pieces two choices bring together (`billing` is checkout plus email
sign-in, `publish-preview` is publish plus export). The files are the app's real source, at
the paths they take in the app. `recipe.json` names them:

```json
{ "name": "board", "files": ["src/board.ts", "src/board.module.css", "src/routes/board.tsx"] }
```

Which recipes a scaffold gets is decided in one place, `cloudflareRecipes()` in
`src/commands/create.ts`. Files under `src/routes/` become routes.

- **Placeholders.** A file may write `{{brand}}`, `{{appName}}` or `{{usageDataset}}`; nothing
  else is substituted, so JSX's `{{ … }}` is safe.
- **No dotfiles.** npm drops them from a published package.
- **Not formatted or linted here.** These files are the adopter's code and must stay
  byte-identical to what the scaffolder has always written; `pnpm starters:generate` and
  `scripts/checks/starters.test.ts` prove it. The starters are where this code is built and
  type-checked.
