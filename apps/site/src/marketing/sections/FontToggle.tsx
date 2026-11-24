import { useSignals } from '@cascivo/core'
import { FONT_CHOICES, isFontChoice, siteFont, type FontChoice } from '../font-toggle'

const LABELS: Record<FontChoice, string> = {
  default: 'Default',
  cascivo: 'Cascivo Fonts',
  sans: 'Cascivo Sans',
  mono: 'Cascivo Mono',
  serif: 'Cascivo Serif',
  condensed: 'Cascivo Condensed',
}

/**
 * Header typeface picker. A native, labelled select (keyboard, screen reader and touch for free)
 * laid invisibly over an "Aa" glyph, so it is as narrow as the icon buttons beside it and the
 * header still fits at 320px.
 */
export function FontToggle() {
  useSignals()
  return (
    <span className="header-font-toggle" data-active={siteFont.value !== 'default'}>
      <span aria-hidden="true">Aa</span>
      <select
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
    </span>
  )
}
