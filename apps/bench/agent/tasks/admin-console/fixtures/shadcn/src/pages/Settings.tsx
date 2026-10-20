import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function Settings() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-2">
              <Label htmlFor="workspace">Workspace name</Label>
              <Input id="workspace" defaultValue="Acme" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="alerts" defaultChecked />
              <Label htmlFor="alerts">Email alerts</Label>
            </div>
            <Button type="submit" className="self-start">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
