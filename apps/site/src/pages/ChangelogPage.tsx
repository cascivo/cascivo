import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'

interface Release {
  version: string
  level: 'major' | 'minor'
  notes: string[]
}

interface PackageChanges {
  name: string
  version: string
  releases: Release[]
}

interface BreakingChanges {
  generatedAt: string
  description: string
  packages: PackageChanges[]
}

const LEVEL_COLOR: Record<Release['level'], string> = {
  major: 'var(--cascivo-color-destructive)',
  minor: 'var(--cascivo-color-accent)',
}

function pkgDir(name: string): string {
  return name === 'cascivo' ? 'cli' : name.replace('@cascivo/', '')
}

export function ChangelogPage() {
  useSignals()
  const data = useSignal<BreakingChanges | null>(null)
  const error = useSignal<string | null>(null)

  useSignalEffect(() => {
    fetch('/breaking-changes.json')
      .then((r) => {
        if (!r.ok) throw new Error(`breaking-changes.json ${r.status}`)
        return r.json() as Promise<BreakingChanges>
      })
      .then((d) => {
        data.value = d
      })
      .catch((e: unknown) => {
        error.value = e instanceof Error ? e.message : String(e)
      })
  })

  const report = data.value

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Changelog</div>
        <h1>Changelog</h1>
        <p class="doc-lede">
          Every major and minor release per published package, parsed from the changesets. Patch
          releases are excluded. Compare a package&rsquo;s version against your installed one to
          spot API drift — the same data an agent reads from{' '}
          <a href="/breaking-changes.json">
            <code>breaking-changes.json</code>
          </a>
          .
        </p>
      </header>

      {error.value && (
        <section class="doc-section">
          <p style={{ color: 'var(--cascivo-color-destructive)' }}>
            Could not load the changelog: {error.value}
          </p>
        </section>
      )}

      {report && (
        <>
          <p class="muted">Generated {report.generatedAt}.</p>
          {report.packages.map((pkg) => (
            <section class="doc-section changelog-pkg" key={pkg.name} id={pkg.name}>
              <h2>
                <code>{pkg.name}</code> <span class="changelog-current">v{pkg.version}</span>{' '}
                <a
                  class="changelog-src"
                  href={`https://github.com/cascivo/cascivo/blob/main/packages/${pkgDir(pkg.name)}/CHANGELOG.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  full changelog ↗
                </a>
              </h2>
              {pkg.releases.length === 0 ? (
                <p class="muted">No major or minor releases yet.</p>
              ) : (
                <ul class="changelog-releases">
                  {pkg.releases.map((rel) => (
                    <li key={rel.version}>
                      <span class="changelog-ver">v{rel.version}</span>
                      <span class="changelog-level" style={{ color: LEVEL_COLOR[rel.level] }}>
                        {rel.level}
                      </span>
                      <span class="changelog-notes">{rel.notes.join(' ') || '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </>
      )}

      {!report && !error.value && (
        <section class="doc-section">
          <p class="muted">Loading changelog…</p>
        </section>
      )}
    </article>
  )
}
