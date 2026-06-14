'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, Button, EmptyState } from '@cascivo/react'
import { persistedSignal } from '@cascivo/storage'
import { alerts } from '../sim/metrics'
import { msg } from '../i18n'

export const ackedAlerts = persistedSignal<string[]>('pulse-acked', [])

export function Alerts() {
  useSignals()

  const activeAlerts = alerts.value
  const acked = ackedAlerts.value
  const unacked = activeAlerts.filter((a) => !acked.includes(a.id))

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--cascivo-space-4)',
        padding: 'var(--cascivo-space-6)',
      }}
    >
      <h2
        style={{
          fontSize: 'var(--cascivo-text-base)',
          fontWeight: 600,
          color: 'var(--cascivo-color-foreground)',
        }}
      >
        {t(msg.alertsTitle)}
      </h2>

      {unacked.length === 0 ? (
        <EmptyState title={t(msg.alertsEmpty)} description={t(msg.alertsEmptyDesc)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cascivo-space-2)' }}>
          {unacked.map((alert) => (
            <div
              key={alert.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--cascivo-space-3) var(--cascivo-space-4)',
                background: 'var(--cascivo-surface-subtle)',
                borderRadius: 'var(--cascivo-radius-md)',
                border: '1px solid var(--cascivo-color-border)',
                gap: 'var(--cascivo-space-3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--cascivo-space-3)',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Badge
                  variant={alert.severity === 'critical' ? 'destructive' : 'warning'}
                  size="sm"
                >
                  {alert.severity === 'critical'
                    ? t(msg.alertSeverityCritical)
                    : t(msg.alertSeverityWarning)}
                </Badge>
                <span
                  style={{
                    fontSize: 'var(--cascivo-text-xs)',
                    color: 'var(--cascivo-color-foreground-muted)',
                    flexShrink: 0,
                  }}
                >
                  {alert.host}
                </span>
                <span
                  style={{
                    fontSize: 'var(--cascivo-text-sm)',
                    color: 'var(--cascivo-color-foreground)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {alert.message}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--cascivo-space-3)',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--cascivo-text-xs)',
                    color: 'var(--cascivo-color-foreground-muted)',
                  }}
                >
                  {new Date(alert.t).toLocaleTimeString()}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    ackedAlerts.value = [...ackedAlerts.value, alert.id]
                  }}
                >
                  {t(msg.alertAcknowledge)}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
