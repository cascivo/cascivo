import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { AgentLayer } from '../sections/AgentLayer'
import { CtaBand } from '../sections/CtaBand'

export function AiPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <section className="proof-hero" aria-label="AI-first design system overview">
            <p className="guides-eyebrow">AI layer</p>
            <h1>
              An <span className="proof-hero-accent">AI-first</span> design system, not an AI-aware
              one.
            </h1>
            <p className="proof-hero-sub">
              Every cascivo component ships a machine-readable manifest. An MCP server, Claude Code
              skills, and <code>llms.txt</code> all derive from it — so your agent can discover,
              build, and audit real cascivo UI without guessing.
            </p>
          </section>
          <AgentLayer />
          <CtaBand />
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
