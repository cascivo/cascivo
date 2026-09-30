import { createRoot } from 'react-dom/client'
import { setLinkComponent } from '@cascivo/react'
import App from './App'
import { router } from './router'

// Every config-driven cascivo nav (SideNav, ShellHeader, Breadcrumb) now renders the
// router's Link, so its `href`s navigate client-side.
setLinkComponent(router.Link)

// Written against React's types; `vite.config.ts` aliases react → preact/compat, so the
// shipped bundle runs on Preact. Delete those aliases and the same source runs on React.
const root = document.getElementById('root')
if (root) createRoot(root).render(<App />)
