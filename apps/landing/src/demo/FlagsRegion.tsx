'use client'
import { useSignal, useSignals } from '@cascade-ui/core'
import { Card } from '@cascade-ui/components/card'
import { Toggle } from '@cascade-ui/components/toggle'
import { FLAGS } from './data'

export function FlagsRegion() {
  useSignals()
  const states = useSignal(FLAGS.map((f) => f.enabled))

  return (
    <section className="region" aria-label="Feature flags">
      <div className="region-head">
        <h3>Feature flags</h3>
      </div>
      <Card padding="sm">
        {FLAGS.map((flag, i) => (
          <div key={flag.name} className="flag-row">
            <div className="flag-info">
              <span className="flag-name">{flag.name}</span>
              <span className="flag-desc">{flag.description}</span>
            </div>
            <Toggle
              checked={states.value[i] ?? false}
              aria-label={flag.name}
              onChange={(checked) => {
                const next = [...states.value]
                next[i] = checked
                states.value = next
              }}
            />
          </div>
        ))}
      </Card>
    </section>
  )
}
