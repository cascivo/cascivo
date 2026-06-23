import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FlowControls } from './flow-controls.tsx'

describe('FlowControls', () => {
  it('renders i18n-labeled zoom + fit buttons that call the actions', () => {
    const onZoomIn = vi.fn()
    const onZoomOut = vi.fn()
    const onFitView = vi.fn()
    const { getByLabelText } = render(
      <FlowControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} onFitView={onFitView} />,
    )
    fireEvent.click(getByLabelText('Zoom in'))
    fireEvent.click(getByLabelText('Zoom out'))
    fireEvent.click(getByLabelText('Fit view'))
    expect(onZoomIn).toHaveBeenCalledTimes(1)
    expect(onZoomOut).toHaveBeenCalledTimes(1)
    expect(onFitView).toHaveBeenCalledTimes(1)
  })

  it('honors label overrides and showZoom=false', () => {
    const { queryByLabelText, getByLabelText } = render(
      <FlowControls showZoom={false} labels={{ fitView: 'Frame all' }} />,
    )
    expect(queryByLabelText('Zoom in')).toBeNull()
    expect(getByLabelText('Frame all')).toBeInTheDocument()
  })
})
