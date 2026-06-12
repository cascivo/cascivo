import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const OPTIONS = Array.from({ length: 50 }, (_, i) => i)

export function FormPage() {
  const [query, setQuery] = useState('')
  const [checked, setChecked] = useState<boolean[]>(OPTIONS.map(() => false))

  return (
    <main data-bench-root="form" className="space-y-2 p-4">
      <Input
        data-bench-input="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
      />
      <span data-bench-echo="search">{query}</span>
      <Button data-bench="toggle-all" onClick={() => setChecked((c) => c.map((v) => !v))}>
        Toggle all
      </Button>
      {OPTIONS.map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Checkbox
            id={`opt-${i}`}
            checked={checked[i] ?? false}
            onCheckedChange={() =>
              setChecked((c) => {
                const next = [...c] as boolean[]
                next[i] = !next[i]!
                return next
              })
            }
          />
          <Label htmlFor={`opt-${i}`}>Option {i + 1}</Label>
        </div>
      ))}
    </main>
  )
}
