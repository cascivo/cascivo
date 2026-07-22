import { buildNav } from '../nav'
import { components } from '../data'

/**
 * `/docs/components` — the index of every component, grouped by category. This is
 * the most-guessable components URL (humans and agents both try it), so it must
 * resolve rather than 404. Individual pages live at `/docs/components/<name>`; the
 * machine-readable catalogue is `/docs/components.md` and `/llms.txt`.
 */
export function ComponentsIndexPage() {
  const groups = buildNav()

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Components</div>
        <h1>All components</h1>
        <p class="doc-lede">
          {components.length} components, grouped by category. Building with an agent? The
          machine-readable index is <a href="/docs/components.md">/docs/components.md</a> and{' '}
          <a href="/llms.txt">/llms.txt</a>.
        </p>
      </header>

      {groups.map((group) => (
        <section class="doc-section" key={group.category}>
          <h2>
            <a href={`/docs/categories/${group.category}`}>{group.label}</a>
          </h2>
          <ul>
            {group.items.map((item) => (
              <li key={item.name}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p>
        <a href="/docs">← Back to docs</a>
      </p>
    </article>
  )
}
