import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Portal } from './portal'

describe('Portal', () => {
  it('renders children into document.body', () => {
    render(<Portal><div>Portal content</div></Portal>)
    const el = screen.getByText('Portal content')
    expect(document.body.contains(el)).toBe(true)
  })
})
