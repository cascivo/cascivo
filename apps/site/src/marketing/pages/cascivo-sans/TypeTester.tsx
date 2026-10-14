import type { CSSProperties } from 'react'
import { useId } from 'react'
import { useSignal, useSignals } from '@cascivo/core'
import { Slider } from '@cascivo/components/slider'
import { Toggle } from '@cascivo/components/toggle'
import { AXES, SAMPLE, clampAxis, testerStyle } from './data'
import type { AxisName } from './data'

const CONTROLS: readonly { axis: AxisName; label: string; unit: string }[] = [
  { axis: 'wght', label: 'Weight', unit: '' },
  { axis: 'opsz', label: 'Optical size', unit: '' },
  { axis: 'size', label: 'Size', unit: 'px' },
]

export function TypeTester() {
  useSignals()
  const values = {
    wght: useSignal<number>(AXES.wght.initial),
    opsz: useSignal<number>(AXES.opsz.initial),
    size: useSignal<number>(AXES.size.initial),
  }
  const italic = useSignal(false)
  const baseId = useId()
  const sampleLabelId = `${baseId}-sample`

  return (
    <div className="cs-tester">
      <div className="cs-tester-controls">
        {CONTROLS.map(({ axis, label, unit }) => {
          const id = `${baseId}-${axis}`
          return (
            <div className="cs-tester-control" key={axis}>
              <Slider
                id={id}
                label={label}
                min={AXES[axis].min}
                max={AXES[axis].max}
                step={1}
                value={values[axis].value}
                onInput={(e) => {
                  values[axis].value = clampAxis(axis, Number(e.currentTarget.value))
                }}
              />
              <output className="cs-tester-value" htmlFor={id}>
                {values[axis].value}
                {unit}
              </output>
            </div>
          )
        })}
        <Toggle
          label="Italic"
          checked={italic.value}
          onValueChange={(checked) => {
            italic.value = checked
          }}
        />
      </div>
      <span id={sampleLabelId} className="cs-tester-label">
        Sample text — editable
      </span>
      <p
        className="cs-tester-sample"
        role="textbox"
        aria-multiline="true"
        aria-labelledby={sampleLabelId}
        contentEditable="plaintext-only"
        spellcheck={false}
        style={
          testerStyle({
            wght: values.wght.value,
            opsz: values.opsz.value,
            size: values.size.value,
            italic: italic.value,
          }) as CSSProperties
        }
      >
        {SAMPLE}
      </p>
    </div>
  )
}
