# Migrating from shadcn/ui to cascivo

cascivo's component and prop API is close to shadcn/ui, so most JSX ports over
with small renames. The two real differences are **variant names** and the
**CSS setup** (cascade layers + a theme, instead of Tailwind utility classes).
This page maps the deltas the way a migrator hits them.

## CSS setup delta

shadcn relies on Tailwind: you copy a `globals.css` with `@tailwind` directives
and a big block of CSS variables, and style with utility classes. cascivo ships
real stylesheets — import them once and theme with a `data-theme` attribute:

```tsx
// shadcn: Tailwind directives + utility classes in markup
// cascivo: two imports, then plain components
import '@cascivo/react/styles.css' // component styles (@layer cascivo.component)
import '@cascivo/themes/all' // tokens once + base typography + light & dark
```

```tsx
<main data-theme="light">
  <Button>Save</Button>
</main>
```

- Styles live in cascade layers (`cascivo.base < cascivo.theme < cascivo.component`).
  Your own **unlayered** CSS always wins — see `CSS-LAYERS-PITFALL.md`.
- Design tokens are `--cascivo-*` custom properties, enumerated in `TOKENS.md`
  (and `@cascivo/tokens/tokens.json` for tooling). No `tailwind.config` to mirror.

## Button variants

cascivo's Button variants are **not** shadcn's. There is **no `outline`**.

| shadcn variant | cascivo variant | Notes                                   |
| -------------- | --------------- | --------------------------------------- |
| `default`      | `primary`       | the filled, primary action              |
| `secondary`    | `secondary`     | same name                               |
| `outline`      | `secondary`     | no bordered-only variant — use secondary |
| `ghost`        | `ghost`         | same name                               |
| `destructive`  | `destructive`   | same name                               |
| `link`         | `ghost` + `Link` | use the `Link` component for link styling |

```tsx
// shadcn
<Button variant="default">Save</Button>
<Button variant="outline">Cancel</Button>

// cascivo
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
```

`size` (`sm | md | lg`), `loading`, and `disabled` carry over; Button spreads
`ButtonHTMLAttributes`.

## Form fields come with their own label/hint/error

shadcn composes `FormField` + `FormItem` + `FormLabel` + `FormMessage` around
each control. cascivo inputs (`Input`, `Textarea`, `Select`, …) accept
`label`, `hint`, and `error` directly, removing the wrapper boilerplate:

```tsx
// shadcn: ~6 wrapper components per field
// cascivo:
<Textarea label="Bio" hint="Markdown supported" error={errors.bio} />
```

For full forms, `Field` and the signal-based `createForm`/`useForm` store cover
validation without a resolver library.

## App shell / sidebar

Don't hand-roll the shell. `AppShell` wires `ShellHeader` + `SideNav` + content
into one sticky-header, full-height-nav, single-scroll-container layout, with the
header burger bound to the nav, an animated (and `prefers-reduced-motion`-aware)
show/hide, `inert`/focus handling, and a mobile drawer:

```tsx
<AppShell header={<ShellHeader brand={{ name: 'Acme' }} />} nav={<SideNav items={items} />}>
  <h1>Dashboard</h1>
</AppShell>
```

## What else exists

Before hand-rolling a component, check the index — cascivo ships heavy ones that
are easy to miss: `DataTable` (sort/filter/paginate/select/expand), `CommandMenu`
(⌘K), `EmptyState`, `Stat`, `DataList`, `Combobox`, `MultiSelect`, and more. The
full categorized list is in the [`@cascivo/react` README](https://github.com/urbanisierung/cascivo/tree/main/packages/react#readme)
and at [docs.cascivo.com](https://docs.cascivo.com).
