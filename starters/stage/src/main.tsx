import { createRoot } from 'react-dom/client'
import { effect } from '@cascivo/core'
import { setLinkComponent } from '@cascivo/react'
import App from './App'
import { theme } from './local'
import { router } from './router'

import '@cascivo/themes/light-dark.css'
import '@cascivo/themes/midnight.css'
import './global.css'

// Every config-driven cascivo nav renders the router's Link, so hrefs navigate client-side.
setLinkComponent(router.Link)

// The theme is a signal (persisted in local.ts); the page follows it.
effect(() => {
  document.documentElement.dataset['theme'] = theme.value
})

// Written against React's types; `vite.config.ts` aliases react → preact/compat, so the
// shipped bundle runs on Preact. Remove those aliases and the same source runs on React.
const root = document.getElementById('root')
if (root) createRoot(root).render(<App />)
