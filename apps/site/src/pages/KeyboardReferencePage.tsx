import { useSignal, useSignals } from '@cascivo/core'
import { Kbd } from '@cascivo/components/kbd'
import { CATEGORY_LABELS, CATEGORY_ORDER, components, type Category } from '../data'

// Every component ships its keyboard contract in its manifest
// (meta.accessibility.keyboard). This page derives a single reference from that
// data — no hand-maintained list, and a component appears here only when it
// genuinely declares keyboard interaction.
const KEYBOARD_ENTRIES = components
  .filter((c) => (c.meta.accessibility?.keyboard?.length ?? 0) > 0)
  .map((c) => ({
    name: c.name,
    label: c.meta.name,
    category: c.category,
    role: c.meta.accessibility.role,
    keys: c.meta.accessibility.keyboard,
  }))

function matches(entry: (typeof KEYBOARD_ENTRIES)[number], q: string): boolean {
  if (!q) return true
  if (entry.label.toLowerCase().includes(q)) return true
  if (entry.role.toLowerCase().includes(q)) return true
  return entry.keys.some((k) => k.toLowerCase().includes(q))
}

export function KeyboardReferencePage() {
  useSignals()
  const query = useSignal('')
  const q = query.value.trim().toLowerCase()

  const entries = KEYBOARD_ENTRIES.filter((e) => matches(e, q))
  const groups = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: entries.filter((e) => e.category === cat).sort((a, b) => a.label.localeCompare(b.label)),
  })).filter((g) => g.items.length > 0)

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Reference</div>
        <h1>Keyboard reference</h1>
        <p class="doc-lede">
          Every keyboard interaction in cascivo, in one place — derived from each component&rsquo;s
          machine-readable manifest, so it can&rsquo;t drift from the components themselves. Filter
          by component, ARIA role, or key.
        </p>
      </header>

      <div class="api-filter">
        <label for="kbd-filter-input">Filter</label>
        <input
          id="kbd-filter-input"
          type="search"
          placeholder="Component, role, or key (e.g. Escape, menu)…"
          value={query.value}
          onInput={(e) => {
            query.value = (e.target as HTMLInputElement).value
          }}
        />
        <span class="muted">{entries.length} components</span>
      </div>

      {groups.length === 0 ? (
        <p class="muted">No components match “{query.value}”.</p>
      ) : (
        groups.map((group) => (
          <section class="doc-section" key={group.cat}>
            <h2>{CATEGORY_LABELS[group.cat as Category]}</h2>
            <div class="kbd-ref-scroll">
              <table class="kbd-ref-table">
                <thead>
                  <tr>
                    <th scope="col">Component</th>
                    <th scope="col">Role</th>
                    <th scope="col">Keys</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((entry) => (
                    <tr key={entry.name}>
                      <th scope="row">
                        <a href={`/docs/components/${entry.name}`}>{entry.label}</a>
                      </th>
                      <td>
                        <code>{entry.role}</code>
                      </td>
                      <td>
                        <span class="kbd-ref-keys">
                          {entry.keys.map((k) => (
                            <Kbd key={k} size="sm">
                              {k}
                            </Kbd>
                          ))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </article>
  )
}
