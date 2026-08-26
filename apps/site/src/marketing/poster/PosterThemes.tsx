'use client'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { Badge } from '@cascivo/components/badge'
import { Button } from '@cascivo/components/button'
import { Card } from '@cascivo/components/card'
import { Field } from '@cascivo/components/field'
import { Input } from '@cascivo/components/input'
import { ToggleGroup } from '@cascivo/components/toggle-group'
import { loadAllThemes, type Theme } from '../../theme'
import { themeCount } from './figures'

/*
 * The theme system demonstrating itself. The chips set `data-theme` on the
 * preview card and nothing else — same markup, same components, real theme
 * files. No palette map: the card repaints because the stylesheet does.
 */

const FIRST_PARTY: Theme[] = [
  'light',
  'dark',
  'warm',
  'flat',
  'minimal',
  'midnight',
  'pastel',
  'brutalist',
  'corporate',
  'terminal',
  'cyberpunk',
  'arcade',
]

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const ITEMS = FIRST_PARTY.map((t) => ({ value: t, label: titleCase(t) }))

export function PosterThemes() {
  useSignals()
  const active = useSignal<Theme>('brutalist')

  // The nine deferred theme sheets are not on the critical path; this section is
  // itself lazy and below the fold, so fetching them on mount is free.
  useSignalEffect(() => {
    void loadAllThemes()
  })

  return (
    <section className="pg-section pg-cols pg-cols--4-8" id="themes" aria-label="Themes">
      <div className="pg-pad">
        <p className="pg-eyebrow">07 / themes</p>
        <h2 className="pg-display pg-display--section pg-themes-head">
          One attribute,
          <br />
          a new skin
        </h2>
        <p className="pg-body pg-themes-body">
          {themeCount} first-party themes over a three-level token system — primitive, semantic,
          component. Themes remap the semantic layer; you override component tokens per brand with
          no rebuild. Scope any theme to any subtree with <code>data-theme</code>.
        </p>
        <pre className="pg-pre pg-pre--tight">
          <code>{`<main data-theme="${active.value}">\n  <Card>…</Card>\n</main>`}</code>
        </pre>
      </div>

      <div className="pg-theme-stage">
        <ToggleGroup
          className="pg-theme-chips"
          type="single"
          items={ITEMS}
          value={active.value}
          onValueChange={(next) => {
            if (typeof next === 'string') active.value = next as Theme
          }}
          aria-label="Preview theme"
        />
        <div className="pg-theme-preview" data-theme={active.value}>
          <Card className="pg-theme-card" padding="md">
            <div className="pg-theme-card-head">
              <span className="pg-theme-card-title">Account</span>
              <Badge variant="primary">Pro</Badge>
            </div>
            <Field label="Email">
              <Input defaultValue="you@example.com" readOnly />
            </Field>
            <div className="pg-theme-card-actions">
              <Button variant="primary">Save</Button>
              <Button variant="secondary">Cancel</Button>
            </div>
          </Card>
          <p className="pg-theme-caption pg-mono">
            data-theme=&quot;{active.value}&quot; · same markup, same components
          </p>
        </div>
      </div>
    </section>
  )
}
