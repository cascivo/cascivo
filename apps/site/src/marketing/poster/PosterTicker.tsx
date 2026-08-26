import { componentCount, themeCount } from './figures'

// Eight facts, mono caps, on an inverted band. Readable text rather than an
// image, so it stays in the accessibility tree and reflows at 320px.
const FACTS = [
  `${componentCount} components`,
  `${themeCount} themes`,
  'no tailwind',
  'zero runtime css',
  'signals not re-renders',
  'wcag 2.2 aa',
  'mcp server',
  'mit',
]

export function PosterTicker() {
  return (
    <section className="pg-section pg-invert pg-ticker" aria-label="At a glance">
      {FACTS.map((fact) => (
        <span key={fact} className="pg-ticker-item">
          {fact}
        </span>
      ))}
    </section>
  )
}
