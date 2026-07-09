export function DocsNotFound() {
  return (
    <article class="doc-page">
      <h1>Page not found</h1>
      <p class="muted">
        There's no docs page at this address. Maybe you're looking for one of these:
      </p>
      <ul>
        <li>
          <a href="/docs/installation">Installation</a>
        </li>
        <li>
          <a href="/docs/getting-started">Getting Started</a>
        </li>
        <li>
          <a href="/docs/api">API reference</a>
        </li>
      </ul>
      <a href="/docs">← Back to docs home</a>
    </article>
  )
}
