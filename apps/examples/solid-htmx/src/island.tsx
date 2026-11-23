import '@cascivo/themes/light.css'
import '@cascivo/css/cascivo.css'
import 'htmx.org'
import { classes as c } from '@cascivo/css'
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'

// The island owns client state only; the markup is the contract's, so `c.button.lable` would be
// a type error. Everything else on the page is server-rendered HTML that htmx swaps.
function SaveBar() {
  const [saving, setSaving] = createSignal(false)
  return (
    <div class={c.card.card}>
      <span class={c.badge.badge} data-variant="secondary">
        {saving() ? 'Saving' : 'Draft'}
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

const mount = document.getElementById('save-bar')
if (mount) render(() => <SaveBar />, mount)
