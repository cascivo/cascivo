import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import type { CmdspecDocument } from '@docspack/cmdspec'
import { mountCommandBuilders } from '@docspack/cmdspec/builder'
import { CliReference } from '@docspack/sheaf-react'
import '@docspack/sheaf-react/styles.css'

/**
 * /docs/cli — the `cascivo` command reference, rendered from packages/cli/cmdspec.json: the
 * same description `docspack sync` indexes for agents and `cascivo --help` is held to
 * (packages/cli/src/cmdspec.test.ts). Loaded on demand so the docs chunk does not carry it.
 */
async function loadCmdspec(): Promise<CmdspecDocument> {
  const [spec, pkg] = await Promise.all([
    import('../../../../packages/cli/cmdspec.json'),
    import('../../../../packages/cli/package.json'),
  ])
  // Our own file, validated against the cmdspec schema by the CLI's test suite. Its source
  // carries a placeholder version (the CLI build stamps the real one), so stamp it the same way.
  const document = spec.default as unknown as CmdspecDocument
  return { ...document, info: { ...document.info, version: pkg.default.version } }
}

/**
 * The builder forms render disabled until wired. A ref callback runs once the reference's markup
 * is in the DOM; an effect would not, since a signal write runs effects before Preact commits.
 * Module-level so its identity is stable and re-renders do not wire the same forms twice.
 */
function wireBuilders(el: HTMLElement | null): void {
  if (el) mountCommandBuilders(el)
}

export function CliPage() {
  useSignals()
  const spec = useSignal<CmdspecDocument | null>(null)
  const error = useSignal<string | null>(null)

  useSignalEffect(() => {
    loadCmdspec()
      .then((doc) => {
        spec.value = doc
      })
      .catch((e: unknown) => {
        error.value = e instanceof Error ? e.message : String(e)
      })
  })

  return (
    <article class="doc-page cli-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Reference</div>
        <h1>CLI reference</h1>
        <p class="doc-lede">
          Every <code>cascivo</code> command: its arguments and options, what it reads, writes or
          runs, and its exit statuses. Agents get the same description from{' '}
          <code>docspack sync</code> with <code>cascivo</code> installed.
        </p>
      </header>
      {error.value && <p class="muted">Could not load the CLI reference: {error.value}</p>}
      {spec.value && (
        <div ref={wireBuilders}>
          <CliReference document={spec.value} />
        </div>
      )}
    </article>
  )
}
