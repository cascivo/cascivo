import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'

interface Receipt {
  name: string
  label: string
  primitive: string
  loc: number
  files: number
  deps: number
}

interface Simplicity {
  components: Receipt[]
}

export function PlatformPage() {
  useSignals()
  const data = useSignal<Simplicity | null>(null)
  const error = useSignal<string | null>(null)

  useSignalEffect(() => {
    fetch('/simplicity.json')
      .then((r) => {
        if (!r.ok) throw new Error(`simplicity.json ${r.status}`)
        return r.json() as Promise<Simplicity>
      })
      .then((d) => {
        data.value = d
      })
      .catch((e: unknown) => {
        error.value = e instanceof Error ? e.message : String(e)
      })
  })

  const report = data.value
  const totalLoc = report?.components.reduce((n, c) => n + c.loc, 0) ?? 0

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Platform</div>
        <h1>Built on the platform, not on a dependency</h1>
        <p class="doc-lede">
          The web platform shipped the primitives a UI library used to reach for a dependency to
          get: a native <code>&lt;dialog&gt;</code>, the Popover API, CSS anchor positioning,{' '}
          <code>:has()</code>, container queries. cascivo bets on them. The receipts below are read
          straight from the component source, so they can&rsquo;t drift.
        </p>
      </header>

      <section class="doc-section">
        <p>
          The common alternative wraps a third-party headless primitive (Radix, now Base UI) plus an
          icon set and a stack of utility classes. That is real code you inherit and maintain — and
          when the primitive&rsquo;s maintainers change course (Radix → Base UI as the default in
          2026, for one), your copied components are stranded. A cascivo control is a native element
          plus CSS: nothing to churn, nothing to swap.
        </p>
      </section>

      <section class="doc-section">
        <h2>The treadmill this avoids</h2>
        <p>
          A stack built on third-party primitives inherits their release cadence. Recent examples
          the wider ecosystem has had to absorb:
        </p>
        <ul class="a11y-list">
          <li>
            <strong>Tailwind CSS v4 (2025).</strong> A new engine and configuration model — a
            migration for every project that themed through Tailwind.
          </li>
          <li>
            <strong>Radix → Base UI (2026).</strong> The headless-primitive default shifted, so
            copied components built on the old default need porting to keep receiving fixes.
          </li>
          <li>
            <strong>Recurring CLI majors.</strong> Tooling that scaffolds and updates components
            bumps major versions on its own schedule, independent of your app.
          </li>
        </ul>
        <p class="muted">
          None of these reach a cascivo component: a native <code>&lt;dialog&gt;</code>,{' '}
          <code>&lt;input&gt;</code>, the Popover API, and CSS carry no upstream version to chase.
          See the <a href="/docs/upgrading">upgrade path</a> for how you pull fixes into code you
          own.
        </p>
      </section>

      {error.value && (
        <section class="doc-section">
          <p style={{ color: 'var(--cascivo-color-destructive)' }}>
            Could not load the receipts: {error.value}
          </p>
        </section>
      )}

      {report && (
        <>
          <section class="doc-section">
            <div class="kbd-ref-scroll">
              <table class="kbd-ref-table">
                <caption class="visually-hidden">
                  Platform-native components with their size and dependency count
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Component</th>
                    <th scope="col">Built on</th>
                    <th scope="col">Lines</th>
                    <th scope="col">Third-party deps</th>
                  </tr>
                </thead>
                <tbody>
                  {report.components.map((c) => (
                    <tr key={c.name}>
                      <th scope="row">
                        <a href={`/docs/components/${c.name}`}>{c.label}</a>
                      </th>
                      <td>{c.primitive}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{c.loc}</td>
                      <td>{c.deps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p class="muted" style={{ marginBlockStart: 'var(--cascivo-space-3)' }}>
              {report.components.length} controls · {totalLoc} total lines · 0 third-party runtime
              dependencies. Line counts are non-blank lines of each component&rsquo;s TSX + CSS,
              measured by <code>scripts/simplicity/generate.ts</code>.
            </p>
          </section>

          <section class="doc-section">
            <h2>Why it matters</h2>
            <ul class="a11y-list">
              <li>
                <strong>Nothing to upgrade underneath you.</strong> Native elements don&rsquo;t ship
                breaking changes; the browser keeps them working.
              </li>
              <li>
                <strong>Less code to own.</strong> You copy the source in — fewer lines and zero
                wrapped primitives means less to read, audit, and maintain.
              </li>
              <li>
                <strong>Accessibility for free.</strong> A native <code>&lt;input&gt;</code> or{' '}
                <code>&lt;dialog&gt;</code> brings its role, focus behavior, and keyboard handling
                with it — see the <a href="/docs/keyboard">keyboard reference</a>.
              </li>
            </ul>
          </section>
        </>
      )}

      {!report && !error.value && (
        <section class="doc-section">
          <p class="muted">Loading receipts…</p>
        </section>
      )}
    </article>
  )
}
