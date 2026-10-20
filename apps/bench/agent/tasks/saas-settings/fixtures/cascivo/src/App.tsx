// SaaS settings canary (cascivo): profile, billing and notification preferences, each its own
// page behind the side navigation (state-driven sections, the starter's pattern).
import { useSignalState, type SideNavItem } from '@cascivo/react'
import { Shell } from './Shell'
import { Billing } from './pages/Billing'
import { Notifications } from './pages/Notifications'
import { Profile } from './pages/Profile'

type Page = 'profile' | 'billing' | 'notifications'

const PAGES: { id: Page; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'billing', label: 'Billing' },
  { id: 'notifications', label: 'Notifications' },
]

export default function App() {
  const [page, setPage] = useSignalState<Page>('profile')

  const navItems: SideNavItem[] = PAGES.map(({ id, label }) => ({
    label,
    active: page.value === id,
    onClick: (e) => {
      e.preventDefault()
      setPage(id)
    },
  }))

  return (
    <Shell navItems={navItems}>
      {page.value === 'profile' && <Profile />}
      {page.value === 'billing' && <Billing />}
      {page.value === 'notifications' && <Notifications />}
    </Shell>
  )
}
