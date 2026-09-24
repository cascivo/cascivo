import { ALTERNATIVES } from './data'

export function Alternatives() {
  return (
    <section id="alternatives" className="guides-section">
      <h2>cascivo and the alternatives</h2>
      <p className="guides-section-sub">
        Which library fits depends on what you already have. For each alternative, a real reason to
        pick it over cascivo — and the reason you might pick cascivo instead.
      </p>
      <ul className="boundary-list">
        {ALTERNATIVES.map((a) => (
          <li key={a.name} className="boundary-item">
            <h3 className="boundary-limit">{a.name}</h3>
            <p className="boundary-framing">{a.what}</p>
            <p className="boundary-framing">
              <strong>Pick it when:</strong> {a.pickThem}
            </p>
            <p className="boundary-framing">
              <strong>Pick cascivo when:</strong> {a.pickCascivo}
            </p>
          </li>
        ))}
      </ul>
      <p className="guides-section-sub">
        Still weighing it? <a href="/guides/when-not-to-use">When not to use cascivo</a> lists the
        limits plainly.
      </p>
    </section>
  )
}
