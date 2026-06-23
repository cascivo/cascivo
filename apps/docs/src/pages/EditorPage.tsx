import { CodeEditor, Highlight } from '@cascivo/editor'

const tsSample = `interface User {
  id: string
  name: string
  active: boolean
}

// Greet a user by name
function greet(user: User): string {
  return \`Hello, \${user.name}!\`
}

const ada: User = { id: '1', name: 'Ada', active: true }
console.log(greet(ada))
`

const jsonSample = `{
  "name": "@cascivo/editor",
  "version": "0.0.1",
  "private": false,
  "keywords": ["editor", "syntax-highlighting"]
}
`

const cssSample = `.button {
  /* themed via tokens */
  color: var(--cascivo-color-accent);
  padding-inline: 1rem;
}
`

const htmlSample = `<!-- a small fragment -->
<nav class="bar">
  <a href="/">Home</a>
</nav>
`

const mdSample = `# Title

Some **bold** and _italic_ text.

- one
- two

\`\`\`bash
echo "fenced code"
\`\`\`
`

const bashSample = `#!/usr/bin/env bash
for i in 1 2 3; do
  echo "count: $i"
done
`

const GALLERY: Array<{ language: string; label: string; value: string }> = [
  { language: 'typescript', label: 'TypeScript', value: tsSample },
  { language: 'json', label: 'JSON', value: jsonSample },
  { language: 'css', label: 'CSS', value: cssSample },
  { language: 'html', label: 'HTML', value: htmlSample },
  { language: 'markdown', label: 'Markdown', value: mdSample },
  { language: 'bash', label: 'Bash', value: bashSample },
]

export function EditorPage() {
  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Code editing</div>
        <h1>Editor</h1>
        <p class="doc-lede">
          A lightweight, CSS-native code editor. A native <code>&lt;textarea&gt;</code> overlays a
          syntax-highlighted layer, so the browser owns the caret, selection, IME, undo, and
          accessibility — JS only tokenizes and syncs scroll. Zero runtime dependencies, themed
          through the cascivo token system.
        </p>
      </header>

      <section class="doc-section">
        <h2>CodeEditor</h2>
        <p>
          Editable, controllable code field with a line-number gutter, current-line highlight, and
          Tab/Shift-Tab indent. Try editing it:
        </p>
        <CodeEditor language="typescript" defaultValue={tsSample} style={{ blockSize: '20rem' }} />
      </section>

      <section class="doc-section">
        <h2>Languages</h2>
        <p>
          Small, tree-shakeable grammars: <code>plaintext</code>, <code>json</code>,{' '}
          <code>javascript</code>, <code>typescript</code>, <code>css</code>, <code>html</code>,{' '}
          <code>markdown</code>, <code>bash</code>. Register your own with{' '}
          <code>registerGrammar</code>.
        </p>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {GALLERY.map((item) => (
            <div key={item.language}>
              <strong>{item.label}</strong>
              <Highlight language={item.language} value={item.value} lineNumbers />
            </div>
          ))}
        </div>
      </section>

      <section class="doc-section">
        <h2>Highlight (read-only)</h2>
        <p>The same tokenizer without the textarea — ideal for snippets and docs.</p>
        <Highlight language="json" value={jsonSample} />
      </section>

      <section class="doc-section">
        <h2>Options</h2>
        <p>Line numbers, read-only, and word-wrap are independent toggles.</p>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <strong>No line numbers</strong>
            <CodeEditor language="bash" defaultValue={bashSample} lineNumbers={false} />
          </div>
          <div>
            <strong>Read-only</strong>
            <CodeEditor language="css" defaultValue={cssSample} readOnly />
          </div>
          <div>
            <strong>Word-wrap</strong>
            <CodeEditor
              language="markdown"
              wrap
              defaultValue={
                'This is a deliberately long single line of prose that wraps within the editor instead of scrolling horizontally, so you can read it all without a horizontal scrollbar.'
              }
            />
          </div>
        </div>
      </section>

      <section class="doc-section">
        <h2>Themeable</h2>
        <p>
          The editor follows <code>data-theme</code> like every other cascivo surface — chrome and
          syntax colors map onto the <code>--cascivo-editor-*</code> palette.
        </p>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div data-theme="dark">
            <strong>Dark</strong>
            <Highlight language="typescript" value={tsSample} lineNumbers />
          </div>
          <div data-theme="warm">
            <strong>Warm</strong>
            <Highlight language="typescript" value={tsSample} lineNumbers />
          </div>
        </div>
      </section>
    </article>
  )
}
