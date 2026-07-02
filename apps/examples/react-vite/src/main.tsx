// Load-bearing line 1: import the theme CSS once, in your entry file.
// `all` bundles tokens + base + the light and dark themes; warm is opt-in.
import '@cascivo/themes/all'
import '@cascivo/themes/warm'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './app.css'

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
