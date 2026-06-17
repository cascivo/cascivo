# cascivo Go-Live Checklist

Code prerequisites completed in v15 T1–T4. External steps the owner must perform:

## npm

- [ ] Create npm org **`cascivo`** at npmjs.com/org/cascivo
- [ ] For each `@cascivo/*` package: `pnpm --filter @cascivo/<pkg> publish --access public`
      (dry-run: `pnpm --filter @cascivo/<pkg> publish --dry-run --access public`)
- [ ] Deprecate old `@cascade-ui/*` packages with migration note

## Domain / hosting

- [ ] Point `cascivo.com` DNS A record → landing host; provision TLS
- [ ] Set up docs subdomain (e.g. `docs.cascivo.com`) if separate from main; provision TLS
- [ ] Update hosting config with new domain; set CORS/CSP for the new origin

## GitHub

- [ ] Rename repo: `urbanisierung/cascade-ui` → `urbanisierung/cascivo`
  - GitHub automatically creates a redirect from the old path (safe — raw URLs still resolve)
- [ ] Update local git remote: `git remote set-url origin git@github.com:urbanisierung/cascivo.git`
- [ ] Verify `pnpm regen` still produces clean drift (registry.json URLs point at `urbanisierung/cascivo`)

## Verification (after infra is live)

- [ ] `npx cascivo add button` fetches a component from `cascivo.com`/registry
- [ ] Landing at `cascivo.com` loads with new OG tags
- [ ] Docs at `docs.cascivo.com` (or `cascivo.com/docs`) load correctly
- [ ] npm: `pnpm add @cascivo/react` resolves

## Code prerequisites (completed in v15)

- [x] CSS tokens renamed `--cascivo-*` (T2)
- [x] npm packages renamed `@cascivo/*` (T3)
- [x] CLI renamed to unscoped `cascivo` package (T4/v34-T3)
- [x] Registry URLs point at `urbanisierung/cascivo` (T4)
- [x] MCP uses `cascivo.com` (T4)
- [x] Skills renamed `cascivo:*` (T4)
