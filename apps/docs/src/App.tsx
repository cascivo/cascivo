import { LocationProvider, Route, Router } from 'preact-iso'
import { Layout } from './Layout'
import { Home } from './pages/Home'
import { AiPage } from './pages/AiPage'
import { ChartsPage } from './pages/ChartsPage'
import { EditorPage } from './pages/EditorPage'
import { FlowPage } from './pages/FlowPage'
import { ComponentPage } from './pages/ComponentPage'
import { PerfDataTable } from './pages/PerfDataTable'
import { PlaygroundPage } from './pages/PlaygroundPage'
import { Benchmarks } from './pages/Benchmarks'
import { LayoutsPage } from './pages/LayoutsPage'
import { DirectoryPage } from './pages/DirectoryPage'
import { ContextExplorerPage } from './pages/ContextExplorerPage'
import { TokensPage } from './pages/TokensPage'
import { IconsPage } from './pages/IconsPage'
import { WhyCascadePage } from './pages/WhyCascadePage'
import { ParityPage } from './pages/ParityPage'
import { MigratingPage } from './pages/MigratingPage'
import { BrandPage } from './pages/BrandPage'
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
          <Route path="/editor" component={EditorPage} />
          <Route path="/flow" component={FlowPage} />
          <Route path="/playground" component={PlaygroundPage} />
          <Route path="/benchmarks" component={Benchmarks} />
          <Route path="/layouts" component={LayoutsPage} />
          <Route path="/directory" component={DirectoryPage} />
          <Route path="/context" component={ContextExplorerPage} />
          <Route path="/tokens" component={TokensPage} />
          <Route path="/icons" component={IconsPage} />
          <Route path="/why" component={WhyCascadePage} />
          <Route path="/parity" component={ParityPage} />
          <Route path="/migrating" component={MigratingPage} />
          <Route path="/brand" component={BrandPage} />
          <Route path="/perf/data-table" component={PerfDataTable} />
          <Route path="/components/:name" component={ComponentPage} />
          <Route default component={ComponentPage} />
        </Router>
      </Layout>
    </LocationProvider>
  )
}
