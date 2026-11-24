import { useSignals } from '@cascivo/core'
import { cascivoSans } from '../font-toggle'

/** Header switch: set the whole site in Cascivo Sans. Labelled by what it does, state via aria-pressed. */
export function FontToggle() {
  useSignals()
  return (
    <button
      type="button"
      className="header-font-toggle"
      aria-label="Use Cascivo Sans"
      aria-pressed={cascivoSans.value}
      onClick={() => {
        cascivoSans.value = !cascivoSans.value
      }}
    >
      <span aria-hidden="true">Aa</span>
    </button>
  )
}
