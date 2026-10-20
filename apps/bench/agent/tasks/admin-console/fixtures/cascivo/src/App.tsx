// Admin console canary (cascivo): KPI overview, a users table and a settings page behind a side
// navigation. State-driven sections, the starter's own pattern, so every nav item is a button.
import { useSignalState, type SideNavItem } from '@cascivo/react'
import { Shell } from './Shell'
import { Overview } from './pages/Overview'
import { Settings } from './pages/Settings'
import { Users } from './pages/Users'

type Section = 'overview' | 'users' | 'settings'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'settings', label: 'Settings' },
]

export default function App() {
  const [section, setSection] = useSignalState<Section>('overview')

  const navItems: SideNavItem[] = SECTIONS.map(({ id, label }) => ({
    label,
    active: section.value === id,
    onClick: (e) => {
      e.preventDefault()
      setSection(id)
    },
  }))

  return (
    <Shell navItems={navItems}>
      {section.value === 'overview' && <Overview />}
      {section.value === 'users' && <Users />}
      {section.value === 'settings' && <Settings />}
    </Shell>
  )
}
