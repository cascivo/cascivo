import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Stack } from './stack'

describe('Stack', () => {
  it('renders each child wrapped in a layer div', () => {
    const { container } = render(
      <Stack>
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </Stack>,
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.children).toHaveLength(3)
  })

  it('sets default --cascivo-stack-offset of 4px on the wrapper', () => {
    const { container } = render(
      <Stack>
        <div>A</div>
      </Stack>,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.getPropertyValue('--cascivo-stack-offset')).toBe('4px')
  })

  it('sets --cascivo-stack-offset from the offset prop', () => {
    const { container } = render(
      <Stack offset={8}>
        <div>A</div>
      </Stack>,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.getPropertyValue('--cascivo-stack-offset')).toBe('8px')
  })

  it('sets --cascivo-stack-index equal to child position', () => {
    const { container } = render(
      <Stack>
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </Stack>,
    )
    const wrapper = container.firstElementChild!
    const layers = Array.from(wrapper.children) as HTMLElement[]
    expect(layers[0]!.style.getPropertyValue('--cascivo-stack-index')).toBe('0')
    expect(layers[1]!.style.getPropertyValue('--cascivo-stack-index')).toBe('1')
    expect(layers[2]!.style.getPropertyValue('--cascivo-stack-index')).toBe('2')
  })
})
