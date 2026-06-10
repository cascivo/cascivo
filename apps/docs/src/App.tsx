import { LocationProvider, Route, Router } from 'preact-iso'
import { Layout } from './Layout'
import { Home } from './pages/Home'
import { ComponentPage } from './pages/ComponentPage'
import { theme } from './theme'

export function App() {
  // Apply stored theme to DOM before first render so there is no flash.
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return (
    <LocationProvider>
      <Layout>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/components/:name" component={ComponentPage} />
          <Route default component={ComponentPage} />
        </Router>
      </Layout>
    </LocationProvider>
  )
}
