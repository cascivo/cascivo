import { useId } from 'react'
import { useSignal, useSignals } from '@cascivo/core'
import { Toggle } from '@cascivo/components/toggle'
import { SAMPLE, WEIGHT_STOPS } from './data'

/**
 * The comparison faces. Their @font-face rules (font.css) are declared always but only fetched
 * when a glyph is painted with them, and these rows exist only while the switch is on.
 */
export const COMPARE_FONTS: readonly { name: string; family: string }[] = [
  { name: 'Inter', family: "'Compare Inter'" },
  { name: 'Geist', family: "'Compare Geist'" },
  { name: 'IBM Plex Sans', family: "'Compare IBM Plex Sans'" },
]

/** `compare={false}` drops the Inter/Geist/Plex switch (only Cascivo Sans is measured against them). */
export function WeightWaterfall({ compare: canCompare = true }: { compare?: boolean } = {}) {
  useSignals()
  const compare = useSignal(false)
  const baseId = useId()

  return (
    <>
      {canCompare ? (
        <Toggle
          label="Compare with Inter, Geist, IBM Plex Sans"
          checked={compare.value}
          onValueChange={(checked) => {
            compare.value = checked
          }}
        />
      ) : null}
      <ul className="cs-waterfall" id={`${baseId}-list`}>
        {WEIGHT_STOPS.map((stop) => (
          <li key={stop.value}>
            <span className="cs-waterfall-label">
              {stop.value} {stop.name}
            </span>
            <span className="cs-waterfall-text" style={{ fontWeight: stop.value }}>
              {SAMPLE}
            </span>
            {compare.value ? (
              <ul className="cs-waterfall-compare">
                {COMPARE_FONTS.map((font) => (
                  <li key={font.name}>
                    <span className="cs-waterfall-label">{font.name}</span>
                    <span
                      className="cs-waterfall-text"
                      style={{ fontFamily: font.family, fontWeight: stop.value }}
                    >
                      {SAMPLE}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  )
}
