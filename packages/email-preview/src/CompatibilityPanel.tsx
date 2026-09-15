/**
 * Conformance findings, inline.
 *
 * The same `lint()` the CI check runs, so what an author sees here is what will fail the
 * build — there is no second, friendlier ruleset. Caveats are shown alongside blocks
 * because they are the constraints the primitive set is built around, and an author working
 * on a template benefits from seeing them.
 */
import type { Finding } from '@cascivo/email'

export function CompatibilityPanel({
  findings,
  available,
}: {
  findings: Finding[]
  /** False when no Can I email matrix was supplied. */
  available: boolean
}) {
  const blocked = findings.filter((f) => f.level === 'blocked')
  const caveats = findings.filter((f) => f.level === 'caveat')

  // Without the dataset there are no findings, which looks exactly like a clean template.
  // Saying so is the whole point: a silent pass here would be worse than no panel at all.
  if (!available) {
    return (
      <section className="panel">
        <h2>Compatibility</h2>
        <p className="hint">
          Not checked — no Can I email matrix supplied. Download{' '}
          <code>https://www.caniemail.com/api/data.json</code> and pass it with{' '}
          <code>--caniemail &lt;file&gt;</code>.
        </p>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Compatibility</h2>
      {blocked.length === 0 ? (
        <p className="ok">No blocked feature.</p>
      ) : (
        <p className="bad">
          {blocked.length} blocked feature{blocked.length === 1 ? '' : 's'}
        </p>
      )}

      <ul className="findings">
        {[...blocked, ...caveats].map((f) => (
          <li key={`${f.slug}|${f.source}`} className={f.level}>
            <code>{f.source}</code>
            <span className="slug">{f.slug}</span>
            <span className="clients">{f.clients.join(', ')}</span>
          </li>
        ))}
      </ul>

      {caveats.length > 0 ? (
        <p className="hint">
          A caveat is partial support — usually &ldquo;works on a table cell, not a div&rdquo;.
          These are enforced by the structural invariants rather than by this list.
        </p>
      ) : null}
    </section>
  )
}
