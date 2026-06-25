import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'

interface ParityRow {
  competitor: string
  status: 'covered' | 'partial' | 'gap' | 'by-convention' | 'deferred'
  cascivo: string
  note: string
}

interface CompetitorReport {
  total: number
  covered: number
  partial: number
  gap: number
  byConvention: number
  deferred: number
  rows: ParityRow[]
}

interface ParityReport {
  generatedAt: string
  competitors: Record<string, CompetitorReport>
}

const STATUS_COLOR: Record<ParityRow['status'], string> = {
  covered: 'var(--cascivo-color-success, #16a34a)',
  partial: 'var(--cascivo-color-warning, #d97706)',
  gap: 'var(--cascivo-color-text-subtle)',
  'by-convention': 'var(--cascivo-color-accent)',
  deferred: 'var(--cascivo-color-text-subtle)',
}

const STATUS_LABEL: Record<ParityRow['status'], string> = {
  covered: 'Covered',
  partial: 'Partial',
  gap: 'Gap',
  'by-convention': 'By convention',
  deferred: 'Deferred',
}

const cardStyle = {
  border: '1px solid var(--cascivo-color-border)',
  borderRadius: 'var(--cascivo-radius-lg)',
  background: 'var(--cascivo-color-surface)',
  padding: 'var(--cascivo-space-4)',
}

function StatusBadge({ status }: { status: ParityRow['status'] }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 'var(--cascivo-text-xs)',
        fontWeight: 'var(--cascivo-font-medium)',
        color: STATUS_COLOR[status],
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

function CompetitorTable({ name, report }: { name: string; report: CompetitorReport }) {
  return (
    <section class="doc-section">
      <h2 style={{ fontSize: 'var(--cascivo-text-lg)' }}>{name}</h2>
      <p style={{ color: 'var(--cascivo-color-text-subtle)' }}>
        cascivo covers <strong>{report.covered}</strong> of <strong>{report.total}</strong> {name}{' '}
        components
        {report.partial > 0 ? ` · ${report.partial} partial` : ''}
        {report.gap > 0 ? ` · ${report.gap} gap` : ''}
        {report.byConvention > 0 ? ` · ${report.byConvention} by convention` : ''}
        {report.deferred > 0 ? ` · ${report.deferred} deferred` : ''}.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '32rem' }}>
          <thead>
            <tr style={{ textAlign: 'start', color: 'var(--cascivo-color-text-subtle)' }}>
              <th style={{ textAlign: 'start', padding: 'var(--cascivo-space-2)' }}>Component</th>
              <th style={{ textAlign: 'start', padding: 'var(--cascivo-space-2)' }}>Status</th>
              <th style={{ textAlign: 'start', padding: 'var(--cascivo-space-2)' }}>cascivo</th>
              <th style={{ textAlign: 'start', padding: 'var(--cascivo-space-2)' }}>Note</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => (
              <tr
                key={row.competitor}
                style={{ borderBlockStart: '1px solid var(--cascivo-color-border)' }}
              >
                <td
                  style={{
                    padding: 'var(--cascivo-space-2)',
                    fontWeight: 'var(--cascivo-font-medium)',
                  }}
                >
                  {row.competitor}
                </td>
                <td style={{ padding: 'var(--cascivo-space-2)' }}>
                  <StatusBadge status={row.status} />
                </td>
                <td
                  style={{
                    padding: 'var(--cascivo-space-2)',
                    fontFamily: 'var(--cascivo-font-mono)',
                    fontSize: 'var(--cascivo-text-sm)',
                  }}
                >
                  {row.cascivo || '—'}
                </td>
                <td
                  style={{
                    padding: 'var(--cascivo-space-2)',
                    fontSize: 'var(--cascivo-text-sm)',
                    color: 'var(--cascivo-color-text-subtle)',
                  }}
                >
                  {row.note || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function ParityPage() {
  useSignals()
  const report = useSignal<ParityReport | null>(null)
  const error = useSignal<string | null>(null)

  useSignalEffect(() => {
    fetch('/parity.json')
      .then((r) => {
        if (!r.ok) throw new Error(`parity.json ${r.status}`)
        return r.json() as Promise<ParityReport>
      })
      .then((data) => {
        report.value = data
      })
      .catch((e: unknown) => {
        error.value = e instanceof Error ? e.message : String(e)
      })
  })

  const data = report.value
  const shadcn = data?.competitors['shadcn']
  const carbon = data?.competitors['carbon']

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Parity</div>
        <h1>cascivo vs shadcn/ui &amp; IBM Carbon</h1>
        <p class="doc-lede">
          A component-by-component coverage scoreboard. Every number on this page is{' '}
          <strong>derived</strong> from the parity matrix and cross-checked against the real{' '}
          <code>@cascivo/react</code> exports — a component shows as covered only when it is
          genuinely built and shipped. Gaps map to dated specs in the factory backlog.
        </p>
      </header>

      {error.value && (
        <section class="doc-section">
          <div style={{ ...cardStyle, color: 'var(--cascivo-color-destructive)' }}>
            Could not load parity data: {error.value}
          </div>
        </section>
      )}

      {data && shadcn && carbon && (
        <>
          <section class="doc-section">
            <div
              style={{
                display: 'grid',
                gap: 'var(--cascivo-space-4)',
                gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
              }}
            >
              <div style={cardStyle}>
                <div
                  style={{
                    fontSize: 'var(--cascivo-text-2xl)',
                    fontWeight: 'var(--cascivo-font-bold)',
                  }}
                >
                  {shadcn.covered}/{shadcn.total}
                </div>
                <div style={{ color: 'var(--cascivo-color-text-subtle)' }}>shadcn/ui covered</div>
              </div>
              <div style={cardStyle}>
                <div
                  style={{
                    fontSize: 'var(--cascivo-text-2xl)',
                    fontWeight: 'var(--cascivo-font-bold)',
                  }}
                >
                  {carbon.covered}/{carbon.total}
                </div>
                <div style={{ color: 'var(--cascivo-color-text-subtle)' }}>IBM Carbon covered</div>
              </div>
            </div>
            <p
              style={{
                color: 'var(--cascivo-color-text-subtle)',
                marginBlockStart: 'var(--cascivo-space-3)',
              }}
            >
              Generated {data.generatedAt} from <code>docs/specs/parity-matrix.md</code>.
            </p>
          </section>

          <CompetitorTable name="shadcn/ui" report={shadcn} />
          <CompetitorTable name="IBM Carbon" report={carbon} />
        </>
      )}

      {!data && !error.value && (
        <section class="doc-section">
          <p style={{ color: 'var(--cascivo-color-text-subtle)' }}>Loading parity data…</p>
        </section>
      )}
    </article>
  )
}
