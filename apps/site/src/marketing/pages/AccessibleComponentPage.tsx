import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import {
  accessibilityGuideDescription,
  accessibilityGuideTitle,
} from '../../accessibility-guide-head'
import { getComponent } from '../../data'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { applyAccessibilityGuideSeo, applyNotFoundSeo } from '../seo'
import { NotFound } from './NotFound'

/**
 * Owns its own registry lookup + head application (rather than the router in
 * App.tsx) so the ~1MB registry.json only loads with this lazy chunk — never
 * attached to the eager marketing bundle. Mirrors how DocsApp/ComponentPage
 * keep the same import isolated to the /docs/* lazy surface.
 */
export function AccessibleComponentPage({ name }: { name: string }) {
  const entry = getComponent(name)

  if (!entry || (entry.type ?? 'component') !== 'component') {
    applyNotFoundSeo()
    return <NotFound />
  }

  const { meta } = entry
  const intent = meta.intent
  applyAccessibilityGuideSeo(
    `/accessibility/${entry.name}`,
    accessibilityGuideTitle(meta),
    accessibilityGuideDescription({ name: meta.name, a11yRationale: intent?.a11yRationale ?? '' }),
  )

  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <p className="guides-eyebrow">
            <a href="/accessibility">← Accessibility</a>
          </p>
          <h1>How to build an accessible {meta.name} in React</h1>
          <p className="proof-hero-sub">{intent?.a11yRationale}</p>

          {intent?.whenToUse?.length ? (
            <section className="guides-section">
              <h2>When to use a {meta.name}</h2>
              <ul>
                {intent.whenToUse.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {intent?.whenNotToUse?.length ? (
            <section className="guides-section">
              <h2>When not to use it</h2>
              <ul>
                {intent.whenNotToUse.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {meta.accessibility.keyboard.length ? (
            <section className="guides-section">
              <h2>Keyboard interactions</h2>
              <p className="guides-section-sub">
                Role <code>{meta.accessibility.role}</code>, verified at WCAG{' '}
                {meta.accessibility.wcag}.
              </p>
              <ul>
                {meta.accessibility.keyboard.map((key) => (
                  <li key={key}>
                    <code>{key}</code>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="guides-section">
              <h2>Accessibility</h2>
              <p className="guides-section-sub">
                Role <code>{meta.accessibility.role}</code>, verified at WCAG{' '}
                {meta.accessibility.wcag}.
              </p>
            </section>
          )}

          {intent?.antiPatterns?.length ? (
            <section className="guides-section">
              <h2>Common mistakes</h2>
              {intent.antiPatterns.map((ap) => (
                <div key={ap.bad} className="guides-section">
                  <p>
                    <strong>Avoid:</strong> <code>{ap.bad}</code>
                  </p>
                  {ap.good ? (
                    <p>
                      <strong>Prefer:</strong> <code>{ap.good}</code>
                    </p>
                  ) : null}
                  <p className="guides-section-sub">{ap.why}</p>
                </div>
              ))}
            </section>
          ) : null}

          {meta.examples.length ? (
            <section className="guides-section">
              <h2>Example</h2>
              <pre className="guides-code">
                <code>{meta.examples[0]?.code}</code>
              </pre>
            </section>
          ) : null}

          <p>
            <a href={`/docs/components/${entry.name}`}>See the full {meta.name} reference →</a>
          </p>
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
