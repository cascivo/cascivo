// Hand-authored getting-started guide. The install/CSS instructions mirror
// packages/react/readme.body.md — keep the two in sync.

import { CodeBlock } from './components/CodeBlock'

const cardStyle = {
  border: '1px solid var(--cascivo-color-border)',
  borderRadius: 'var(--cascivo-radius-lg)',
  background: 'var(--cascivo-color-surface)',
  padding: 'var(--cascivo-space-5)',
  marginBlockEnd: 'var(--cascivo-space-5)',
}

const subtle = { color: 'var(--cascivo-color-text-subtle)' }

export function GettingStartedPage() {
  return (
    <article style={{ maxInlineSize: '52rem' }}>
      <h1>Getting started</h1>
      <p style={subtle}>
        The fastest path is <code>npx cascivo create</code> — a complete app, scaffolded. Already
        have a project? Use the prebuilt <code>@cascivo/react</code> package, or copy component
        source into your repo with the CLI. All three share the same tokens and themes; mix them in
        one project.
      </p>

      <section style={cardStyle}>
        <h2>Fastest — scaffold a new app</h2>
        <p>
          One command: a Vite + React app with the app shell, side navigation, and a theme wired up.
          Open it and start building.
        </p>
        <CodeBlock lang="bash" code="npx cascivo create my-app" />
      </section>

      <section style={cardStyle}>
        <h2>Option A — prebuilt package</h2>
        <p>
          Install the components, the themes, and the signals runtime they depend on.{' '}
          <code>react</code> and <code>react-dom</code> (&gt;=18) are peers you already have.
        </p>
        <CodeBlock
          lang="bash"
          code="pnpm add @cascivo/react @cascivo/themes @preact/signals-react"
        />

        <h3 style={{ marginBlockStart: 'var(--cascivo-space-4)' }}>Set up CSS</h3>
        <p>
          Import the themes <strong>once</strong> in your entry file. That's the only global
          stylesheet — each component brings its own CSS along when you import it, and your bundler
          (Vite, webpack, Next.js) includes styles only for the components you actually use.
        </p>
        <CodeBlock
          lang="tsx"
          code={`// once, in your app entry
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
}`}
        />
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
        <CodeBlock
          lang="bash"
          code={`npx cascivo init          # detect your package manager, write config
npx cascivo add button    # copy button.tsx + button.module.css into your repo`}
        />
        <p style={{ marginBlockStart: 'var(--cascivo-space-3)' }}>
          Then import the copied source and a theme. The component's CSS is the file that came with
          it, so there's still just one global import — the theme:
        </p>
        <CodeBlock
          lang="tsx"
          code={`import '@cascivo/themes/all'
import { Button } from './components/ui/button/button'`}
        />
      </section>

      <section style={cardStyle}>
        <h2>Themes</h2>
        <p>
          <code>@cascivo/themes/all</code> loads the tokens once, applies base typography, and ships
          the <code>light</code> and <code>dark</code> themes. Prefer à-la-carte? Import only what
          you need (each theme self-imports the tokens, deduped):
        </p>
        <CodeBlock
          lang="tsx"
          code={`import '@cascivo/themes/base'  // base typography
import '@cascivo/themes/light'
import '@cascivo/themes/dark'`}
        />
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
        <CodeBlock
          lang="tsx"
          code={`// app/layout.tsx
import '@cascivo/themes/all'`}
        />
      </section>
    </article>
  )
}
