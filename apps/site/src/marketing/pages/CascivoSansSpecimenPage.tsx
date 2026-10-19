import type { CSSProperties, ReactNode } from 'react'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Button } from '@cascivo/components/button'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import {
  AMBIGUOUS_CONTEXT,
  BASE_INDEX,
  BRACKETS_CAPS,
  BRACKETS_CASE,
  BRACKETS_LOWER,
  CONTROL_STRINGS,
  DASHES,
  DASH_CONTEXT,
  DOT_LINE,
  DOT_WEIGHTS,
  GLYPH_PAIRS,
  GLYPH_VARIANTS,
  QUOTES,
  QUOTES_CONTEXT,
  SAMPLE,
  SMALL_LINE,
  SMALL_SIZES,
  SPECIMEN_WEIGHTS,
  TAB_LABELS,
  limitFor,
  meterFill,
  widthDelta,
} from './cascivo-sans/specimen'
import './cascivo-sans/font.css'
import './cascivo-sans/specimen.css'

const FAMILY = '"Cascivo Sans"'
/** The size the brief measures at: big enough that rounding noise stays under 0.1%. */
const MEASURE_PX = 40

/** Canvas width of `text` at each weight, after the face for that weight has loaded. */
async function measureWeights(text: string): Promise<number[]> {
  await Promise.all(
    SPECIMEN_WEIGHTS.map((w) => document.fonts.load(`${w.value} ${MEASURE_PX}px ${FAMILY}`, text)),
  )
  const ctx = document.createElement('canvas').getContext('2d')
  if (ctx === null) return []
  ctx.fontKerning = 'normal'
  return SPECIMEN_WEIGHTS.map((w) => {
    ctx.font = `${w.value} ${MEASURE_PX}px ${FAMILY}`
    return ctx.measureText(text).width
  })
}

function SectionHead({ n, title, children }: { n: string; title: string; children: string }) {
  return (
    <header className="sp-head">
      <p className="sp-label">
        {n} · {title}
      </p>
      <h2 id={`sp-${n}-title`}>{children}</h2>
    </header>
  )
}

function Section({
  n,
  title,
  heading,
  children,
}: {
  n: string
  title: string
  heading: string
  children: ReactNode
}) {
  return (
    <section id={`sp-${n}`} className="sp-section" aria-labelledby={`sp-${n}-title`}>
      <SectionHead n={n} title={title}>
        {heading}
      </SectionHead>
      {children}
    </section>
  )
}

