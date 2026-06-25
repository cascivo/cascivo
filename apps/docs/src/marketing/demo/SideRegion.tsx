import { Alert } from '@cascivo/components/alert'
import { Avatar } from '@cascivo/components/avatar'
import { Card } from '@cascivo/components/card'
import { Separator } from '@cascivo/components/separator'
import { Tooltip } from '@cascivo/components/tooltip'
import { INCIDENT, ONCALL } from './data'

export function SideRegion() {
  return (
    <div className="region region-side">
      <div className="incident-wrap">
        <span className="incident-dot" aria-hidden="true" />
        <Alert variant="warning" title={INCIDENT.title}>
          {INCIDENT.body}
        </Alert>
      </div>

      <Card padding="md" data-theme="warm" className="oncall-card">
        <div className="oncall-row">
          <Avatar
            fallback={ONCALL.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
            size="sm"
          />
          <div>
            <strong>{ONCALL.name}</strong>
            <span className="oncall-sub">
              {ONCALL.handle} · on call until {ONCALL.until}
            </span>
          </div>
        </div>
        <Separator />
        <Tooltip content="Rotation token — rotate from Settings">
          <code className="oncall-token">{ONCALL.token}</code>
        </Tooltip>
      </Card>

      <p className="console-microcopy">All regions nominal. Boring is good.</p>
    </div>
  )
}
