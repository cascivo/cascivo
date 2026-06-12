import { createRoot } from 'react-dom/client'
import '@cascade-ui/themes/light'
import { App } from './App'
import { CommitCounter } from './harness'

createRoot(document.getElementById('root')!).render(
  <CommitCounter>
    <App />
  </CommitCounter>,
)

requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    document.body.dataset.benchReady = '1'
  }),
)
