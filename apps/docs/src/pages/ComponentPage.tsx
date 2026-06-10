import { CATEGORY_LABELS, getComponent } from '../data'
import { demos } from '../demos'
import { CodeBlock } from './components/CodeBlock'
import { PropsTable } from './components/PropsTable'
import { TokenList } from './components/TokenList'

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
        <div class="doc-eyebrow">{CATEGORY_LABELS[entry.category]}</div>
        <h1>{meta.name}</h1>
        <p class="doc-lede">{meta.description}</p>
      </header>

      <section class="doc-section">
        <h2>Preview</h2>
        <div class="preview">{Demo ? <Demo /> : <span class="muted">No live preview.</span>}</div>
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
