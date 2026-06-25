import { CodeEditor } from '@cascivo/editor'

const SAMPLE = `# Release notes — v2.0

The editor overlays a native \`<textarea>\` on a syntax-highlighted layer, so the
browser owns the caret, selection, IME and accessibility.

## What's in the box

- **Owned undo/redo** that survives programmatic \`value\` changes
- **Find & replace** — press \`Mod-F\`
- Echo-safe controlled sync (remote edits don't jump the caret)
- Bracket matching, an active-line gutter, and live theming

\`\`\`ts
import { CodeEditor } from '@cascivo/editor'

export function Notes() {
  return <CodeEditor language="markdown" lineNumbers defaultValue={'# Hi\\n'} />
}
\`\`\`

> Edit this Markdown — it's a real, editable instance. Try **Mod-F**.
`

export function EditorHighlight() {
  return (
    <section id="editor" className="section highlight-section" aria-label="Editor" data-reveal="">
      <p className="guides-eyebrow">@cascivo/editor</p>
      <h2>A CSS-native code editor with an owned tokenizer.</h2>
      <p className="section-sub">
        <code>@cascivo/editor</code> is a lightweight, signal-driven editor: a native textarea over
        a highlighted layer, plus owned undo/redo, find &amp; replace (<code>Mod-F</code>),
        selection-preserving sync, and bracket matching. Large documents window to the visible
        range. This is a live, editable instance — type into it.
      </p>

      <div className="highlight-editor">
        <CodeEditor language="markdown" lineNumbers defaultValue={SAMPLE} />
      </div>

      <p className="icon-showcase-cta">
        <a href="/docs/editor">Read the editor docs →</a>
      </p>
    </section>
  )
}
