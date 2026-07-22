// Mirrors docs/MIGRATING-FROM-SHADCN.md (v37 T6, #10). Keep the two in sync.

const cardStyle = {
  border: '1px solid var(--cascivo-color-border)',
  borderRadius: 'var(--cascivo-radius-lg)',
  background: 'var(--cascivo-color-surface)',
  padding: 'var(--cascivo-space-5)',
  marginBlockEnd: 'var(--cascivo-space-5)',
}

const code = {
  display: 'block',
  whiteSpace: 'pre-wrap' as const,
  fontFamily: 'var(--cascivo-font-mono)',
  fontSize: 'var(--cascivo-text-sm)',
  background: 'var(--cascivo-color-surface-2, var(--cascivo-color-bg-subtle))',
  border: '1px solid var(--cascivo-color-border)',
  borderRadius: 'var(--cascivo-radius-md)',
  padding: 'var(--cascivo-space-3)',
  marginBlockStart: 'var(--cascivo-space-2)',
}

const th = { textAlign: 'start' as const, padding: 'var(--cascivo-space-2)' }
const td = {
  padding: 'var(--cascivo-space-2)',
  borderBlockStart: '1px solid var(--cascivo-color-border)',
}

interface VariantRow {
  shadcn: string
  cascivo: string
  notes: string
}

const VARIANTS: VariantRow[] = [
  { shadcn: 'default', cascivo: 'primary', notes: 'the filled, primary action' },
  { shadcn: 'secondary', cascivo: 'secondary', notes: 'same name' },
  { shadcn: 'outline', cascivo: 'secondary', notes: 'no bordered-only variant — use secondary' },
  { shadcn: 'ghost', cascivo: 'ghost', notes: 'same name' },
  { shadcn: 'destructive', cascivo: 'destructive', notes: 'same name' },
  { shadcn: 'link', cascivo: 'ghost + Link', notes: 'use the Link component for link styling' },
]

export function MigratingPage() {
  return (
    <article style={{ maxInlineSize: '52rem' }}>
      <h1>Migrating from shadcn/ui</h1>
      <p style={{ color: 'var(--cascivo-color-text-subtle)' }}>
        cascivo's component and prop API is close to shadcn/ui. The real differences are variant
        names and the CSS setup (cascade layers + a theme, instead of Tailwind utilities).
      </p>

      <section style={cardStyle}>
        <h2>CSS setup</h2>
        <p>
          Import the themes once, then theme with a `data-theme` attribute — no Tailwind config to
          mirror. Component CSS comes along with each component import and tree-shakes per
          component.
        </p>
        <code
          style={code}
        >{`import '@cascivo/themes/all.css' // tokens once + base typography + light & dark
// component CSS auto-included on import — no styles.css needed with a bundler

<main data-theme="light">
  <Button>Save</Button>
</main>`}</code>
        <p style={{ color: 'var(--cascivo-color-text-subtle)' }}>
          Styles live in cascade layers (cascivo.base &lt; cascivo.theme &lt; cascivo.component);
          your own unlayered CSS always wins. Tokens are documented in TOKENS.md.
        </p>
      </section>

      <section style={cardStyle}>
        <h2>Button variants</h2>
        <p>
          cascivo's Button variants are <strong>not</strong> shadcn's. There is{' '}
          <strong>no `outline`</strong>.
        </p>
        <table style={{ inlineSize: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>shadcn</th>
              <th style={th}>cascivo</th>
              <th style={th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {VARIANTS.map((row) => (
              <tr key={row.shadcn}>
                <td style={td}>
                  <code>{row.shadcn}</code>
                </td>
                <td style={td}>
                  <code>{row.cascivo}</code>
                </td>
                <td style={td}>{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={cardStyle}>
        <h2>Form fields</h2>
        <p>
          cascivo inputs accept `label`, `hint`, and `error` directly — no `FormField`/`FormItem`
          wrapper stack.
        </p>
        <code
          style={code}
        >{`<Textarea label="Bio" hint="Markdown supported" error={errors.bio} />`}</code>
      </section>

      <section style={cardStyle}>
        <h2>App shell</h2>
        <p>
          Don't hand-roll the shell. `AppShell` wires `ShellHeader` + `SideNav` + content into one
          sticky-header, full-height-nav, single-scroll layout with the burger bound to the nav, an
          animated show/hide, inert/focus handling, and a mobile drawer.
        </p>
        <code
          style={code}
        >{`<AppShell header={<ShellHeader brand={{ name: 'Acme' }} />} nav={<SideNav items={items} />}>
  <h1>Dashboard</h1>
</AppShell>`}</code>
      </section>

      <p>
        Before hand-rolling, check the component index — cascivo ships heavy ones that are easy to
        miss: DataTable, CommandMenu, EmptyState, Stat, Combobox, MultiSelect, and more.
      </p>
    </article>
  )
}
