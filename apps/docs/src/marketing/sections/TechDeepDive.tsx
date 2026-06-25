import { CodeBlock, type CodeLang } from './highlight'

interface TechBlock {
  id: string
  title: string
  problem: string
  beforeLabel: string
  afterLabel: string
  before: string
  after: string
  beforeLang: CodeLang
  afterLang: CodeLang
}

const BLOCKS: TechBlock[] = [
  {
    id: 'layers',
    title: '@layer — cascade control without specificity wars',
    problem:
      'Utility frameworks and CSS-in-JS libraries fight specificity with !important or inline ' +
      'styles. @layer assigns explicit cascade priority, so component styles and overrides never ' +
      'clash — no !important, no runtime injection.',
    beforeLabel: 'Tailwind / inline styles',
    afterLabel: 'cascivo — @layer',
    beforeLang: 'css',
    afterLang: 'css',
    before: `/* Specificity arms race */
.btn { color: blue; }
/* utility class must win — no choice */
.text-red-500 { color: red !important; }`,
    after: `@layer cascivo.base, cascivo.component, cascivo.override;

@layer cascivo.component {
  .btn { color: var(--cascivo-color-accent); }
}
@layer cascivo.override {
  /* Your theme wins cleanly */
  .btn { color: var(--brand-red); }
}`,
  },
  {
    id: 'container',
    title: '@container — components that respond to their slot',
    problem:
      '@media queries respond to the viewport, not to the space a component actually occupies. ' +
      'A card inside a 300px sidebar and a card in a full-width grid look identical with media ' +
      'queries. @container adapts to the container.',
    beforeLabel: 'Media queries (viewport)',
    afterLabel: 'cascivo — @container',
    beforeLang: 'css',
    afterLang: 'css',
    before: `/* Responds to viewport width, not component width */
@media (max-width: 640px) {
  .card { flex-direction: column; }
}
/* Breaks inside a narrow sidebar at wide viewport */`,
    after: `/* Responds to the card's actual container */
.card-wrapper { container-type: inline-size; }

@container (inline-size < 20rem) {
  .card { flex-direction: column; }
}
/* Works in a 300px sidebar AND a 900px grid cell */`,
  },
  {
    id: 'has',
    title: ':has() — conditional styling without a line of JavaScript',
    problem:
      'Interactive states like "form has an error", "dialog is open", or "checkbox is checked" ' +
      'traditionally require JavaScript to add/remove classes. :has() expresses all of these in ' +
      'CSS, with zero runtime cost.',
    beforeLabel: 'JS class-toggling',
    afterLabel: 'cascivo — :has()',
    beforeLang: 'js',
    afterLang: 'css',
    before: `// JavaScript required for every visual state
input.addEventListener('invalid', () => {
  formGroup.classList.add('has-error')
})
// And cleaned up on valid, on reset, on unmount…`,
    after: `/* Pure CSS — no JS event handlers */
.form-group:has(input:invalid) .form-label {
  color: var(--cascivo-color-destructive);
}

.form-group:has(input:focus-visible) {
  outline: 2px solid var(--cascivo-color-accent);
}`,
  },
]

export function TechDeepDive({ teaser = false }: { teaser?: boolean }) {
  if (teaser) {
    return (
      <section className="section tech-deep-dive" id="tech-deep-dive" data-reveal="">
        <h2>Modern CSS changes the rules</h2>
        <p className="section-sub">
          Most UI libraries use JavaScript to manage state that CSS can already express. cascivo
          uses <code>@layer</code>, <code>@container</code>, and <code>:has()</code> to eliminate
          runtime overhead, specificity conflicts, and JS-driven visual state — everywhere they
          apply.
        </p>
        <p className="tech-deep-dive-footer">
          <a href="/modern-css" className="tech-learn-more">
            See how cascivo uses modern CSS →
          </a>
        </p>
      </section>
    )
  }

  return (
    <section className="section tech-deep-dive" id="tech-deep-dive" data-reveal="">
      <h2>Modern CSS changes the rules</h2>
      <p className="section-sub">
        Most UI libraries use JavaScript to manage state that CSS can already express. cascivo uses{' '}
        <code>@layer</code>, <code>@container</code>, and <code>:has()</code> to eliminate runtime
        overhead, specificity conflicts, and JS-driven visual state — everywhere they apply.
      </p>
      <div className="tech-blocks">
        {BLOCKS.map((block) => (
          <article key={block.id} className="tech-block" id={`tech-${block.id}`}>
            <h3 className="tech-block-title">{block.title}</h3>
            <p className="tech-block-problem">{block.problem}</p>
            <div className="tech-block-compare">
              <figure className="tech-code tech-code--before">
                <figcaption className="tech-code-label tech-code-label--before">
                  {block.beforeLabel}
                </figcaption>
                <CodeBlock code={block.before} lang={block.beforeLang} />
              </figure>
              <figure className="tech-code tech-code--after">
                <figcaption className="tech-code-label tech-code-label--after">
                  {block.afterLabel}
                </figcaption>
                <CodeBlock code={block.after} lang={block.afterLang} />
              </figure>
            </div>
          </article>
        ))}
      </div>
      <p className="tech-deep-dive-footer">
        <a href="/docs/why" className="tech-learn-more">
          Full technical rationale →
        </a>
      </p>
    </section>
  )
}
