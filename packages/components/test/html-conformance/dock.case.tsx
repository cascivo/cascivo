import { Dock } from '../../src/dock/dock'

export default (
  <Dock
    items={[
      { label: 'Home', href: '/', icon: 'H' },
      { label: 'Search', icon: 'S' },
      { label: 'Me', href: '/me', icon: 'M' },
    ]}
  />
)
