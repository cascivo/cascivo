import { SCENARIOS } from './data'

export function UseCaseScenarios() {
  return (
    <section id="use-cases" className="guides-section">
      <h2>When is cascivo the right call?</h2>
      <p className="guides-section-sub">
        Five situations where cascivo earns its place — each mapped to the strength that wins there,
        with the receipt that proves it.
      </p>
      <ul className="scenario-grid">
        {SCENARIOS.map((s) => (
          <li key={s.persona} className="scenario-card">
            <h3 className="scenario-persona">{s.persona}</h3>
            <p className="scenario-situation">{s.situation}</p>
            <p className="scenario-why">{s.why}</p>
            <a href={s.receipt.href} className="scenario-receipt">
              {s.receipt.label} →
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
