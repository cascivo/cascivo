import { useEffect, useState } from 'preact/hooks'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import tsx from 'shiki/langs/tsx.mjs'
import bash from 'shiki/langs/bash.mjs'
import githubDark from 'shiki/themes/github-dark.mjs'

// Single highlighter, created lazily with only the langs/theme the docs use —
// keeps the bundle lean (no per-grammar chunks, no wasm engine).
let highlighterPromise: Promise<HighlighterCore> | null = null

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    themes: [githubDark],
    langs: [tsx, bash],
    engine: createJavaScriptRegexEngine(),
  })
  return highlighterPromise
}

interface CodeBlockProps {
  code: string
  lang?: 'tsx' | 'bash'
}

export function CodeBlock({ code, lang = 'tsx' }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    getHighlighter()
      .then((hl) => {
        if (active)
          setHtml(
            hl.codeToHtml(code, {
              lang,
              theme: 'github-dark',
              // github-dark's comment grey is 3.05:1 on its own background —
              // GitHub's own shortfall, inherited wholesale. Shiki remaps a
              // theme colour at highlight time; this is the one that misses AA.
              colorReplacements: { '#6a737d': '#9aa5b1' },
            }),
          )
      })
      .catch(() => {
        if (active) setHtml(null)
      })
    return () => {
      active = false
    }
  }, [code, lang])

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div class="code-block">
      <button class="code-copy" onClick={copy} aria-label="Copy code">
        {copied ? 'Copied' : 'Copy'}
      </button>
      {html ? (
        // shiki output is trusted — built from local component source, not user input
        <div class="code-shiki" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre class="code-plain">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
