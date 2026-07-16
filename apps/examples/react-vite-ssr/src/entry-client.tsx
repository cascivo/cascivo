import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { App } from './App'

const root = document.getElementById('root')
if (root) {
  hydrateRoot(
    root,
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
