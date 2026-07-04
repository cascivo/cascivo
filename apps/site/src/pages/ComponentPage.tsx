import { CATEGORY_LABELS, getComponent, type RegistryEntry } from '../data'
import { demos } from '../demos'
import { CodeBlock } from './components/CodeBlock'
import { PropsTable } from './components/PropsTable'
import { TokenList } from './components/TokenList'

function storybookUrl(category: string, name: string): string {
  const slug = `${category}-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`
  return `https://storybook.cascivo.com/?path=/story/${slug}--primary`
}

// Mirrors packageFor()/install logic in scripts/llms/generate.ts so the doc page
// and the AI docs agree: charts ship as @cascivo/charts; components install via
// the CLI (copy-paste) and, when published, from the prebuilt @cascivo/react.
function InstallSection({ entry }: { entry: RegistryEntry }) {
  const exportName = entry.meta.name
  if (entry.type === 'chart') {
    return (
      <section class="doc-section">
        <h2>Installation</h2>
        <p class="muted">
          Charts ship in the <code>@cascivo/charts</code> package:
        </p>
        <CodeBlock lang="bash" code="pnpm add @cascivo/charts" />
        <CodeBlock lang="tsx" code={`import { ${exportName} } from '@cascivo/charts'`} />
      </section>
    )
  }
  const fromReact = (entry.files?.[0] ?? '').includes('/packages/components/src/')
  return (
    <section class="doc-section">
      <h2>Installation</h2>
      <p class="muted">Copy the source into your project — you own it and can edit it:</p>
      <CodeBlock lang="bash" code={`npx cascivo add ${entry.name}`} />
      {fromReact ? (
        <>
          <p class="muted">Or use it from the prebuilt package, without copying:</p>
          <CodeBlock lang="tsx" code={`import { ${exportName} } from '@cascivo/react'`} />
        </>
      ) : (
        <p class="muted">
          Copy-paste only — this block/layout is not published as an importable package.
        </p>
      )}
    </section>
  )
}

function Chips({ values }: { values: string[] }) {
  if (values.length === 0) return <span class="muted">None</span>
  return (
    <div class="chips">
      {values.map((v) => (
        <span class="chip" key={v}>
          {v}
        </span>
      ))}
    </div>
  )
}

export function ComponentPage({ name }: { name?: string }) {
  const entry = getComponent(name ?? '')

  if (!entry) {
    return (
      <article class="doc-page">
        <h1>Not found</h1>
        <p class="muted">No component named “{name}”.</p>
        <a href="/">← Back home</a>
      </article>
    )
  }

  const { meta } = entry
  const Demo = demos[entry.name]

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">{CATEGORY_LABELS[entry.category] ?? entry.category}</div>
        <h1>{meta.name}</h1>
        <p class="doc-lede">{meta.description}</p>
      </header>

      <InstallSection entry={entry} />

      <section class="doc-section">
        <h2>Preview</h2>
        <div class="preview">{Demo ? <Demo /> : <span class="muted">No live preview.</span>}</div>
        <a
          class="storybook-link"
          href={storybookUrl(entry.category, meta.name)}
          target="_blank"
          rel="noopener noreferrer"
        >
          View in Storybook →
        </a>
      </section>

      {meta.examples.length > 0 && (
        <section class="doc-section">
          <h2>Examples</h2>
          {meta.examples.map((example) => (
            <div class="example" key={example.title}>
              <h3>{example.title}</h3>
              {example.description && <p class="muted">{example.description}</p>}
              <CodeBlock code={example.code} />
            </div>
          ))}
        </section>
      )}

      <section class="doc-section">
        <h2>Props</h2>
        <PropsTable props={meta.props} />
      </section>

      <section class="doc-section doc-meta-grid">
        <div>
          <h3>States</h3>
          <Chips values={meta.states} />
        </div>
        <div>
          <h3>Variants</h3>
          <Chips values={meta.variants} />
        </div>
        <div>
          <h3>Sizes</h3>
          <Chips values={meta.sizes} />
        </div>
      </section>

      <section class="doc-section">
        <h2>Tokens</h2>
        <TokenList tokens={meta.tokens} />
      </section>

      <section class="doc-section">
        <h2>Accessibility</h2>
        <ul class="a11y-list">
          <li>
            <strong>Role:</strong> <code>{meta.accessibility.role}</code>
          </li>
          <li>
            <strong>WCAG:</strong> {meta.accessibility.wcag}
          </li>
          <li>
            <strong>Keyboard:</strong>{' '}
            {meta.accessibility.keyboard.length > 0 ? (
              <Chips values={meta.accessibility.keyboard} />
            ) : (
              <span class="muted">No keyboard interaction</span>
            )}
          </li>
        </ul>
      </section>
    </article>
  )
}
