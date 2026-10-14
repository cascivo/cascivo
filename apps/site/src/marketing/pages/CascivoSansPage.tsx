import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { CopyButton } from '@cascivo/components/copy-button'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { LinkButton } from '../sections/LinkButton'
import { TypeTester } from './cascivo-sans/TypeTester'
import { FONT_BASE, FONT_FILES, SAMPLE, WEIGHT_STOPS } from './cascivo-sans/data'
import { FONT_SIZES } from './cascivo-sans/sizes.generated'
import './cascivo-sans/font.css'

const REPO = 'https://github.com/cascivo/cascivo/blob/main/fonts/cascivo-sans'

const CHARSET = [
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'abcdefghijklmnopqrstuvwxyz',
  '0123456789',
  '.,:;!?‘’“”«»()[]{}&@#%*/+−=<>€$£',
]

const PARAGRAPH =
  'A typeface for interfaces has a quiet job: stay legible at twelve pixels, hold its shape at ninety-six, and never draw attention to itself while doing either.'

const SNIPPET = `@font-face {
  font-family: 'Cascivo Sans';
  src: url('/fonts/CascivoSans-Latin[opsz,wght].woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Cascivo Sans';
  src: url('/fonts/CascivoSans-Italic-Latin[opsz,wght].woff2') format('woff2');
  font-weight: 100 900;
  font-style: italic;
  font-display: swap;
}

body {
  font-family: 'Cascivo Sans', system-ui, sans-serif;
}`

const MAKING = [
  {
    title: 'Drawn with a pen',
    body: 'Every glyph is a centre line, expanded by a model of a broad pen. The outlines are computed, not drawn, so weight, contrast and terminals stay consistent across every glyph.',
  },
  {
    title: 'Five masters, two axes',
    body: 'Thin, Regular and Black set the weight range; Caption and Display set optical size. At 8 px the letters open up and space out; at 48 px they tighten and gain contrast — the font picks the right size automatically.',
  },
  {
    title: 'Built in Python, checked like code',
    body: 'The build is a script: a lint for every glyph, unit tests, file-size budgets and Font Bakery all run before a file ships, and the same source always produces the same bytes.',
  },
]

function kb(name: string): string {
  const bytes = FONT_SIZES[name]
  return bytes === undefined ? '' : `${Math.round(bytes / 1024)} KB`
}

export function CascivoSansPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main className="cs-page">
          <section id="cs-specimen" className="proof-hero" aria-labelledby="cs-title">
            <p className="guides-eyebrow">Typeface</p>
            <h1 id="cs-title" className="cs-hero-title">
              Cascivo Sans
            </h1>
            <p className="proof-hero-sub">
              An open-source variable sans for interfaces. Weight from 100 to 900, optical size from
              8 to 48, Latin, Cyrillic and Greek — free under the SIL Open Font License.
            </p>
            <div className="cs-hero-actions">
              <LinkButton href="#cs-get">Download</LinkButton>
              <LinkButton href="#cs-try" variant="secondary">
                Try it
              </LinkButton>
            </div>
          </section>

          <section id="cs-weights" className="cs-section" aria-labelledby="cs-weights-title">
            <h2 id="cs-weights-title">Nine weights, one file</h2>
            <ul className="cs-waterfall">
              {WEIGHT_STOPS.map((stop) => (
                <li key={stop.value}>
                  <span className="cs-waterfall-label">
                    {stop.value} {stop.name}
                  </span>
                  <span className="cs-waterfall-text" style={{ fontWeight: stop.value }}>
                    {SAMPLE}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section id="cs-styles" className="cs-section" aria-labelledby="cs-styles-title">
            <h2 id="cs-styles-title">Upright and a true italic</h2>
            <div className="cs-pair">
              <p className="cs-pair-text">{PARAGRAPH}</p>
              <p className="cs-pair-text cs-italic">{PARAGRAPH}</p>
            </div>
            <div className="cs-charset" aria-label="Latin character set">
              {CHARSET.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>

          <section id="cs-try" className="cs-section" aria-labelledby="cs-try-title">
            <h2 id="cs-try-title">Try it</h2>
            <TypeTester />
          </section>

          <section id="cs-get" className="cs-section" aria-labelledby="cs-get-title">
            <h2 id="cs-get-title">Get the font</h2>
            <ul className="cs-downloads">
              {FONT_FILES.map((file) => (
                <li key={file.name}>
                  <a href={FONT_BASE + encodeURIComponent(file.name)} download={file.name}>
                    {file.label}
                  </a>
                  <span className="cs-download-meta">
                    {file.kind === 'licence' ? 'Licence' : file.kind === 'web' ? 'Web' : 'Desktop'}
                    {file.kind === 'licence' ? '' : ` · ${kb(file.name)}`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="cs-note">
              Self-host the files and serve only the axes you need. Copy them next to your CSS and
              add:
            </p>
            <div className="cs-snippet">
              <pre>
                <code>{SNIPPET}</code>
              </pre>
              <CopyButton className="cs-snippet-copy" value={SNIPPET} />
            </div>
          </section>

          <section id="cs-making" className="cs-section" aria-labelledby="cs-making-title">
            <h2 id="cs-making-title">How it's made</h2>
            <div className="cs-cards">
              {MAKING.map((card) => (
                <article className="cs-card" key={card.title}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
            <p className="cs-note">
              The full design notes are in <a href={`${REPO}/RESEARCH.md`}>RESEARCH.md</a>; every
              change is in the <a href={`${REPO}/CHANGELOG.md`}>changelog</a>.
            </p>
          </section>
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
