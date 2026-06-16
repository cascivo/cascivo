'use client'
import { useSignalEffect } from '@cascivo/core'
import { Button } from '@cascivo/components/button'
import { Input } from '@cascivo/components/input'
import { Checkbox } from '@cascivo/components/checkbox'
import { Alert } from '@cascivo/components/alert'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@cascivo/components/card'
import { Badge } from '@cascivo/components/badge'
import { Toggle } from '@cascivo/components/toggle'
import { Select } from '@cascivo/components/select'
import { config } from './store'
import { configToCSS } from './css-gen'

const SIDEBAR_ITEMS = [
  { label: 'Dashboard' },
  { label: 'Components', active: true },
  { label: 'Tokens' },
  { label: 'Settings' },
]

export function PreviewPanel() {
  useSignalEffect(() => {
    let el = document.querySelector<HTMLStyleElement>('style[data-cascivo-cre]')
    if (!el) {
      el = document.createElement('style')
      el.dataset.cascivoCre = ''
      document.head.appendChild(el)
    }
    el.textContent = configToCSS(config.value, true)

    return () => {
      document.querySelector('style[data-cascivo-cre]')?.remove()
    }
  })

  return (
    <div className="preview-frame">
      <div className="preview-shell" data-theme="create-custom">
        {/* Fake app header */}
        <header className="preview-shell__header">
          <span className="preview-shell__logo">cascivo</span>
          <nav className="preview-shell__header-nav" aria-label="Preview app navigation">
            <span>Docs</span>
            <span>GitHub</span>
          </nav>
        </header>

        <div className="preview-shell__body">
          {/* Fake sidebar */}
          <aside className="preview-shell__sidebar" aria-label="Preview sidebar">
            {SIDEBAR_ITEMS.map((item) => (
              <div
                key={item.label}
                className="preview-shell__sidebar-item"
                aria-current={item.active ? 'page' : undefined}
              >
                {item.label}
              </div>
            ))}
          </aside>

          {/* Component grid */}
          <main className="preview-shell__content">
            <div className="preview-content-grid">
              {/* Buttons */}
              <Card>
                <CardHeader>
                  <CardTitle>Buttons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="preview-row">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Form</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="preview-form">
                    <Input label="Email" placeholder="you@example.com" />
                    <Input label="Password" type="password" placeholder="••••••••" />
                    <Checkbox label="I agree to the terms of service" defaultChecked />
                    <Button variant="primary">Create account</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="preview-stack">
                    <Alert variant="info" title="Info">
                      Your session will expire in 10 minutes.
                    </Alert>
                    <Alert variant="success" title="Success">
                      Theme saved successfully.
                    </Alert>
                    <Alert variant="warning" title="Warning">
                      Your plan is approaching its limit.
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              {/* Card in card — plan summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Pro plan</CardTitle>
                  <div className="preview-row">
                    <Badge variant="success">Active</Badge>
                    <Badge variant="secondary">Annual</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p
                    style={{
                      fontSize: 'var(--cascivo-text-sm)',
                      color: 'var(--cascivo-color-text-subtle)',
                      margin: 0,
                    }}
                  >
                    Unlimited components, priority support, and early access to new features.
                  </p>
                </CardContent>
                <CardFooter>
                  <div className="preview-row">
                    <Button variant="ghost" size="sm">
                      Cancel plan
                    </Button>
                    <Button variant="primary" size="sm">
                      Manage billing
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* Toggles */}
              <Card>
                <CardHeader>
                  <CardTitle>Toggles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="preview-stack">
                    <Toggle label="Email notifications" defaultChecked />
                    <Toggle label="Marketing emails" />
                    <Toggle label="Product analytics" defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Select */}
              <Card>
                <CardHeader>
                  <CardTitle>Select</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    label="Plan"
                    value="pro"
                    options={[
                      { value: 'free', label: 'Free — up to 3 projects' },
                      { value: 'pro', label: 'Pro — $12/month' },
                      { value: 'team', label: 'Team — $49/month' },
                      { value: 'enterprise', label: 'Enterprise — contact us' },
                    ]}
                    onChange={() => {
                      /* static demo */
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
