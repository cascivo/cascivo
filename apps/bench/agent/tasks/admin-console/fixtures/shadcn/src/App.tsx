// Admin console canary (shadcn): KPI overview, a users table and a settings page behind a side
// navigation. Hash routes, so every nav item is a real link.
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Overview } from '@/pages/Overview'
import { Settings } from '@/pages/Settings'
import { Users } from '@/pages/Users'

const ROUTES = [
  { path: '/', label: 'Overview' },
  { path: '/users', label: 'Users' },
  { path: '/settings', label: 'Settings' },
]

function currentPath() {
  return window.location.hash.replace(/^#/, '') || '/'
}

function useHashPath() {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return path
}

export function App() {
  const path = useHashPath()
  return (
    <div className="flex min-h-svh">
      <aside className="w-56 border-r p-4">
        <p className="mb-4 px-2 font-semibold">Admin</p>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {ROUTES.map((route) => (
            <Button
              key={route.path}
              asChild
              variant={path === route.path ? 'secondary' : 'ghost'}
              className="justify-start"
            >
              <a href={`#${route.path}`} aria-current={path === route.path ? 'page' : undefined}>
                {route.label}
              </a>
            </Button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        {path === '/users' ? <Users /> : path === '/settings' ? <Settings /> : <Overview />}
      </main>
    </div>
  )
}

export default App
