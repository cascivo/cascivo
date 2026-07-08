import { isThemeName, THEME_LABELS, THEME_TAGLINES } from '../theme-head'

export function ThemePage({ theme }: { theme?: string }) {
  const key = theme ?? ''

  if (!isThemeName(key)) {
    return (
      <article class="doc-page">
        <h1>Not found</h1>
        <p class="muted">No theme named "{theme}".</p>
        <a href="/docs">← Back home</a>
      </article>
    )
  }

  const label = THEME_LABELS[key]

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Theme</div>
        <h1>{label}</h1>
        <p class="doc-lede">{THEME_TAGLINES[key]}</p>
      </header>

      <section class="doc-section">
        <h2>Use it</h2>
        <pre class="code-plain">
          <code>{`@import '@cascivo/themes/${key}.css';`}</code>
        </pre>
        <pre class="code-plain">
          <code>{`<html data-theme="${key}">`}</code>
        </pre>
      </section>

      <section class="doc-section">
        <h2>Customize it</h2>
        <p class="muted">
          Override any semantic or component token to make it yours — see the{' '}
          <a href="/guides/customization">customization guide</a>, or generate a full brand theme
          from a single color in the <a href="/create">theme configurator</a>.
        </p>
      </section>

      <p>
        <a href="/docs">← Back to docs</a>
      </p>
    </article>
  )
}
