import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FocusScope } from './focus-scope'

describe('FocusScope', () => {
  it('renders children', () => {
    const { container } = render(
      <FocusScope><button type="button">Test</button></FocusScope>
    )
    expect(container.querySelector('button')).toBeTruthy()
  })
})
