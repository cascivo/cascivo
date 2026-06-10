import { LocationProvider, Route, Router } from 'preact-iso'
import { Layout } from './Layout'
import { Home } from './pages/Home'
import { ComponentPage } from './pages/ComponentPage'
import { getStoredTheme } from './theme'

export function App() {
  const theme = getStoredTheme()

  return (
    <LocationProvider>
      <Layout theme={theme}>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/components/:name" component={ComponentPage} />
          <Route default component={ComponentPage} />
        </Router>
      </Layout>
    </LocationProvider>
  )
}
