import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@cascivo/components/card'

const REPO = 'https://github.com/cascivo/cascivo/blob/main'

interface Primitive {
  title: string
  api: string
  line: string
  href: string
  cta: string
}

// Reuses the .proof-* classes (see ProofTeasers) so this needs no new CSS.
const PRIMITIVES: Primitive[] = [
  {
    title: 'Reactivity & state',
    api: 'useSignal · useComputed · useControllableSignal · useScope',
    line: 'The signal is the state — not useState, useContext, or useEffect. Fine-grained updates, no subtree re-renders, and scopes that dispose on unmount so state never leaks across routes.',
    href: `${REPO}/docs/HEADLESS.md`,
    cta: 'The primitive catalog →',
  },
  {
    title: 'Forms',
    api: 'createForm · useForm · Form · field()',
    line: 'A signal-backed store with sync/async and Standard Schema (zod/valibot) validation, plus validateOnChange — keystroke validation with zero re-renders. No separate form library.',
    href: `${REPO}/docs/ENTERPRISE-READINESS.md`,
    cta: 'Forms without the re-renders →',
  },
  {
    title: 'Theming',
    api: 'ThemeProvider · useTheme · themePreloadScript',
    line: 'Persist a theme, drive the data-theme attribute, and pre-paint on SSR with no flash of the wrong theme — not a useEffect that toggles a .dark class. Scope a theme to any subtree.',
    href: `${REPO}/docs/ENTERPRISE-READINESS.md`,
    cta: 'The theme runtime →',
  },
]

export function PrimitivesLayer() {
  return (
    <section className="section" id="primitives" aria-label="The primitive layer" data-reveal="">
      <h2>State is a primitive, not a bolt-on.</h2>
      <p className="section-sub">
        Under the components sits a signal-native layer — reactivity, forms, and theming — so you
        never reach for a React state hook, a form library, or a theme hack. It is the same layer
        the components are built on, and it is yours to build with directly.
      </p>
      <div className="proof-teasers">
        {PRIMITIVES.map((p) => (
          <Card key={p.title} variant="outlined">
            <CardHeader>
              <CardTitle>{p.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="proof-number-label">{p.api}</p>
              <p className="proof-line">{p.line}</p>
            </CardContent>
            <CardFooter>
              <a className="proof-link" href={p.href}>
                {p.cta}
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
      <p className="primitives-cta">
        <a className="proof-link" href="/enterprise">
          Why cascivo is enterprise-ready and AI-first &rarr;
        </a>
      </p>
    </section>
  )
}
