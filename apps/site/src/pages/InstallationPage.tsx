// Installation reference — the page most adopters look for first (and the
// one that used to 404: it only existed as a section inside Getting Started).
// Keep in sync with packages/react/readme.body.md and GettingStartedPage.tsx.

import { CodeBlock } from './components/CodeBlock'

const cardStyle = {
  border: '1px solid var(--cascivo-color-border)',
  borderRadius: 'var(--cascivo-radius-lg)',
  background: 'var(--cascivo-color-surface)',
  padding: 'var(--cascivo-space-5)',
  marginBlockEnd: 'var(--cascivo-space-5)',
}

const subtle = { color: 'var(--cascivo-color-text-subtle)' }

export function InstallationPage() {
  return (
    <article style={{ maxInlineSize: '52rem' }}>
      <h1>Installation</h1>
      <p style={subtle}>
        Requires React 18+ (or Preact via <code>preact/compat</code>) and Node 18+. Pick one path —
        all three share the same tokens and themes, so they mix freely in one project. For the full
        walkthrough with theming and Next.js notes, see{' '}
        <a href="/docs/getting-started">Getting Started</a>.
      </p>

      <section style={cardStyle}>
        <h2>Scaffold a new app</h2>
        <p>A complete Vite + React app with the shell, side navigation, and a theme wired up.</p>
        <CodeBlock lang="bash" code="npx cascivo create my-app" />
      </section>

      <section style={cardStyle}>
        <h2>Prebuilt package</h2>
        <p>
          Install the components, the themes, and the signals runtime they depend on.{' '}
          <code>react</code> and <code>react-dom</code> (&gt;=18) are peers you already have.
        </p>
        <CodeBlock
          lang="bash"
          code="pnpm add @cascivo/react @cascivo/themes @preact/signals-react"
        />
        <CodeBlock
          lang="tsx"
          code={`// once, in your app entry
import '@cascivo/themes/all'

import { Button } from '@cascivo/react'`}
        />
      </section>

      <section style={cardStyle}>
        <h2>Copy-paste with the CLI</h2>
        <p>Own the source — the CLI copies a component's TSX and CSS directly into your repo.</p>
        <CodeBlock
          lang="bash"
          code={`npx cascivo init          # detect your package manager, write config
npx cascivo add button    # copy button.tsx + button.module.css into your repo`}
        />
      </section>

      <section style={cardStyle}>
        <h2>Styling</h2>
        <p>
          Every component reads <code>--cascivo-*</code> custom properties — without a theme
          imported, components render unstyled. Import <code>@cascivo/themes/all</code> once and set{' '}
          <code>data-theme="light" | "dark" | "warm"</code> on any container.
        </p>
        <p style={subtle}>
          See the <a href="/docs/tokens">Design Tokens</a> reference for the token layers and how to
          override them for your brand.
        </p>
      </section>

      <section style={cardStyle}>
        <h2>Troubleshooting an install</h2>
        <p>
          If a freshly-added component throws on render, it's usually a version mismatch between the
          copied source and an installed <code>@cascivo/*</code> peer package. Run:
        </p>
        <CodeBlock lang="bash" code="npx cascivo doctor --drift" />
        <p style={subtle}>
          This compares your installed components and their required peer package versions against
          the registry and reports exactly what's out of date.
        </p>
      </section>

      <section style={cardStyle}>
        <h2>Versioning &amp; stability</h2>
        <p>
          Packages version independently via changesets, so a low number on one package doesn't mean
          the whole system is behind. The compatibility truth is <em>per component</em>: every
          registry entry records a <code>peerVersions</code> floor for the <code>@cascivo/*</code>{' '}
          packages its copied source needs.
        </p>
        <p style={subtle}>
          Pin exact versions, run <code>cascivo doctor --drift</code> after adding components, and
          watch <a href="/breaking-changes.json">breaking-changes.json</a> (major + minor releases
          per package) to catch API drift before you upgrade.
        </p>
      </section>
    </article>
  )
}
