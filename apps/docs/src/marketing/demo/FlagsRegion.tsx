'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { Card } from '@cascivo/components/card'
import { Toggle } from '@cascivo/components/toggle'
import { FLAGS } from './data'

export function FlagsRegion() {
  useSignals()
  const states = useSignal(FLAGS.map((f) => f.enabled))

  return (
    <section className="region" aria-label="Feature flags">
      <div className="region-head">
        <h3>Feature flags</h3>
      </div>
      <Card padding="md">
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
