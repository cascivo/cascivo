'use client'
import { signal } from '@cascade-ui/core'
import { useSignals } from '@cascade-ui/core'
import { CascadeView } from '@cascade-ui/render'
import type { ViewConfig } from '@cascade-ui/render'
import React, { useRef } from 'react'
import { exampleConfigJson } from './example-config'

import '@cascade-ui/themes/light'
import '@cascade-ui/themes/dark'
import '@cascade-ui/themes/warm'

const configSignal = signal<ViewConfig | null>(null)
const parseErrorSignal = signal<string | null>(null)

// Parse initial config
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
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}
      >
        <strong style={{ flex: 1, fontSize: '14px' }}>cascade JSON Playground</strong>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>Theme:</span>
        {(['light', 'dark', 'warm'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
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
            borderRight: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6b7280',
              background: '#f3f4f6',
              borderBottom: '1px solid #e5e7eb',
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
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '12px',
              border: 'none',
              outline: 'none',
              resize: 'none',
            }}
          />
          {parseErrorSignal.value && (
            <div
              style={{
                padding: '8px 12px',
                background: '#fef2f2',
                borderTop: '1px solid #fca5a5',
                fontSize: '12px',
                color: '#dc2626',
              }}
            >
              {parseErrorSignal.value}
            </div>
          )}
        </div>

        {/* Right: renderer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <div
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6b7280',
              background: '#f3f4f6',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            PREVIEW
          </div>
          <div style={{ flex: 1, padding: '24px' }}>
            {configSignal.value && <CascadeView config={configSignal.value} onInvalid="render" />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
