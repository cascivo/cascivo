import { Badge } from '@cascivo/components/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@cascivo/components/card'
import { CopyCommand } from './CopyCommand'
import { LinkButton } from './LinkButton'

const REPO = 'https://github.com/cascivo/cascivo/blob/main'

interface Argument {
  title: string
  body: string
  href?: string
  cta?: string
}

// Reuses the .proof-* card classes (see ProofTeasers) so this page needs no new CSS.
const ENTERPRISE: Argument[] = [
  {
    title: 'You own every line',
    body: 'Components are copy-pasted into your repo (the shadcn model), MIT-licensed. No runtime black box to audit, no vendor to depend on, no forced upgrades — your security team reviews real source you control.',
  },
  {
    title: 'Accessible out of the box',
    body: 'WCAG 2.2 AA, with keyboard navigation, focus management, and ARIA built into every interactive component — plus a published conformance statement and colour-blind-safe charts. Not a bolt-on.',
    href: '/accessibility',
    cta: 'See the accessibility evidence →',
  },
  {
    title: 'Fast under real load',
    body: 'Signal reactivity updates only what changed — no whole-tree re-renders on every keystroke — and bundles land well under comparable libraries. Measured against shadcn and Carbon, not asserted.',
    href: '/performance',
    cta: 'See the performance numbers →',
  },
  {
    title: 'A platform, not a parts bin',
    body: 'State, forms with validation, theming, i18n, charts, and layout all ship first-party and share one token system. Fewer third-party libraries to vet, patch, and reconcile — and one consistent API surface.',
  },
  {
    title: 'Brandable to your design language',
    body: 'A three-tier token system and data-theme scoping match any brand and run light / dark / high-contrast. Runtime theme switching with no flash of the wrong theme, and RTL support via CSS logical properties.',
    href: '/create',
    cta: 'Generate a brand theme →',
  },
  {
    title: 'Built to stay maintainable',
    body: 'Modern CSS in explicit cascade layers means no specificity wars; tokens are typed; packages are independently semver-versioned with a machine-readable breaking-changes feed, so upgrades never surprise you.',
  },
]

const AI_FIRST: Argument[] = [
  {
    title: 'Every component is machine-readable',
    body: 'One manifest per component is the single source of truth for the registry, the MCP server, the docs, and llms.txt — all generated. What your agent reads can never drift from what actually ships.',
  },
  {
    title: 'Agents write idiomatic code, first try',
    body: 'An MCP server, per-component context, and a reactivity contract mean your agent reaches for the right primitive instead of hand-rolling state, accessibility, or a chart from scratch.',
    href: '/ai',
    cta: 'See the agent workflow →',
  },
  {
    title: 'Guardrails, not vibes',
    body: 'cascivo audit --ai flags hardcoded values, invented props, and missing i18n in generated code — run it as a CI gate. Drift-guards keep docs, types, and code in lockstep so nothing silently rots.',
  },
  {
    title: 'AI-first for your team, too',
    body: 'The same machine-readable layer that helps agents helps humans: discoverable primitives, a friction-to-primitive map, and always-current docs mean fewer wrong turns and less tribal knowledge for everyone.',
  },
]

function ArgumentGrid({ items }: { items: Argument[] }) {
  return (
    <div className="proof-teasers">
      {items.map((a) => (
        <Card key={a.title} variant="outlined">
          <CardHeader>
            <CardTitle>{a.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="proof-line">{a.body}</p>
          </CardContent>
          {a.href && a.cta && (
            <CardFooter>
              <a className="proof-link" href={a.href}>
                {a.cta}
              </a>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}

export function EnterprisePitch() {
  return (
    <>
      <section className="section" id="enterprise-hero" data-reveal="">
        <Badge variant="outline">For engineering leaders</Badge>
        <h1 className="hero-title">
          Enterprise-ready. AI-native. <span className="hero-title-accent">No trade-off.</span>
        </h1>
        <p className="section-sub">
          Most design systems make you choose: own your code or move fast; ship accessible or ship
          on time; adopt AI tooling or keep quality high. cascivo is built so you don&rsquo;t. Here
          is the case for betting your product on it — and why being AI-first makes it a safer bet,
          not a riskier one.
        </p>
        <div className="hero-ctas">
          <LinkButton href="/guides">Get started</LinkButton>
          <LinkButton href={`${REPO}/docs/ENTERPRISE-READINESS.md`} variant="secondary">
            Read the technical brief
          </LinkButton>
        </div>
      </section>

      <section
        className="section"
        id="enterprise"
        aria-label="Why it's enterprise-ready"
        data-reveal=""
      >
        <h2>Why it&rsquo;s enterprise-ready</h2>
        <p className="section-sub">
          Enterprise adoption is a risk decision — about control, accessibility liability,
          performance under load, dependency surface, and long-term maintenance. cascivo answers
          each one with something you can verify, not a promise.
        </p>
        <ArgumentGrid items={ENTERPRISE} />
      </section>

      <section
        className="section"
        id="ai-first"
        aria-label="Why AI-first is durable"
        data-reveal=""
      >
        <h2>Why AI-first is a durable advantage</h2>
        <p className="section-sub">
          &ldquo;AI-first&rdquo; is usually a chatbot bolted onto docs. Here it means the system is
          built from a machine-readable core that both your agents and your team read from — so the
          quality bar holds whether a human or a model writes the code.
        </p>
        <ArgumentGrid items={AI_FIRST} />
      </section>

      <section className="section" id="enterprise-cta" data-reveal="">
        <h2>Adopt it in an afternoon.</h2>
        <p className="section-sub">
          Initialize, own the code, and ship. Nothing to license, no runtime to trust — just source
          in your repo and a machine-readable layer your agents already understand.
        </p>
        <CopyCommand command="npx cascivo init" />
        <div className="hero-ctas">
          <LinkButton href="/examples">See it in real apps</LinkButton>
          <LinkButton href="/accessibility" variant="secondary">
            Check the receipts
          </LinkButton>
        </div>
      </section>
    </>
  )
}
