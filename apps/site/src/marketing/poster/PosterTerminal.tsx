import { CodeSnippet } from '@cascivo/components/code-snippet'

const CRATES = [
  {
    title: 'HTML',
    body: 'Write .cv text, get one static HTML file: reports, dashboards, landing pages. No React, no build step.',
    tag: 'cascivo-html',
    href: '/docs/guides/using-cascivo-html',
  },
  {
    title: 'Terminal',
    body: 'The same themes and class strings, painted in the terminal on ratatui. A typo is an error with a suggestion.',
    tag: 'cascivo-tui',
    href: '/docs/guides/using-cascivo-tui',
  },
] as const

const SAMPLE = `col("gap-1 p-1 border rounded text-accent", [
    text("Deploy ready").into(),
    button("Ship it", "ship").into(),
])`

/** Rust siblings (no Rust grammar in CodeSnippet, `ts` colours the call shape) of the React kit. Linked, not demoed: each has its own guide. */
export function PosterTerminal() {
  return (
    <section className="pg-section" id="terminal" aria-label="Beyond React: HTML and terminal">
      <div className="pg-pad pg-head">
        <h2 className="pg-display pg-display--section">Beyond React: HTML + terminal</h2>
        <p className="pg-eyebrow">two Rust crates</p>
      </div>
      <div className="pg-tiles pg-tiles--3">
        {CRATES.map((c) => (
          <div key={c.title} className="pg-pad pg-diff">
            <h3 className="pg-display pg-display--tile">{c.title}</h3>
            <p className="pg-body">{c.body}</p>
            <a className="pg-diff-tag" href={c.href}>
              {c.tag}
            </a>
          </div>
        ))}
        <div className="pg-pad">
          <CodeSnippet variant="multi" language="ts" code={SAMPLE} />
        </div>
      </div>
    </section>
  )
}
