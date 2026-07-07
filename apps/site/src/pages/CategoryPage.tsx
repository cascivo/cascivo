import { CATEGORY_INTRO, CATEGORY_LABELS, isCategory } from '../category-head'
import { components } from '../data'

export function CategoryPage({ category }: { category?: string }) {
  const key = category ?? ''
  const items = isCategory(key)
    ? components
        .filter((c) => c.category === key)
        .sort((a, b) => a.meta.name.localeCompare(b.meta.name))
    : []

  if (!isCategory(key) || items.length === 0) {
    return (
      <article class="doc-page">
        <h1>Not found</h1>
        <p class="muted">No category named "{category}".</p>
        <a href="/docs">← Back home</a>
      </article>
    )
  }

  const label = CATEGORY_LABELS[key]

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Category</div>
        <h1>{label}</h1>
        <p class="doc-lede">{CATEGORY_INTRO[key]}</p>
      </header>

      <section class="doc-section">
        <h2>
          {items.length} {label.toLowerCase()} component{items.length === 1 ? '' : 's'}
        </h2>
        <ul>
          {items.map((c) => (
            <li key={c.name}>
              <a href={`/docs/components/${c.name}`}>{c.meta.name}</a> — {c.meta.description}
            </li>
          ))}
        </ul>
      </section>

      <p>
        <a href="/docs">← Back to docs</a>
      </p>
    </article>
  )
}
