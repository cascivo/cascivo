import { LocationProvider, Route, Router } from 'preact-iso'
import { Layout } from './Layout'
import { Home } from './pages/Home'
import { AiPage } from './pages/AiPage'
import { ChartsPage } from './pages/ChartsPage'
import { ComponentPage } from './pages/ComponentPage'
import { PerfDataTable } from './pages/PerfDataTable'
import { PlaygroundPage } from './pages/PlaygroundPage'
import { Benchmarks } from './pages/Benchmarks'
import { LayoutsPage } from './pages/LayoutsPage'
import { DirectoryPage } from './pages/DirectoryPage'
import { ContextExplorerPage } from './pages/ContextExplorerPage'
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
          <Route path="/ai" component={AiPage} />
          <Route path="/charts" component={ChartsPage} />
          <Route path="/playground" component={PlaygroundPage} />
          <Route path="/benchmarks" component={Benchmarks} />
          <Route path="/layouts" component={LayoutsPage} />
          <Route path="/directory" component={DirectoryPage} />
          <Route path="/context" component={ContextExplorerPage} />
          <Route path="/perf/data-table" component={PerfDataTable} />
          <Route path="/components/:name" component={ComponentPage} />
          <Route default component={ComponentPage} />
        </Router>
      </Layout>
    </LocationProvider>
  )
}
