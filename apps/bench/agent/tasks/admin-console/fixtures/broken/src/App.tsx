// BROKEN canary: removes the KPI figures. The overview shows its stat cards, but every value is a
// placeholder dash (data that never loaded), so no heading, region or text carries a number.
// Everything else matches the cascivo canary.
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
