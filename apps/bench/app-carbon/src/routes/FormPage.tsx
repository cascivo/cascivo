import { Button, Checkbox, TextInput } from '@carbon/react'
import { useState } from 'react'

const OPTIONS = Array.from({ length: 50 }, (_, i) => i)

export function FormPage() {
  const [query, setQuery] = useState('')
  const [checked, setChecked] = useState<boolean[]>(OPTIONS.map(() => false))

  return (
    <main data-bench-root="form">
      <TextInput
        id="search"
        labelText="Search"
        data-bench-input="search"
        value={query}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
      />
      <span data-bench-echo="search">{query}</span>
      <Button
        data-bench="toggle-all"
        onClick={() => setChecked((c: boolean[]) => c.map((v) => !v))}
      >
        Toggle all
      </Button>
      {OPTIONS.map((i) => (
        <Checkbox
          key={i}
          id={`opt-${i}`}
          labelText={`Option ${i + 1}`}
          checked={checked[i]}
          onChange={() =>
            setChecked((c: boolean[]) => {
              const next = [...c] as boolean[]
              next[i] = !next[i]!
              return next
            })
          }
        />
      ))}
    </main>
  )
}
