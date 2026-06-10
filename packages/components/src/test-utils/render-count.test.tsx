import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { createRenderProbe } from './render-count'

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      {count}
    </button>
  )
}

describe('createRenderProbe', () => {
  it('counts the mount commit and each re-render commit', async () => {
    const { Probe, commits } = createRenderProbe()
    render(
      <Probe>
        <Counter />
      </Probe>,
    )
    expect(commits()).toBe(1)
    await userEvent.click(document.querySelector('button')!)
    expect(commits()).toBe(2)
  })
})
