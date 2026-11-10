import { Breadcrumb } from '../../src/breadcrumb/breadcrumb'

export default (
  <Breadcrumb
    maxVisible={3}
    items={[
      { label: 'A', href: '/a' },
      { label: 'B', href: '/b' },
      { label: 'C', href: '/c' },
      { label: 'D', href: '/d' },
      { label: 'E' },
    ]}
  />
)
