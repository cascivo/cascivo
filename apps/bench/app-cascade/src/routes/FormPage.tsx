import { useSignal } from '@cascade-ui/core'
import type React from 'react'
import { Button, Checkbox, Input } from '@cascade-ui/react'

const OPTIONS = Array.from({ length: 50 }, (_, i) => i)

export function FormPage() {
  const query = useSignal('')
  const checked = useSignal<boolean[]>(OPTIONS.map(() => false))

  return (
    <main data-bench-root="form">
      <Input
        data-bench-input="search"
        label="Search"
        value={query.value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => (query.value = e.currentTarget.value)}
      />
      <span data-bench-echo="search">{query.value}</span>
      <Button
        data-bench="toggle-all"
        onClick={() => (checked.value = checked.value.map((c) => !c))}
      >
        Toggle all
      </Button>
      {OPTIONS.map((i) => (
        <Checkbox
          key={i}
          label={`Option ${i + 1}`}
          checked={checked.value[i]}
          onChange={() => {
            const next = [...checked.value] as boolean[]
            next[i] = !next[i]!
            checked.value = next
          }}
        />
      ))}
    </main>
  )
}
