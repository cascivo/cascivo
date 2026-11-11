import { Timeline } from '../../src/timeline/timeline'

export default (
  <Timeline
    items={[
      { id: '0', title: 'Placed' },
      { id: '1', title: 'Shipped', description: 'On its way', time: '09:00', status: 'complete' },
      { id: '2', title: 'Delivered', status: 'active' },
    ]}
  />
)
