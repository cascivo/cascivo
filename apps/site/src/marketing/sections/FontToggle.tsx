import { useSignals } from '@cascivo/core'
import { FONT_CHOICES, isFontChoice, siteFont, type FontChoice } from '../font-toggle'

const LABELS: Record<FontChoice, string> = {
  default: 'Aa Default',
  sans: 'Aa Sans',
  mono: 'Aa Mono',
  serif: 'Aa Serif',
  condensed: 'Aa Condensed',
}

/** Header typeface picker: a native, labelled select so keyboard, screen reader and touch work for free. */
export function FontToggle() {
  useSignals()
  return (
    <select
      className="header-font-toggle"
      aria-label="Site typeface"
      value={siteFont.value}
      onChange={(event) => {
        const next = event.currentTarget.value
        if (isFontChoice(next)) siteFont.value = next
      }}
    >
      {FONT_CHOICES.map((choice) => (
        <option key={choice} value={choice}>
          {LABELS[choice]}
        </option>
      ))}
    </select>
  )
}
