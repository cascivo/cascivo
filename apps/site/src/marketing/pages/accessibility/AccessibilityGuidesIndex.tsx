import { CATEGORY_LABELS, CATEGORY_ORDER } from '../../../category-head'
import { components } from '../../../data'

/** Per-component accessibility guides (/accessibility/<name>), grouped by category. */
export function AccessibilityGuidesIndex() {
  const guides = components.filter((c) => (c.type ?? 'component') === 'component')

  return (
    <section className="guides-section" id="component-guides">
      <h2>Per-component accessibility guides</h2>
      <p className="guides-section-sub">
        How to use each control accessibly — when to reach for it, keyboard interactions, and common
        mistakes — for every component in cascivo.
      </p>
      {CATEGORY_ORDER.map((category) => {
        const items = guides
          .filter((c) => c.category === category)
          .sort((a, b) => a.meta.name.localeCompare(b.meta.name))
        if (items.length === 0) return null
        return (
          <div key={category}>
            <h3>{CATEGORY_LABELS[category]}</h3>
            <ul>
              {items.map((c) => (
                <li key={c.name}>
                  <a href={`/accessibility/${c.name}`}>{c.meta.name}</a>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
