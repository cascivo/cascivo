import { createRoot } from 'react-dom/client'
import App from './App'

// Written against React's types; `vite.config.ts` aliases react → preact/compat, so the
// shipped bundle runs on Preact. Delete those aliases and the same source runs on React.
const root = document.getElementById('root')
if (root) createRoot(root).render(<App />)
