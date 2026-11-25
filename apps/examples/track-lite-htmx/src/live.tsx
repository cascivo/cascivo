// Same themes as the React twin (all = tokens + base + light + dark), and only the contract
// units the server renders: per-unit files, like the React build's per-component CSS modules.
import '@cascivo/themes/all.css'
import '@cascivo/css/badge.css'
import '@cascivo/css/button.css'
import '@cascivo/css/field.css'
import '@cascivo/css/input.css'
import '@cascivo/css/label.css'
import '@cascivo/css/modal.css'
import '@cascivo/css/select.css'
import '@cascivo/css/toast.css'
import './app.css'
import { classes as c } from '@cascivo/css'
import { defineIsland } from '@cascivo/solid'
import { createSignal, onCleanup } from 'solid-js'

// The one widget with client-only state: a clock. The server cannot tick "updated 3s ago" every
// second for each tab, so the island counts locally and resets whenever htmx settles the issue
// list (an own mutation, or the refetch an SSE `changed` event triggers). The React twin is
// `track-lite/src/LiveStatus.tsx`.
function LiveStatus() {
  const [seconds, setSeconds] = createSignal(0)
  const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
  const reset = (e: Event) => {
    if ((e.target as Element | null)?.id === 'issues') setSeconds(0)
  }
  document.addEventListener('htmx:afterSettle', reset)
  onCleanup(() => {
    clearInterval(timer)
    document.removeEventListener('htmx:afterSettle', reset)
  })
  return (
    <span class={c.badge.badge} data-variant="success" data-size="sm">
      Live · updated {seconds()}s ago
    </span>
  )
}

export default defineIsland(LiveStatus)
