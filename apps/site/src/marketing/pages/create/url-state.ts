import type { ThemeConfig } from './store'
import { configToHash } from '@cascivo/theme-kit'

// Codec lives in @cascivo/theme-kit (shared with the CLI). Re-export it and keep
// the DOM-bound history sync here.
export { configToHash, hashToConfig } from '@cascivo/theme-kit'

let _debounce = 0
export function pushHashState(config: ThemeConfig) {
  clearTimeout(_debounce)
  _debounce = window.setTimeout(() => {
    history.replaceState(null, '', '#' + configToHash(config))
  }, 300)
}
