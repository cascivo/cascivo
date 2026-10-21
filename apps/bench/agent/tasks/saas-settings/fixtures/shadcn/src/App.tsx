// SaaS settings canary (shadcn): profile, billing and notification preferences, each its own
// page. Local state, so every nav item is a button.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Billing } from '@/pages/Billing'
import { Notifications } from '@/pages/Notifications'
import { Profile } from '@/pages/Profile'

type Page = 'profile' | 'billing' | 'notifications'

const PAGES: { id: Page; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'billing', label: 'Billing' },
  { id: 'notifications', label: 'Notifications' },
]

export function App() {
  const [page, setPage] = useState<Page>('profile')
  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-6 p-6 md:flex-row">
      <nav aria-label="Settings" className="flex gap-1 md:w-48 md:flex-col">
        {PAGES.map(({ id, label }) => (
          <Button
            key={id}
            variant={page === id ? 'secondary' : 'ghost'}
            className="justify-start"
            aria-current={page === id ? 'page' : undefined}
            onClick={() => setPage(id)}
          >
            {label}
          </Button>
        ))}
      </nav>
      <main className="flex-1">
        {page === 'profile' && <Profile />}
        {page === 'billing' && <Billing />}
        {page === 'notifications' && <Notifications />}
      </main>
    </div>
  )
}

export default App
