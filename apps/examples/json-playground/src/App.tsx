'use client'
import { signal, useSignals } from '@cascivo/core'
import { CascadeView } from '@cascivo/render'
import type { ViewConfig } from '@cascivo/render'
import React, { useRef } from 'react'
import { exampleConfigJson } from './example-config'

import '@cascivo/themes/light'
import '@cascivo/themes/dark'
import '@cascivo/themes/warm'

const configSignal = signal<ViewConfig | null>(null)
const parseErrorSignal = signal<string | null>(null)

try {
  configSignal.value = JSON.parse(exampleConfigJson) as ViewConfig
} catch {
  parseErrorSignal.value = 'Failed to parse example config'
}

function App() {
  useSignals()
  const themeRef = useRef<HTMLDivElement>(null)

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const raw = e.target.value
    try {
      const parsed = JSON.parse(raw) as ViewConfig
      configSignal.value = parsed
      parseErrorSignal.value = null
    } catch (err) {
      parseErrorSignal.value = err instanceof Error ? err.message : 'Invalid JSON'
    }
  }

  function setTheme(theme: string) {
    themeRef.current?.setAttribute('data-theme', theme)
  }

  return (
    <div
      ref={themeRef}
      data-theme="light"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'var(--cascivo-color-background)',
        color: 'var(--cascivo-color-text)',
        fontFamily: 'var(--cascivo-font-sans)',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--cascivo-space-2)',
          padding: `var(--cascivo-space-2) var(--cascivo-space-4)`,
          borderBottom: '1px solid var(--cascivo-color-border)',
          background: 'var(--cascivo-color-surface)',
          flexShrink: 0,
        }}
      >
        <strong style={{ flex: 1, fontSize: 'var(--cascivo-text-sm)' }}>
          cascivo JSON Playground
        </strong>
        <span
          style={{
            fontSize: 'var(--cascivo-text-xs)',
            color: 'var(--cascivo-color-text-subtle)',
          }}
        >
          Theme:
        </span>
        {(['light', 'dark', 'warm'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            style={{
              padding: `var(--cascivo-space-1) var(--cascivo-space-3)`,
              borderRadius: 'var(--cascivo-radius-control)',
              border: '1px solid var(--cascivo-color-border)',
              background: 'var(--cascivo-color-surface)',
              color: 'var(--cascivo-color-text)',
              cursor: 'pointer',
              fontSize: 'var(--cascivo-text-xs)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main panes */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: editor */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--cascivo-color-border)',
          }}
        >
          <div
            style={{
              padding: `var(--cascivo-space-1) var(--cascivo-space-3)`,
              fontSize: 'var(--cascivo-text-xs)',
              fontWeight: 600,
              color: 'var(--cascivo-color-text-subtle)',
              background: 'var(--cascivo-color-bg-subtle)',
              borderBottom: '1px solid var(--cascivo-color-border)',
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}
          >
            CONFIG (JSON)
          </div>
          <textarea
            defaultValue={exampleConfigJson}
            onChange={handleInput}
            spellCheck={false}
            style={{
              flex: 1,
              padding: 'var(--cascivo-space-4)',
              fontFamily: 'monospace',
              fontSize: 'var(--cascivo-text-xs)',
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'var(--cascivo-color-background)',
              color: 'var(--cascivo-color-text)',
            }}
          />
          {parseErrorSignal.value && (
            <div
              style={{
                padding: `var(--cascivo-space-2) var(--cascivo-space-3)`,
                background:
                  'color-mix(in oklch, var(--cascivo-color-destructive) 10%, transparent)',
                borderTop:
                  '1px solid color-mix(in oklch, var(--cascivo-color-destructive) 30%, transparent)',
                fontSize: 'var(--cascivo-text-xs)',
                color: 'var(--cascivo-color-destructive)',
                flexShrink: 0,
              }}
            >
              {parseErrorSignal.value}
            </div>
          )}
        </div>

        {/* Right: renderer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              padding: `var(--cascivo-space-1) var(--cascivo-space-3)`,
              fontSize: 'var(--cascivo-text-xs)',
              fontWeight: 600,
              color: 'var(--cascivo-color-text-subtle)',
              background: 'var(--cascivo-color-bg-subtle)',
              borderBottom: '1px solid var(--cascivo-color-border)',
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}
          >
            PREVIEW
          </div>
          <div style={{ flex: 1, padding: 'var(--cascivo-space-6)', overflowY: 'auto' }}>
            {configSignal.value && <CascadeView config={configSignal.value} onInvalid="render" />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
