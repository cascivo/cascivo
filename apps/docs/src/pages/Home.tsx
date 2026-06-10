import { CATEGORY_LABELS, components } from '../data'
import { buildNav } from '../nav'
import { CodeBlock } from './components/CodeBlock'

const QUICK_START = `npx cascade init
npx cascade add button`

const USAGE = `import { Button } from './components/ui/button/button'

export function App() {
  return <Button>Get started</Button>
}`

export function Home() {
  const nav = buildNav()

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">cascade ui</div>
        <h1>The CSS-native, signal-driven, AI-first design system</h1>
        <p class="doc-lede">
          {components.length} owned components. Copy-paste via CLI, styled with modern CSS, driven
          by Preact Signals, documented for agents.
        </p>
      </header>

      <section class="doc-section">
        <h2>Quick start</h2>
        <CodeBlock code={QUICK_START} lang="bash" />
        <CodeBlock code={USAGE} />
      </section>

      <section class="doc-section">
        <h2>Components</h2>
        {nav.map((group) => (
          <div class="home-group" key={group.category}>
            <h3>{CATEGORY_LABELS[group.category]}</h3>
            <div class="home-grid">
              {group.items.map((item) => (
                <a class="home-card" href={item.href} key={item.name}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
    </article>
  )
}
