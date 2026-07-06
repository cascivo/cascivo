'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { Badge } from '@cascivo/components/badge'
import { Button } from '@cascivo/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@cascivo/components/card'
import { Input } from '@cascivo/components/input'
import { Toggle } from '@cascivo/components/toggle'
// Bring in the non-core themes so a scoped `data-theme` on the stage renders
// them. This is a lazy chunk, so it never touches the home critical path.
import '../../themes-extra.css'

// A curated subset for the chips — three first-party (light/dark/warm) plus a
// few characterful ones. The full set lives on /create.
const PREVIEW_THEMES = ['light', 'dark', 'warm', 'midnight', 'pastel', 'cyberpunk'] as const
type PreviewTheme = (typeof PREVIEW_THEMES)[number]

export function HeroThemePreview() {
  useSignals()
  const stage = useSignal<PreviewTheme>('dark')

  return (
    <div className="hero-preview" aria-label="Live theme preview">
      <div className="hero-preview-chips" role="group" aria-label="Preview theme">
        {PREVIEW_THEMES.map((t) => (
          <button
            key={t}
            type="button"
            className="hero-preview-chip"
            data-active={stage.value === t ? '' : undefined}
            aria-pressed={stage.value === t}
            onClick={() => {
              stage.value = t
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="hero-preview-stage" data-theme={stage.value}>
        <Card>
          <CardHeader>
            <div className="hero-preview-head">
              <CardTitle>Account</CardTitle>
              <Badge variant="success">Pro</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="hero-preview-form">
              <Input label="Email" placeholder="you@example.com" />
              <Toggle defaultChecked label="Email alerts" />
              <div className="hero-preview-actions">
                <Button>Save</Button>
                <Button variant="secondary">Cancel</Button>
                <Button variant="ghost">Skip</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="hero-preview-cap">
        Live, scoped theming — <code>data-theme</code> on one element retints every component inside
        it. The rest of the page doesn&rsquo;t change. <a href="/create">Make your own →</a>
      </p>
    </div>
  )
}
