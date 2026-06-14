import { BOUNDARIES } from './data'

export function WhenNotToUse() {
  return (
    <section id="when-not" className="guides-section">
      <h2>When not to use cascivo</h2>
      <p className="guides-section-sub">
        Here is where cascivo is the wrong tool — or only a forward bet. Candor beats adjectives;
        every limit links to the honest receipt so you can judge it yourself.
      </p>
      <ul className="boundary-list">
        {BOUNDARIES.map((b) => (
          <li key={b.limit} className="boundary-item">
            <h3 className="boundary-limit">{b.limit}</h3>
            <p className="boundary-framing">{b.framing}</p>
            <a href={b.receipt.href} className="boundary-receipt">
              {b.receipt.label} →
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
