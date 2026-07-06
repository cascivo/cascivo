'use client'
import { VisuallyHidden } from '@cascivo/components/visually-hidden'
import { AT_COMPONENTS, AT_GENERATED_AT, AT_HAS_RESULTS, AT_STACKS, type AtStatus } from './data'

const STATUS_META: Record<AtStatus, { symbol: string; label: string }> = {
  pass: { symbol: '✅', label: 'pass' },
  partial: { symbol: '⚠️', label: 'partial' },
  fail: { symbol: '❌', label: 'fail' },
  pending: { symbol: '·', label: 'pending' },
  na: { symbol: '—', label: 'not applicable' },
}

function StatusCell({ status }: { status: AtStatus }) {
  const meta = STATUS_META[status]
  return (
    <td className={`at-cell at-cell-${status}`}>
      <span aria-hidden="true">{meta.symbol}</span>
      <span className="at-cell-label"> {meta.label}</span>
    </td>
  )
}

export function AtMatrix() {
  return (
    <section className="section" id="at" data-reveal="">
      <h2>Screen-reader announcements, run in CI</h2>
      <p className="section-sub">
        A nightly GitHub Actions workflow drives real screen readers — NVDA on Windows and VoiceOver
        on macOS, via <a href="https://guidepup.dev">guidepup</a> — over each component&rsquo;s
        Storybook story and records what is announced on focus and interaction. This guards the
        announcements against regression; it complements, and does not replace, hands-on testing by
        assistive-technology users.
      </p>

      {!AT_HAS_RESULTS && (
        <p className="at-pending-note">
          <strong>Pending first automated run.</strong> The harness and the 12-component plan are in
          place; cells fill in once the workflow has run on Windows and macOS runners.
        </p>
      )}

      <div className="at-matrix-scroll">
        <table className="at-matrix-table">
          <caption className="visually-hidden">
            Screen-reader announcement results per component and stack
          </caption>
          <thead>
            <tr>
              <th scope="col">Component</th>
              {AT_STACKS.map((s) => (
                <th key={s.id} scope="col">
                  {s.label}
                  <span className="at-stack-platform"> ({s.platform})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AT_COMPONENTS.map((c) => (
              <tr key={c.name}>
                <th scope="row">{c.name}</th>
                {AT_STACKS.map((s) => (
                  <StatusCell key={s.id} status={c.results[s.id] ?? 'pending'} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="a11y-disclosure">
        {AT_GENERATED_AT ? (
          <>Last run {AT_GENERATED_AT}. </>
        ) : (
          <>No automated run has landed yet. </>
        )}
        JAWS is licensed and cannot be driven on hosted runners, so it stays a manual spot-check —
        the full plan, stacks, and known AT quirks live in <code>docs/specs/at-matrix.md</code>.
        <VisuallyHidden>
          Legend: pass means role, name, and state announced correctly and all keys work; partial
          means one noted quirk; fail means a required announcement or key is missing; pending means
          not yet run.
        </VisuallyHidden>
      </p>
    </section>
  )
}