function TabRow({ id, className, weight }: { id?: string; className: string; weight?: number }) {
  const style: CSSProperties | undefined = weight === undefined ? undefined : { fontWeight: weight }
  return (
    <div className="sp-scroll">
      <div id={id} className={className} style={style}>
        {TAB_LABELS.map((label) => (
          <a key={label} href="#sp-02" className="sp-tab">
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}

export function CascivoSansSpecimenPage() {
  useSignals()
  const widths = useSignal<number[] | null>(null)
  const bold = useSignal(false)

  // `…` until the faces are in and measured; a failed measurement leaves `…` rather than a lie.
  useSignalEffect(() => {
    let live = true
    measureWeights(SAMPLE).then(
      (measured) => {
        if (live && measured.length > 0) widths.value = measured
      },
      () => undefined,
    )
    return () => {
      live = false
    }
  })

  const rows =
    widths.value === null
      ? null
      : widthDelta(
          widths.value,
          BASE_INDEX,
          SPECIMEN_WEIGHTS.map((w) => limitFor(w.value)),
        )

  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main className="cs-page cs-specimen">
          <div className="sp-wrap">
            <header className="sp-intro">
              <p className="sp-label">Stress test · Cascivo Sans</p>
              <h1>Where the font breaks</h1>
              <p className="sp-lede">
                Each section isolates one thing a UI font has to get right. Everything here is the
                real font file, measured live in your browser.
              </p>
              <p>
                <a href="/cascivo-sans">Back to Cascivo Sans</a>
              </p>
            </header>

            <Section
              n="01"
              title="Weight steps and width drift"
              heading="Stem thickness should step evenly; line width should stay put"
            >
              <div className="sp-weights">
                <div className="sp-weights-head" aria-hidden="true">
                  <span>Weight</span>
                  <span>Stems</span>
                  <span>Width vs 400</span>
                </div>
                {SPECIMEN_WEIGHTS.map((w, i) => {
                  const row = rows?.[i]
                  const fill = meterFill(row?.delta ?? 0)
                  return (
                    <div
                      className="sp-weight"
                      key={w.value}
                      data-weight={w.value}
                      data-display={w.display ? '' : undefined}
                      data-over={row?.over ? '' : undefined}
                    >
                      <span className="sp-weight-name">
                        {w.value} {w.name}
                        {w.note === '' ? null : <span className="sp-weight-note">{w.note}</span>}
                      </span>
                      <span className="sp-stems" style={{ fontWeight: w.value }}>
                        nHIn
                      </span>
                      <div className="sp-meter">
                        <span className="sp-track" aria-hidden="true">
                          <span className="sp-tick" />
                          <span
                            className="sp-fill"
                            style={{
                              insetInlineStart: `${fill.start}%`,
                              inlineSize: `${fill.size}%`,
                            }}
                          />
                        </span>
                        <span className="sp-delta" data-delta>
                          {row?.label ?? '…'}
                          {row?.over ? <span className="sp-sr"> over the limit</span> : null}
                        </span>
                      </div>
                      <div
                        className="sp-scroll sp-sample-wrap"
                        role="region"
                        aria-label={`Sample line at weight ${w.value}`}
                        tabIndex={0}
                      >
                        <span className="sp-sample" style={{ fontWeight: w.value }}>
                          {SAMPLE}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="sp-note">
                Bars grow left (narrower) or right (wider) from the 400 tick, 5% of the track per 1%
                of difference. Compare where each sample line ends. Weights 100 to 700 must stay
                within ±2% of 400, or a state change that swaps the weight reflows the layout. 800
                and 900 are display weights, set large in headings, and may run up to 5% wider (2%
                narrower). The fill turns to the warning colour only past a weight&apos;s own limit.
                Width is measured with canvas <code>measureText</code> at {MEASURE_PX}px.
              </p>
            </Section>

            <Section
              n="02"
              title="Reflow on state change"
              heading="Hover a tab, or toggle bold, and watch the row shift"
            >
              <div className="sp-toggle">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    bold.value = !bold.value
                  }}
                >
                  {bold.value ? 'Set row to 400' : 'Set row to 700'}
                </Button>
              </div>
              <div className="sp-tabs">
                <p className="sp-label">Row A · each tab goes to 700 on hover or focus</p>
                <TabRow id="sp-tabs-hover" className="sp-tabrow sp-tabrow-hover" />
                <p className="sp-label">Row B · the whole row, set by the button</p>
                <TabRow id="sp-tabs-toggle" className="sp-tabrow" weight={bold.value ? 700 : 400} />
              </div>
            </Section>

            <Section
              n="03"
              title="Italic or oblique"
              heading="A true italic changes these shapes; an oblique only slants them"
            >
              <div className="sp-two">
                <div className="sp-cell">
                  <p className="sp-label">Upright</p>
                  <p className="sp-afegky">afegky</p>
                </div>
                <div className="sp-cell">
                  <p className="sp-label">Italic</p>
                  <p className="sp-afegky sp-italic">afegky</p>
                </div>
              </div>
              <p className="sp-note">
                Check: single-story <em>a</em>, descending <em>f</em>, rounded <em>e</em>, exit
                strokes on <em>k</em> and <em>y</em>. If none change, call it Oblique.
              </p>
              <div className="sp-two sp-color">
                <p>
                  Color check: the italic paragraph should look as dark and as evenly spaced as this
                  one.
                </p>
                <p className="sp-italic">
                  Color check: the italic paragraph should look as dark and as evenly spaced as this
                  one.
                </p>
              </div>
            </Section>

            <Section
              n="04"
              title="Ambiguous glyphs"
              heading="Every pair must be readable without context"
            >
              <ul className="sp-pairs">
                {GLYPH_PAIRS.map((pair) => (
                  <li key={pair.glyphs}>
                    <span className="sp-pair-glyphs">{pair.glyphs}</span>
                    <span className="sp-label">{pair.note}</span>
                  </li>
                ))}
              </ul>
              <div className="sp-line">
                <p className="sp-label">In context</p>
                <p className="sp-context">{AMBIGUOUS_CONTEXT}</p>
              </div>
              <div className="sp-line">
                <p className="sp-label">
                  Alternates · <code>ss01</code> dotted zero, <code>ss02</code> plain I and l,{' '}
                  <code>zero</code> slashed zero (wins over <code>ss01</code>)
                </p>
                <ul className="sp-pairs sp-variants">
                  {GLYPH_VARIANTS.map((v) => (
                    <li key={v.label}>
                      <span className="sp-pair-glyphs" style={{ fontFeatureSettings: v.features }}>
                        {v.text}
                      </span>
                      <span className="sp-label">
                        {v.label} · {v.note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>

            <Section
              n="05"
              title="Punctuation and symbols"
              heading="Dashes, quotes, brackets, dots"
            >
              <div className="sp-cards">
                <div className="sp-cell">
                  <p className="sp-label">Hyphen · en dash · em dash · minus</p>
                  <p className="sp-dashes" id="sp-dashes">
                    {DASHES.map((d) => (
                      <span key={d.name} data-dash={d.name} title={d.name}>
                        {d.char}
                      </span>
                    ))}
                  </p>
                  <p className="sp-context">{DASH_CONTEXT}</p>
                </div>
                <div className="sp-cell">
                  <p className="sp-label">Quotes</p>
                  <p className="sp-quotes">{QUOTES}</p>
                  <p className="sp-context">{QUOTES_CONTEXT}</p>
                </div>
                <div className="sp-cell">
                  <p className="sp-label">Brackets with caps and lowercase</p>
                  <p className="sp-brackets">{BRACKETS_CAPS}</p>
                  <p className="sp-brackets">{BRACKETS_LOWER}</p>
                </div>
                <div className="sp-cell">
                  <p className="sp-label">
                    Brackets and dashes with <code>case</code> on, centred on the capitals
                  </p>
                  <p className="sp-label">case on</p>
                  <p className="sp-brackets" style={{ fontFeatureSettings: '"case"' }}>
                    {BRACKETS_CASE}
                  </p>
                  <p className="sp-label">case off</p>
                  <p className="sp-brackets">{BRACKETS_CASE}</p>
                </div>
                <div className="sp-cell">
                  <p className="sp-label">Dots across weights</p>
                  {DOT_WEIGHTS.map((weight) => (
                    <p className="sp-dots" key={weight} style={{ fontWeight: weight }}>
                      {DOT_LINE} {weight}
                    </p>
                  ))}
                </div>
              </div>
            </Section>

            <Section
              n="06"
              title="Spacing and kerning"
              heading="Control strings should look evenly gray"
            >
              <div className="sp-controls">
                {CONTROL_STRINGS.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </Section>

            <Section n="07" title="Small sizes" heading="Where an interface font actually lives">
              <div className="sp-small">
                {SMALL_SIZES.map((px) => (
                  <div className="sp-small-row" key={px}>
                    <span className="sp-label">{px}px</span>
                    <p style={{ fontSize: `${px / 16}rem`, fontWeight: 300 }}>
                      Light: {SMALL_LINE}
                    </p>
                    <p style={{ fontSize: `${px / 16}rem` }}>Regular: {SMALL_LINE}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
