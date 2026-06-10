import { Profiler, type ReactNode } from 'react'

/**
 * Counts React commits inside the probed subtree. Signal-driven DOM patches
 * bypass React entirely, so they do NOT increment the count — this is the
 * measurable form of the "zero re-renders on interaction" contract.
 */
export function createRenderProbe(): {
  Probe: (props: { children: ReactNode }) => ReactNode
  commits: () => number
} {
  let commits = 0
  function Probe({ children }: { children: ReactNode }) {
    return (
      <Profiler
        id="render-probe"
        onRender={() => {
          commits++
        }}
      >
        {children}
      </Profiler>
    )
  }
  return { Probe, commits: () => commits }
}
