import { classes as c } from '@cascivo/css'
import { defineIsland } from '@cascivo/solid'
import { createSignal } from 'solid-js'

// Sample island: client-only state on contract classes, plus the typed `<cv-combobox>` element.
// The server renders the same-shaped fallback; the combobox value reaches the server through
// its form-associated `name`, not through island state.
function Counter(props: { start?: number }) {
  const [n, setN] = createSignal(props.start ?? 0)
  return (
    <div class={c.card.card}>
      <button type="button" class={c.button.button} onClick={() => setN(n() + 1)}>
        <span class={c.button.label}>Clicked {n()}</span>
      </button>
      <cv-combobox
        name="fruit"
        placeholder="Fruit"
        on:cv-value-change={(e) => console.debug(e.detail.value)}
      >
        <div role="option" data-value="apple">
          Apple
        </div>
      </cv-combobox>
    </div>
  )
}

export default defineIsland(Counter)
