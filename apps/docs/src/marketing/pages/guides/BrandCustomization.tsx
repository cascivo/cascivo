import { CUSTOMIZE } from './data'

export function BrandCustomization() {
  return (
    <section id="customize" className="guides-section">
      <h2>Make it yours</h2>
      <p className="guides-section-sub">{CUSTOMIZE.intro}</p>

      <ol className="customize-tiers">
        {CUSTOMIZE.tiers.map((tier) => (
          <li key={tier.name} className="customize-tier">
            <span className="customize-tier-name">{tier.name}</span>
            <code className="customize-tier-example">{tier.example}</code>
            <span className="customize-tier-note">{tier.note}</span>
          </li>
        ))}
      </ol>

      <div className="customize-snippets">
        {CUSTOMIZE.snippets.map((snip) => (
          <figure key={snip.title} className="customize-snippet">
            <h3 className="customize-snippet-title">{snip.title}</h3>
            <pre className="guides-code" data-lang={snip.lang}>
              <code>{snip.code}</code>
            </pre>
            <figcaption className="customize-snippet-caption">{snip.caption}</figcaption>
          </figure>
        ))}
      </div>

      <div className="customize-escalate">
        <h3 className="customize-escalate-title">Need to go further?</h3>
        <ul className="customize-escalate-cards">
          {CUSTOMIZE.escalation.map((esc) => (
            <li key={esc.label} className="customize-escalate-card">
              <a href={esc.href}>{esc.label} →</a>
              <p>{esc.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
