interface Point {
  title: string
  body: string
}

/**
 * The one place the landing page argues *against* itself before arguing for itself.
 *
 * StyleX, Panda and every CSS-in-JS system put a component's styles in the same file as its
 * markup, and that is genuinely nicer to work in. cascivo does not, and pretending otherwise
 * would be the kind of comparison nobody believes. So the cost is stated first, in the
 * heading, and the reasons follow — because the reasons are good and they survive being
 * put second.
 */
const POINTS: Point[] = [
  {
    title: 'The second file is CSS',
    body: 'Not a CSS-shaped object dialect — actual CSS, which every developer, every tool and every model already knows. :has(), @container, color-mix() and whatever ships next year work the day the browser supports them, with no compiler release in between.',
  },
  {
    title: 'It is why there is no build step',
    body: 'A CSS file is already the artifact. Colocating styles into the component means compiling them back out again — and that compiler is the thing cascivo does not want to own, or ask you to install.',
  },
  {
    // Two lines, like the other three titles in the row — at three lines this
    // one started its body copy below theirs.
    title: 'Markup stays readable',
    body: 'The structure/style split is the point, not a side effect. You read JSX to find the DOM, not through a layer of style objects.',
  },
  {
    title: 'It survives copy-paste',
    body: 'Running cascivo add button copies both files into your repo and they keep working — no plugin in your bundler, nothing to configure.',
  },
]

export function PosterColocation() {
  return (
    <section className="pg-section" id="colocation" aria-label="Why styles live in a second file">
      <div className="pg-pad pg-head">
        <h2 className="pg-display pg-display--section">Two files, on purpose</h2>
        <p className="pg-eyebrow">07 / the tradeoff</p>
      </div>
      <div className="pg-pad pg-compare-pad">
        <p className="pg-body pg-compare-lede">
          A cascivo component is <code>button.tsx</code> plus <code>button.module.css</code>.
          CSS-in-JS systems put both in one file, and that is a real advantage they have: one file
          to open, one file in a diff, one place for a change that touches both. We are not claiming
          two is nicer than one. It is a price, and this is what it buys.
        </p>
      </div>
      <div className="pg-tiles pg-tiles--4">
        {POINTS.map((point, i) => (
          <div key={point.title} className="pg-pad pg-diff">
            <p className="pg-diff-num">{String(i + 1).padStart(2, '0')}</p>
            <h3 className="pg-display pg-display--tile">{point.title}</h3>
            <p className="pg-body">{point.body}</p>
          </div>
        ))}
      </div>
      <div className="pg-pad pg-compare-pad">
        <p className="pg-note pg-compare-foot">
          If colocation matters to you more than avoiding a compiler, StyleX makes the other trade
          honestly and you should take it —{' '}
          <a href="/docs/compared-to-stylex.md">the full comparison</a> says so in as many words.
        </p>
      </div>
    </section>
  )
}
