import { Header } from '../../src/header/header'

export default (
  <Header
    links={[
      { label: "<b>&", href: '/a?x&y' },
      { label: 'Q', href: '/q' },
    ]}
  />
)
