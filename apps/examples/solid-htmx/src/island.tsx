import '@cascivo/themes/light.css'
import '@cascivo/css/cascivo.css'
import { classes as c } from '@cascivo/css'
import { defineIsland } from '@cascivo/solid'
import { createSignal } from 'solid-js'

// The island owns client state only; the markup is the contract's, so `c.button.lable` would be
// a type error. The server renders the same-shaped fallback (a badge) inside `#save-bar`; the
// loader imports this module's default export, which replaces it and survives htmx swaps.
function SaveBar(props: { initial?: string }) {
  const [saving, setSaving] = createSignal(false)
  return (
    <div class={c.card.card}>
      <span class={c.badge.badge} data-variant="secondary">
        {saving() ? 'Saving' : (props.initial ?? 'Draft')}
      </span>
      <button
        type="button"
        class={c.button.button}
        data-variant="primary"
        data-state={saving() ? 'loading' : 'idle'}
        onClick={() => setSaving(!saving())}
      >
        <span class={c.button.label}>Save</span>
      </button>
    </div>
  )
}

export default defineIsland(SaveBar)
