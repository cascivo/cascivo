import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const PREFERENCES = [
  { id: 'updates', label: 'Product updates', on: true },
  { id: 'digest', label: 'Weekly digest', on: false },
  { id: 'security', label: 'Security alerts', on: true },
]

export function Notifications() {
  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Choose what we email you about.</p>
      </div>
      {PREFERENCES.map((pref) => (
        <div key={pref.id} className="flex items-center justify-between gap-4">
          <Label htmlFor={pref.id}>{pref.label}</Label>
          <Switch id={pref.id} defaultChecked={pref.on} />
        </div>
      ))}
      <Button type="submit" className="self-start">
        Save preferences
      </Button>
    </form>
  )
}
