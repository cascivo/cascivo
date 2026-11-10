import { Breadcrumb } from '../../src/breadcrumb/breadcrumb'

export default (
  <Breadcrumb
    items={[
      { label: '<b>x</b>', href: '/a' },
      { label: '<i>&q', href: '/b?x=1&y=2' },
      { label: '<script>alert(1)</script>' },
    ]}
  />
)
