import React from 'react'
import ReactDOM from 'react-dom/client'
import { setLinkComponent } from '@cascivo/react'
import App from './App'
import { router } from './router'

// SideNav, ShellHeader and Breadcrumb render their links through the router from here on.
setLinkComponent(router.Link)

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
