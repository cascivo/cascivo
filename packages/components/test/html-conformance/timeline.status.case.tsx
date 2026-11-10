import { Timeline } from '../../src/timeline/timeline'

export default (
  <Timeline
    items={[
      { id: '0', title: 'A', status: 'current' },
      { id: '1', title: 'B', status: 'upcoming' },
      { id: '2', title: 'C', status: 'error' },
      { id: '3', title: 'D', status: 'error', tone: 'danger' },
      { id: '4', title: 'E', status: 'bogus' as never, tone: 'weird' as never },
    ]}
  />
)
