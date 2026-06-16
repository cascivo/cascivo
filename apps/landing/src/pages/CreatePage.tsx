'use client'
import { useSignals, useSignalEffect } from '@cascivo/core'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { config } from './create/store'
import { hashToConfig, pushHashState } from './create/url-state'
import { ControlPanel } from './create/ControlPanel'
import { PreviewPanel } from './create/PreviewPanel'
import { CodePanel } from './create/CodePanel'
import './create/create.css'

export function CreatePage() {
  useSignals()

  // Load config from URL hash on first render (reads no signals — fires once)
  useSignalEffect(() => {
    const raw = window.location.hash.slice(1)
    const loaded = hashToConfig(raw)
    if (loaded) config.value = loaded
    return () => {}
  })

  // Sync config back to URL hash whenever it changes
  useSignalEffect(() => {
    pushHashState(config.value)
  })

  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main className="create-page">
          <div className="create-layout">
            <div className="create-panel create-panel--controls">
              <p className="create-panel__heading">Controls</p>
              <ControlPanel />
            </div>
            <div className="create-panel create-panel--preview">
              <p className="create-panel__heading">Preview — updates live</p>
              <PreviewPanel />
            </div>
            <div className="create-panel create-panel--code">
              <p className="create-panel__heading">Your theme</p>
              <CodePanel />
            </div>
          </div>
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
