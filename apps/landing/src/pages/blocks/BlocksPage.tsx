import { useSignals } from '@cascivo/core'
import './blocks.css'

export function BlocksPage() {
  useSignals()
  return (
    <main className="blocks-page">
      <h1 className="blocks-page__heading">Blocks</h1>
      <p className="blocks-page__subtitle">
        Production-ready UI sections built with cascivo components.
      </p>
      <div className="blocks-grid">{/* populated in T5 */}</div>
    </main>
  )
}
