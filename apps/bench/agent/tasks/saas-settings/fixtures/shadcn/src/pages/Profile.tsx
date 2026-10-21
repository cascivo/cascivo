import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Profile() {
  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">How you appear to your teammates.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" defaultValue="Ada Lovelace" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" defaultValue="ada@example.com" />
      </div>
      <Button type="submit" className="self-start">
        Save profile
      </Button>
    </form>
  )
}
