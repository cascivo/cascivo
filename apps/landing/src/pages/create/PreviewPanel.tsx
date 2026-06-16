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

export function PreviewPanel() {
  useSignalEffect(() => {
    let el = document.querySelector<HTMLStyleElement>('style[data-cascivo-cre]')
    if (!el) {
      el = document.createElement('style')
      el.dataset.cascivoCre = ''
      document.head.appendChild(el)
    }
    el.textContent = configToCSS(config.value)

    return () => {
      document.querySelector('style[data-cascivo-cre]')?.remove()
    }
  })

  return (
    <div className="preview-frame" data-theme="create-custom">
      <div className="preview-inner">
        {/* Group 1: Buttons */}
        <div className="preview-group">
          <p className="preview-group-label">Buttons</p>
          <div className="preview-row">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </div>

        {/* Group 2: Form */}
        <div className="preview-group">
          <p className="preview-group-label">Form</p>
          <div className="preview-form">
            <Input label="Email" placeholder="you@example.com" />
            <Input label="Password" type="password" placeholder="••••••••" />
            <Checkbox label="I agree to the terms of service" defaultChecked />
            <Button variant="primary">Create account</Button>
          </div>
        </div>

        {/* Group 3: Status */}
        <div className="preview-group">
          <p className="preview-group-label">Status</p>
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
        </div>

        {/* Group 4: Card */}
        <div className="preview-group">
          <p className="preview-group-label">Card</p>
          <Card variant="elevated">
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
        </div>

        {/* Group 5: Toggles */}
        <div className="preview-group">
          <p className="preview-group-label">Toggles</p>
          <div className="preview-stack">
            <Toggle label="Email notifications" defaultChecked />
            <Toggle label="Marketing emails" />
            <Toggle label="Product analytics" defaultChecked />
          </div>
        </div>

        {/* Group 6: Select */}
        <div className="preview-group">
          <p className="preview-group-label">Select</p>
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
        </div>
      </div>
    </div>
  )
}
