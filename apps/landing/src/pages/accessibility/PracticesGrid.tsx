const PRACTICES = [
  {
    title: 'Focus, visible',
    line: 'Every interactive component styles :focus-visible through the --cascivo-focus-ring token. Keyboard users always see where they are.',
  },
  {
    title: 'Reduced motion',
    line: "All motion — including this page's scroll reveals — sits behind prefers-reduced-motion: no-preference. Opt out at the OS level and nothing moves.",
  },
  {
    title: 'RTL by construction',
    line: 'The CSS uses logical properties only — margin-inline, padding-block, inset-inline. Set dir="rtl" and layouts mirror without overrides.',
  },
  {
    title: 'Translated chrome',
    line: 'Screen-reader labels and component chrome strings resolve from the @cascivo/i18n builtin catalog — overridable per instance, never hardcoded English.',
  },
  {
    title: 'Theme parity, tested',
    line: 'A vitest suite asserts every theme defines every semantic token, so no theme can ship a missing contrast-critical color.',
  },
  {
    title: 'Axe on every push',
    line: 'Playwright + axe sweep the landing pages in light and dark in CI, and the bench a11y gate fails the build on a single violation.',
  },
]

export function PracticesGrid() {
  return (
    <section className="section" id="practices" data-reveal="">
      <h2>Engineering practices, not promises</h2>
      <p className="section-sub">
        Accessibility that lives in tooling survives refactors. These are the mechanisms in the repo
        today.
      </p>
      <div className="a11y-practices">
        {PRACTICES.map((p) => (
          <article key={p.title} className="a11y-practice">
            <h3>{p.title}</h3>
            <p>{p.line}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
