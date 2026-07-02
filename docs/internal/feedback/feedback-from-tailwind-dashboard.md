# Feedback for cascivo — from a Tailwind-v4 dashboard integration

Context: a team built a single dark-themed dashboard on cascivo using the
`cascivo add <component>` copy-paste model, on top of an existing Tailwind v4
project. The notes below are the friction they hit, captured verbatim so the
maintainers can smooth the path for the next team.

---

## What worked well

- **CLI installation model** — `cascivo add <component>` works like shadcn/ui, so
  you only ship what you need. The component files land as first-party source in
  your repo, making them easy to inspect and override.
- **Clean component APIs** — Components accept `className` and spread props, and
  they use data attributes (`data-variant`, `data-size`, `data-padding`) to drive
  CSS module styles. This keeps JSX readable and styling decoupled.
- **Design token integration** — The dark theme ships as a single CSS import
  (`@cascivo/themes/dark.css`) and exposes a rich set of CSS variables
  (`--cascivo-color-accent`, `--cascivo-color-text-subtle`, font stacks, radii,
  etc.) that make custom layout code feel native to the system.
- **Composable primitives** — Card/CardHeader/CardContent/CardFooter, AppShell,
  ShellHeader, and SideNav are well-factored. The `asChild` prop on Button is a
  nice touch for polymorphic rendering.
- **Cohesive icon set** — `@cascivo/icons` is consistent and sized to match the
  library's spacing scale.

## Pain points & friction

- **Missing dependencies in distributed components** — `shell-header` and
  `side-nav` both depended on an internal `use-popover` hook that was not present
  in the installed package tree. I had to manually fetch it from the Cascivo
  GitHub repository to get the build to pass. This suggests the package graph is
  not fully resolved for standalone installs.
- **Sparse documentation** — There is no searchable API reference or prop table on
  the website. Figuring out available variants, sizes, and component-specific
  props required reading the component source code directly.
- **Inline-style drift** — Because there is no layout primitive (like a Stack,
  Flex, or Grid component) and no documented spacing scale utility classes, I ended
  up writing a lot of `style={{ ... }}` blocks for layout gaps, widths, and
  alignment. That undermines the "design system" benefit and makes the page feel
  less maintainable.
- **Theme collision with Tailwind** — The project already had a Tailwind v4 setup
  with its own `:root`/`.dark` token blocks. Importing `@cascivo/themes/dark.css`
  alongside it meant juggling two parallel token layers; there was no clear
  guidance on whether to abandon Tailwind tokens, override them, or keep both.

## Blockers

- The missing `use-popover` hook was the only hard blocker. Without manually
  resolving it from GitHub, `shell-header` and `side-nav` would not compile.

## Overall verdict

Cascivo produces a polished dark UI with excellent color handling (OKLCH-based
tokens look great), but it currently feels more like a styled component kit than a
fully integrated design system. For a single dashboard it works fine; for a larger
application, the lack of layout utilities, unresolved package dependencies, and
thin documentation would slow teams down.

---

> **Maintainer note.** This report is the source for **Roadmap v57**
> (`docs/ROADMAP-V57.md`). The analysis there separates the *real* gaps (the
> registry dependency-graph blocker; thin prop docs / no prop-level search; no
> Tailwind-v4 interop guidance) from the *misstated* ones (layout primitives and a
> documented spacing scale already ship — the gap is discoverability, and "utility
> classes" run against the no-utility-CSS philosophy).

---

## Resolution log (maintainers)

> Added when v57 shipped. ✅ fixed · 📝 documented · 🔎 corrected (claim was
> inaccurate against the code).

### The hard blocker — `use-popover` not installed
- ✅ **`cascivo add` now resolves internal registry dependencies.** Root cause was
  three broken links: the registry generator dropped `.ts` files (so
  `use-popover.ts` shipped with no component), `ComponentMeta` had no
  `registryDependencies` field, and the CLI bare-name path ignored it. All three
  fixed; `shell-header`/`side-nav`/`menu`/`multi-select`/`hover-card` declare the
  edge and `cascivo add shell-header` now installs the hook and builds standalone
  (v57 T1).
- ✅ **It can't reship.** A new `deps:check` import-graph guard + a clean-room
  install/`tsc` smoke test run in `regen`/CI. The audit surfaced **34** more latent
  cases (e.g. `button`→`spinner`, `data-table`→`button`/`checkbox`, `field`→`label`)
  — all now declared (v57 T2).

### Sparse documentation
- ✅ **100% prop-description coverage** (1151/1151), guarded by a `docs:coverage`
  check so it can't regress. 🔎 Per-component prop tables and Cmd+K search already
  existed — the real gap was empty descriptions + no prop-level search.
- 📝 **Prop-level + alias search** (Cmd+K now indexes prop/variant/size names and
  `flex`/`box`/`hstack`→`Stack`) and a central **`/docs/api`** reference page
  (v57 T3).

### Theme collision with Tailwind
- 📝 **`docs/USING-WITH-TAILWIND.md`** documents the cross-system `@layer` order,
  the dark-mode bridge, and the "keep both / override / pick one" answer.
- ✅ **Opt-in `@cascivo/themes/tailwind.css`** re-points Tailwind's `dark:` variant
  at cascivo's `[data-theme]` and maps `--cascivo-*` semantics onto Tailwind's
  `--color-*` utilities — no token-system change, no Tailwind dependency (v57 T4).

### "No layout primitives / no spacing utilities" (inline-style drift)
- 🔎 **Inaccurate** — `Stack`, `Grid`, `AutoGrid`, `Columns`, `Spacer`, `Center`,
  `Section` ship and are CLI-installable as `layout/*`; the `--cascivo-space-*`
  scale is documented in `TOKENS.md`. The gap was discoverability.
- ✅ **`cascivo add flex`/`box`/`hstack`/`vstack` → `layout/stack`** (bare `stack`
  already resolved); `cascivo list` surfaces the Layouts group + a usage tip.
- 📝 **`docs/cookbooks/layout-and-spacing.md`** maps the names you'd expect to the
  ones that exist and replaces inline styles with primitives + `var(--cascivo-space-N)`.
  Utility classes intentionally **not** shipped (no-utility-CSS principle) (v57 T5).
</content>
</invoke>
