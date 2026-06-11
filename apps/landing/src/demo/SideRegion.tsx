import { Alert } from '@cascade-ui/components/alert'
import { Avatar } from '@cascade-ui/components/avatar'
import { Card } from '@cascade-ui/components/card'
import { Separator } from '@cascade-ui/components/separator'
import { Tooltip } from '@cascade-ui/components/tooltip'
import { INCIDENT, ONCALL } from './data'

export function SideRegion() {
  return (
    <div className="region region-side">
      <Alert variant="warning" title={INCIDENT.title}>
        {INCIDENT.body}
      </Alert>

      <Card padding="md" data-theme="warm" className="oncall-card">
        <span className="oncall-label">data-theme=&quot;warm&quot;</span>
        <div className="oncall-row">
          <Avatar fallback={ONCALL.name} size="sm" />
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
