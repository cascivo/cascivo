import { RouterView } from '@cascivo/app'
import { Spinner, useSignals, type SideNavItem } from '@cascivo/react'
import { router } from './router'
import { Shell } from './Shell'

export default function App() {
  useSignals()
  const path = router.pathname.value

  // `href`s, not click handlers: main.tsx registers the router's Link, so these navigate
  // client-side while middle-click and "open in new tab" still work.
  const navItems: SideNavItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      active: path === '/',
    },
    {
      label: 'Reports',
      href: '/reports',
      active: path === '/reports',
    },
    {
      label: 'Settings',
      href: '/settings',
      active: path === '/settings',
    },
    {
      label: 'Checkout',
      href: '/checkout',
      active: path === '/checkout',
    },
  ]

  return (
    <Shell navItems={navItems}>
      <RouterView router={router} fallback={<Spinner label="Loading" />} />
    </Shell>
  )
}
