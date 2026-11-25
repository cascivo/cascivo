import { RelativeTime } from '../../src/relative-time/relative-time'

export default (
  <RelativeTime
    date="2026-11-25T09:00:00Z"
    now={Date.parse('2026-11-25T12:00:00Z')}
    title="November 25, 2026 at 9:00 AM"
  />
)
