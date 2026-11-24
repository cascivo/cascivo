import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { CopyButton } from '@cascivo/components/copy-button'
import { Header } from '../../sections/Header'
import { Footer } from '../../sections/Footer'
import { LinkButton } from '../../sections/LinkButton'
import { TypeTester } from '../cascivo-sans/TypeTester'
import { WeightWaterfall } from '../cascivo-sans/WeightWaterfall'
import { formatKb } from '../cascivo-sans/data'
import { FAMILIES, familyCssFamily, familyHref, familySnippet, type FontFamily } from './families'
import { FAMILY_SIZES } from './sizes.generated'
import '../cascivo-sans/font.css'
import './fonts.css'
import '../../font-faces/mono.css'
import '../../font-faces/serif.css'
import '../../font-faces/condensed.css'

const CHARSET = [
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'abcdefghijklmnopqrstuvwxyz',
  '0123456789',
  '.,:;!?‘’“”«»()[]{}&@#%*/+−=<>€$£',
]

const PARAGRAPH =
  'A typeface for interfaces has a quiet job: stay legible at twelve pixels, hold its shape at ninety-six, and never draw attention to itself while doing either.'

/** A family page: hero, weights, character set, tester, downloads. Same sections as /cascivo-sans. */
export function FamilyPage({ family }: { family: FontFamily }) {
  const snippet = familySnippet(family)
  const slug = family.id
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main className="cs-page" style={{ fontFamily: familyCssFamily(family) }}>
          <section id={`cs-${slug}`} className="proof-hero" aria-labelledby="cs-title">
            <p className="guides-eyebrow">Typeface · {family.tagline}</p>
            <h1 id="cs-title" className="cs-hero-title">
              {family.name}
            </h1>
            <p className="proof-hero-sub">{family.summary}</p>
            <div className="cs-hero-actions">
              <LinkButton href="#cs-get">Download</LinkButton>
              <LinkButton href="#cs-try" variant="secondary">
                Try it
              </LinkButton>
              <LinkButton href="/fonts" variant="secondary">
                All fonts
              </LinkButton>
            </div>
          </section>

          <section id="cs-why" className="cs-section" aria-labelledby="cs-why-title">
            <h2 id="cs-why-title">About {family.name}</h2>
            <ul className="cs-why">
              {family.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>

          <section id="cs-weights" className="cs-section" aria-labelledby="cs-weights-title">
            <h2 id="cs-weights-title">Nine weights, one file</h2>
            <WeightWaterfall compare={false} />
          </section>

          <section id="cs-styles" className="cs-section" aria-labelledby="cs-styles-title">
            <h2 id="cs-styles-title">Character set</h2>
            <p className="cs-pair-text">{PARAGRAPH}</p>
            <div className="cs-charset" role="group" aria-label="Latin character set">
              {CHARSET.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>

          <section id="cs-try" className="cs-section" aria-labelledby="cs-try-title">
            <h2 id="cs-try-title">Try it</h2>
            <TypeTester italic={false} />
          </section>

          <section id="cs-get" className="cs-section" aria-labelledby="cs-get-title">
            <h2 id="cs-get-title">Get the font</h2>
            <ul className="cs-downloads">
              {family.files.map((file) => {
                const bytes = FAMILY_SIZES[`${family.id}/${file.name}`]
                return (
                  <li key={file.name}>
                    <a href={familyHref(family, file.name)} download={file.name}>
                      {file.label}
                    </a>
                    <span className="cs-download-meta">
                      {file.kind === 'web' ? 'Web' : 'Desktop'}
                      {bytes === undefined ? '' : ` · ${formatKb(bytes)}`}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="cs-note">
              Self-host the files and serve only the axes you need. Copy them next to your CSS and
              add:
            </p>
            <div className="cs-snippet">
              <pre>
                <code>{snippet}</code>
              </pre>
              <CopyButton className="cs-snippet-copy" value={snippet} />
            </div>
          </section>
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}

export function CascivoMonoPage() {
  return <FamilyPage family={FAMILIES.find((f) => f.id === 'mono') ?? FAMILIES[0]!} />
}
export function CascivoSerifPage() {
  return <FamilyPage family={FAMILIES.find((f) => f.id === 'serif') ?? FAMILIES[0]!} />
}
export function CascivoCondensedPage() {
  return <FamilyPage family={FAMILIES.find((f) => f.id === 'condensed') ?? FAMILIES[0]!} />
}
