import { Dock } from '../../src/dock/dock'

export default (
  <Dock
    activeIndex={1}
    ariaLabel="Tabs"
    items={[
      { label: 'Home', href: '/', icon: null },
      { label: 'Search', href: '/s', icon: null },
    ]}
  />
)
