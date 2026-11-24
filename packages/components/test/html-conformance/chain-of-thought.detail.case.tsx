import { ChainOfThought } from '../../src/chain-of-thought/chain-of-thought'

export default (
  <ChainOfThought
    items={[
      {
        id: '1',
        title: 'Query index',
        status: 'complete',
        description: '3 hits',
        detail: 'top: docs.md',
      },
      { id: '2', title: 'Plan', detail: 'notes' },
    ]}
  />
)
