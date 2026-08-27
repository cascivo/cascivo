const UTILITY_SOUP = `className="inline-flex items-center
justify-center gap-2 whitespace-nowrap
rounded-md text-sm font-medium
transition-colors focus-visible:outline-none
disabled:pointer-events-none [&_svg]:size-4 …"`

/**
 * The wedge: a stylesheet against a string. Both sides are real text — the left
 * is highlighted token-by-token rather than syntax-coloured, because the point
 * is which three values are yours to change.
 */
export function PosterWedge() {
  return (
    <section className="pg-section pg-cols" id="wedge" aria-label="A stylesheet, not a string">
      <div className="pg-pad">
        <p className="pg-eyebrow">01 / the wedge</p>
        <h2 className="pg-display pg-display--section pg-wedge-head">
          A stylesheet,
          <br />
          not a string
        </h2>
        <pre className="pg-pre">
          <code>
            {'.button {\n  background: '}
            <span className="pg-mark">var(--cascivo-button-bg)</span>
            {';\n  border-radius: '}
            <span className="pg-mark">var(--cascivo-radius-md)</span>
            {';\n  padding-inline: '}
            <span className="pg-mark">var(--cascivo-space-4)</span>
            {';\n}'}
          </code>
        </pre>
        <p className="pg-wedge-line">
          Three tokens. Themeable, scopable, auditable — and readable out loud by a person or an
          agent.
        </p>
      </div>

      <div className="pg-pad pg-invert">
        <p className="pg-eyebrow pg-wedge-eyebrow-quiet">the alternative</p>
        <h2 className="pg-display pg-display--section pg-wedge-head">
          Utility
          <br />
          soup
        </h2>
        <pre className="pg-pre pg-pre--quiet">
          <code>{UTILITY_SOUP}</code>
        </pre>
        <p className="pg-wedge-line">
          Every visual decision lives in a class list, in a template, behind a build step. Change
          the brand, edit the JSX.
        </p>
      </div>
    </section>
  )
}
