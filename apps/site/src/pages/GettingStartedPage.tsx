// Hand-authored getting-started guide. The install/CSS instructions mirror
// packages/react/readme.body.md — keep the two in sync.

const cardStyle = {
  border: '1px solid var(--cascivo-color-border)',
  borderRadius: 'var(--cascivo-radius-lg)',
  background: 'var(--cascivo-color-surface)',
  padding: 'var(--cascivo-space-5)',
  marginBlockEnd: 'var(--cascivo-space-5)',
}

const code = {
  display: 'block',
  whiteSpace: 'pre-wrap' as const,
  fontFamily: 'var(--cascivo-font-mono)',
  fontSize: 'var(--cascivo-text-sm)',
  background: 'var(--cascivo-color-surface-2, var(--cascivo-color-bg-subtle))',
  border: '1px solid var(--cascivo-color-border)',
  borderRadius: 'var(--cascivo-radius-md)',
  padding: 'var(--cascivo-space-3)',
  marginBlockStart: 'var(--cascivo-space-2)',
}

const subtle = { color: 'var(--cascivo-color-text-subtle)' }

export function GettingStartedPage() {
  return (
    <article style={{ maxInlineSize: '52rem' }}>
      <h1>Getting started</h1>
      <p style={subtle}>
        Two ways to use cascivo, sharing the same tokens and themes — pick either, or mix them in
        one project. Install the prebuilt <code>@cascivo/react</code> package, or copy component
        source into your repo with the CLI.
      </p>

      <section style={cardStyle}>
        <h2>Option A — prebuilt package</h2>
        <p>
          Install the components, the themes, and the signals runtime they depend on.{' '}
          <code>react</code> and <code>react-dom</code> (&gt;=18) are peers you already have.
        </p>
        <code style={code}>pnpm add @cascivo/react @cascivo/themes @preact/signals-react</code>

        <h3 style={{ marginBlockStart: 'var(--cascivo-space-4)' }}>Set up CSS</h3>
        <p>
          Import the themes <strong>once</strong> in your entry file. That's the only global
          stylesheet — each component brings its own CSS along when you import it, and your bundler
          (Vite, webpack, Next.js) includes styles only for the components you actually use.
        </p>
        <code style={code}>{`// once, in your app entry
import '@cascivo/themes/all' // tokens (once) + base typography + light & dark

// anywhere — component CSS rides along, no styles.css to import
import { Button, Card, CardContent } from '@cascivo/react'

export function App() {
  return (
    <main data-theme="light">
      <Card>
        <CardContent>
          <Button>Save</Button>
        </CardContent>
      </Card>
    </main>
  )
}`}</code>
        <p style={subtle}>
          <strong>No bundler?</strong> If you load via CDN, import maps, or a plain{' '}
          <code>&lt;link&gt;</code>, import the aggregate sheet{' '}
          <code>@cascivo/react/styles.css</code> instead — it contains every component's CSS in one
          file. With a bundler you don't need it.
        </p>
      </section>

      <section style={cardStyle}>
        <h2>Option B — copy-paste with the CLI</h2>
        <p>
          Own the source. The CLI copies a component's TSX and its co-located CSS into your repo, so
          you can edit anything. No build step, no wrapper.
        </p>
        <code style={code}>{`npx cascivo init          # detect your package manager, write config
npx cascivo add button    # copy button.tsx + button.module.css into your repo`}</code>
        <p style={{ marginBlockStart: 'var(--cascivo-space-3)' }}>
          Then import the copied source and a theme. The component's CSS is the file that came with
          it, so there's still just one global import — the theme:
        </p>
        <code style={code}>{`import '@cascivo/themes/all'
import { Button } from './components/ui/button/button'`}</code>
      </section>

      <section style={cardStyle}>
        <h2>Themes</h2>
        <p>
          <code>@cascivo/themes/all</code> loads the tokens once, applies base typography, and ships
          the <code>light</code> and <code>dark</code> themes. Prefer à-la-carte? Import only what
          you need (each theme self-imports the tokens, deduped):
        </p>
        <code style={code}>{`import '@cascivo/themes/base'  // base typography
import '@cascivo/themes/light'
import '@cascivo/themes/dark'`}</code>
        <p style={subtle}>
          Scope a theme with <code>data-theme="light" | "dark" | "warm"</code> on any container.
          Brand adaptation is overriding <code>--cascivo-*</code> custom properties — no rebuild.
          Styles live in cascade layers (
          <code>cascivo.base &lt; cascivo.theme &lt; cascivo.component</code>); your own unlayered
          CSS always wins.
        </p>
      </section>

      <section style={cardStyle}>
        <h2>Next.js (App Router)</h2>
        <p>
          Import the themes once in a Server Component (e.g. <code>app/layout.tsx</code>).
          Components ship with <code>'use client'</code> preserved in the bundle, so they work
          inside RSC without any extra wrapper.
        </p>
        <code style={code}>{`// app/layout.tsx
import '@cascivo/themes/all'`}</code>
      </section>
    </article>
  )
}
