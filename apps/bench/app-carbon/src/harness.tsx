import { Profiler, type ReactNode } from 'react'

declare global {
  interface Window {
    __commits: number
  }
}

if (typeof window !== 'undefined') window.__commits = 0

export function CommitCounter({ children }: { children: ReactNode }) {
  return (
    <Profiler
      id="bench-root"
      onRender={() => {
        window.__commits += 1
      }}
    >
      {children}
    </Profiler>
  )
}
