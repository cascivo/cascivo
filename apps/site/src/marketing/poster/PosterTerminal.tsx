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
  {
    title: 'Native',
    body: 'The same .cv text in a native window on the Blitz engine. No browser; signals and event handlers in Rust. A git dependency until Blitz 0.3 is stable.',
    tag: 'cascivo-blitz',
    href: '/docs/guides/using-cascivo-blitz',
  },
  {
    title: 'Sites',
    body: 'Markdown, collections, locales and RSS in, a static site out. One Rust binary, no Node build.',
    tag: 'cascivo-web',
    href: '/docs/guides/using-cascivo-web',
  },
] as const

const SAMPLE = `col("gap-1 p-1 border rounded text-accent", [
    text("Deploy ready").into(),
    button("Ship it", "ship").into(),
])`

/** Rust siblings (no Rust grammar in CodeSnippet, `ts` colours the call shape) of the React kit. Linked, not demoed: each has its own guide. */
export function PosterTerminal() {
  return (
    <section
      className="pg-section"
      id="terminal"
      aria-label="Beyond React: HTML, terminal, native and static sites"
    >
      <div className="pg-pad pg-head">
        <h2 className="pg-display pg-display--section">
          Beyond React: HTML, terminal, native, sites
        </h2>
        <p className="pg-eyebrow">four Rust crates</p>
      </div>
      <div className="pg-tiles pg-tiles--4">
        {CRATES.map((c) => (
          <div key={c.title} className="pg-pad pg-diff">
            <h3 className="pg-display pg-display--tile">{c.title}</h3>
            <p className="pg-body">{c.body}</p>
            <a className="pg-diff-tag" href={c.href}>
              {c.tag}
            </a>
          </div>
        ))}
      </div>
      <div className="pg-cols">
        <div className="pg-pad">
          <CodeSnippet variant="multi" language="ts" code={SAMPLE} />
        </div>
      </div>
    </section>
  )
}
