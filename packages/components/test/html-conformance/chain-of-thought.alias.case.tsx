import { ChainOfThought } from '../../src/chain-of-thought/chain-of-thought'

export default (
  <ChainOfThought
    items={[
      { id: '1', title: 'One', status: 'current' },
      { id: '2', title: 'Two', status: 'upcoming' },
      { id: '3', title: 'Three' },
    ]}
  />
)
