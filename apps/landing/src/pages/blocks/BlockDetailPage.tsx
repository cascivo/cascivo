import { useSignals } from '@cascivo/core'
import './blocks.css'

type Props = {
  name: string
}

export function BlockDetailPage({ name }: Props) {
  useSignals()
  return (
    <main className="blocks-page">
      <h1 className="blocks-page__heading">{name}</h1>
      <p className="blocks-page__subtitle">Block preview — coming in T5.</p>
    </main>
  )
}
