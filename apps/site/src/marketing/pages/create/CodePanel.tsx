'use client'
import { useSignals, useSignal } from '@cascivo/core'
import { Button } from '@cascivo/components/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@cascivo/components/tabs'
import { config } from './store'
import { configToCSS, highlightCSS } from './css-gen'
import { configToHash } from './url-state'

function useCopyState() {
  const copied = useSignal(false)
  function triggerCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 1500)
    })
  }
  return { copied, triggerCopy }
}

const USAGE_CSS = `/* 1. Import a base theme (light or dark) */
@import '@cascivo/themes/light.css';

/* 2. Import your custom theme overlay */
@import './theme.css';`

const USAGE_JSX = `/* 3. Wrap your app (or any subtree) */
<div data-theme="custom">
  {/* your cascivo components here */}
</div>`

export function CodePanel() {
  useSignals()
  const css = configToCSS(config.value)
  const cliCommand = `npx cascivo theme create custom --from ${configToHash(config.value)}`
  const cssCopy = useCopyState()
  const cliCopy = useCopyState()
  const shareCopy = useCopyState()

  function downloadCSS() {
    const blob = new Blob([css], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'theme.css'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="code-panel">
      <Tabs defaultValue="css">
        <TabsList>
          <TabsTrigger value="css">CSS variables</TabsTrigger>
          <TabsTrigger value="cli">CLI</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="css">
          <div className="code-block-wrapper">
            <pre className="code-block">
              <code dangerouslySetInnerHTML={{ __html: highlightCSS(css) }} />
            </pre>
          </div>
          <div className="code-actions">
            <Button variant="primary" size="sm" onClick={() => cssCopy.triggerCopy(css)}>
              {cssCopy.copied.value ? 'Copied!' : 'Copy CSS'}
            </Button>
            <Button variant="secondary" size="sm" onClick={downloadCSS}>
              Download theme.css
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="cli">
          <p className="code-panel-hint">
            Skip the copy-paste — install this exact theme into your project as an owned{' '}
            <code>custom.theme.css</code>:
          </p>
          <div className="code-block-wrapper">
            <pre className="code-block">
              <code>{cliCommand}</code>
            </pre>
          </div>
          <div className="code-actions">
            <Button variant="primary" size="sm" onClick={() => cliCopy.triggerCopy(cliCommand)}>
              {cliCopy.copied.value ? 'Copied!' : 'Copy CLI command'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <div className="code-block-wrapper">
            <pre className="code-block">
              <code>{USAGE_CSS}</code>
            </pre>
          </div>
          <div
            className="code-block-wrapper"
            style={{ marginBlockStart: 'var(--cascivo-space-3)' }}
          >
            <pre className="code-block">
              <code>{USAGE_JSX}</code>
            </pre>
          </div>
        </TabsContent>
      </Tabs>

      <div className="code-share-row">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => shareCopy.triggerCopy(window.location.href)}
        >
          {shareCopy.copied.value ? 'Link copied!' : 'Share link'}
        </Button>
      </div>
    </div>
  )
}
