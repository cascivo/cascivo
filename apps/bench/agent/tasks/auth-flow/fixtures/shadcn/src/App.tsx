// Auth flow canary (shadcn): log-in and sign-up pages and a dashboard behind hash routes, so the
// pages are linked with real anchors. Register-first: log-in refuses an unknown account, sign-up
// stores the account in memory and returns to log-in. Logging in waits briefly, as a real request
// would.
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function currentPath() {
  return window.location.hash.replace(/^#/, '') || '/login'
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

type Accounts = Record<string, string>

function field(event: FormEvent<HTMLFormElement>, name: string): string {
  const value = new FormData(event.currentTarget).get(name)
  return typeof value === 'string' ? value.trim() : ''
}

function LogIn({
  accounts,
  notice,
  onLogIn,
}: {
  accounts: Accounts
  notice: string
  onLogIn: (user: string) => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const user = field(event, 'user')
    const password = field(event, 'password')
    setPending(true)
    setError('')
    window.setTimeout(() => {
      setPending(false)
      if (accounts[user] !== undefined && accounts[user] === password) onLogIn(user)
      else setError('No account found for that username or email.')
    }, 400)
  }
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1>Log in</h1>
        </CardTitle>
        <CardDescription>Welcome back. Log in to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          {notice !== '' && (
            <p role="status" className="text-sm">
              {notice}
            </p>
          )}
          <div className="grid gap-2">
            <Label htmlFor="user">Username or email</Label>
            <Input id="user" name="user" autoComplete="username" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {error !== '' && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? 'Logging in…' : 'Log in'}
          </Button>
          <p className="text-sm text-muted-foreground">
            New here?{' '}
            <a className="underline" href="#/signup">
              Sign up
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

function SignUp({ onSignUp }: { onSignUp: (email: string, password: string) => void }) {
  const [error, setError] = useState('')
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1>Sign up</h1>
        </CardTitle>
        <CardDescription>Create an account in a minute.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            const password = field(event, 'password')
            if (password !== field(event, 'confirm')) {
              setError('The passwords do not match.')
              return
            }
            onSignUp(field(event, 'email'), password)
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="new-email">Email</Label>
            <Input id="new-email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">Password</Label>
            <Input id="new-password" name="password" type="password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input id="confirm-password" name="confirm" type="password" required />
          </div>
          {error !== '' && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit">Create account</Button>
          <p className="text-sm text-muted-foreground">
            Have an account?{' '}
            <a className="underline" href="#/login">
              Log in
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

export function App() {
  const path = useHashPath()
  const [user, setUser] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Accounts>({})
  const [notice, setNotice] = useState('')

  if (path === '/dashboard' && user !== null) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Your dashboard</h1>
        <p>Signed in as {user}.</p>
        <Button
          variant="outline"
          className="self-start"
          onClick={() => {
            setUser(null)
            window.location.hash = '#/login'
          }}
        >
          Log out
        </Button>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      {path === '/signup' ? (
        <SignUp
          onSignUp={(email, password) => {
            setAccounts((all) => ({ ...all, [email]: password }))
            setNotice(`Account created for ${email}. Log in to continue.`)
            window.location.hash = '#/login'
          }}
        />
      ) : (
        <LogIn
          accounts={accounts}
          notice={notice}
          onLogIn={(name) => {
            setUser(name)
            window.location.hash = '#/dashboard'
          }}
        />
      )}
    </main>
  )
}

export default App
