/**
 * Links that go nowhere, inline.
 *
 * The same `checkLinks()` that `assertSendable` gates on, so a blocked row here is a send
 * that will be refused. A shipped template's `example.com` defaults show up as blocked on
 * purpose: they are fine to preview and wrong to send.
 */
import type { LinkFinding } from '@cascivo/email'

export function LinksPanel({ findings }: { findings: LinkFinding[] }) {
  const blocked = findings.filter((f) => f.level === 'blocked').length

  return (
    <section className="panel">
      <h2>Links</h2>
      {blocked === 0 ? (
        <p className="ok">No link that would block a send.</p>
      ) : (
        <p className="bad">
          {blocked} link{blocked === 1 ? '' : 's'} would block a send
        </p>
      )}

      <ul className="findings">
        {findings.map((f, i) => (
          <li key={`${f.problem}|${f.value}|${i}`} className={f.level}>
            <code>{f.value || '(empty)'}</code>
            <span className="slug">{f.problem}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
