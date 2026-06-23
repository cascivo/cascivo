import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { CtaBand } from '../sections/CtaBand'
import { FlowHighlight } from '../sections/FlowHighlight'
import { EditorHighlight } from '../sections/EditorHighlight'
import { IconShowcase } from '../sections/IconShowcase'

export function HighlightsPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <section className="proof-hero" aria-label="Highlights overview">
            <p className="guides-eyebrow">Highlights</p>
            <h1>
              The newest <span className="proof-hero-accent">cascivo</span> surfaces.
            </h1>
            <p className="proof-hero-sub">
              Beyond the component library: a signal-driven flow/diagram engine, a CSS-native code
              editor, and a tree-shakeable icon set. Each one is live below — pan a graph, edit some
              Markdown, scan the glyphs.
            </p>
          </section>
          <FlowHighlight />
          <hr className="flow-divider" />
          <EditorHighlight />
          <hr className="flow-divider" />
          <IconShowcase />
          <CtaBand />
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
