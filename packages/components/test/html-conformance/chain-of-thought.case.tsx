import { ChainOfThought } from '../../src/chain-of-thought/chain-of-thought'

export default (
  <ChainOfThought
    items={[
      { id: '1', title: 'Search the web', status: 'complete' },
      { id: '2', title: 'Read results', status: 'active', description: 'Opening 3 pages' },
      { id: '3', title: 'Summarise', status: 'pending' },
      { id: '4', title: 'Verify', status: 'error', description: 'Source missing' },
    ]}
  />
)
