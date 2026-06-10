import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FileUploader, type UploaderFile } from './file-uploader'

const SAMPLE_FILES: UploaderFile[] = [
  { id: '1', name: 'document.pdf', size: 1024 * 50, status: 'complete' },
  { id: '2', name: 'photo.jpg', size: 1024 * 200, status: 'uploading' },
  { id: '3', name: 'broken.zip', size: 1024, status: 'error', errorMessage: 'Upload failed' },
]

describe('FileUploader', () => {
  it('renders drop zone with default label', () => {
    render(<FileUploader />)
    expect(screen.getByText('Upload files')).toBeInTheDocument()
    expect(screen.getByText('Drag and drop files here or click to upload')).toBeInTheDocument()
  })

  it('renders with custom label', () => {
    render(<FileUploader label="Import CSV" />)
    expect(screen.getByText('Import CSV')).toBeInTheDocument()
  })

  it('renders hint text', () => {
    render(<FileUploader hint="Max 10 MB" />)
    expect(screen.getByText('Max 10 MB')).toBeInTheDocument()
  })

  it('disables zone when disabled', () => {
    render(<FileUploader disabled />)
    expect(screen.getByRole('button', { name: /drag and drop/i })).toBeDisabled()
  })

  it('renders file list', () => {
    render(<FileUploader files={SAMPLE_FILES} />)
    expect(screen.getByText('document.pdf')).toBeInTheDocument()
    expect(screen.getByText('photo.jpg')).toBeInTheDocument()
    expect(screen.getByText('broken.zip')).toBeInTheDocument()
  })

  it('calls onRemove when remove button clicked', () => {
    const onRemove = vi.fn()
    render(<FileUploader files={SAMPLE_FILES} onRemove={onRemove} />)
    const removeBtn = screen.getByRole('button', { name: /remove document\.pdf/i })
    fireEvent.click(removeBtn)
    expect(onRemove).toHaveBeenCalledWith('1')
  })

  it('shows uploading spinner', () => {
    render(<FileUploader files={[{ id: '1', name: 'file.txt', status: 'uploading' }]} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error message for failed files', () => {
    render(
      <FileUploader
        files={[{ id: '1', name: 'x.zip', status: 'error', errorMessage: 'Too large' }]}
      />,
    )
    expect(screen.getByText('Too large')).toBeInTheDocument()
  })

  it('calls onFilesAdded when files selected via input', () => {
    const onFilesAdded = vi.fn()
    render(<FileUploader onFilesAdded={onFilesAdded} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
    Object.defineProperty(input, 'files', {
      value: { 0: file, length: 1, [Symbol.iterator]: Array.prototype[Symbol.iterator] },
    })
    fireEvent.change(input)
    expect(onFilesAdded).toHaveBeenCalledWith([file])
  })

  it('handles drag-over state', () => {
    render(<FileUploader />)
    const zone = screen.getByRole('button', { name: /drag and drop/i })
    expect(zone).toHaveAttribute('data-state', 'idle')
    fireEvent.dragEnter(zone)
    expect(zone).toHaveAttribute('data-state', 'dragover')
    fireEvent.dragLeave(zone)
    expect(zone).toHaveAttribute('data-state', 'idle')
  })

  it('calls onFilesAdded on drop', () => {
    const onFilesAdded = vi.fn()
    render(<FileUploader onFilesAdded={onFilesAdded} />)
    const zone = screen.getByRole('button', { name: /drag and drop/i })
    const file = new File(['data'], 'drop.txt', { type: 'text/plain' })
    fireEvent.drop(zone, {
      dataTransfer: {
        files: { 0: file, length: 1, [Symbol.iterator]: Array.prototype[Symbol.iterator] },
      },
    })
    expect(onFilesAdded).toHaveBeenCalledWith([file])
  })

  it('filters by maxSize and calls onRejected', () => {
    const onFilesAdded = vi.fn()
    const onRejected = vi.fn()
    render(<FileUploader onFilesAdded={onFilesAdded} onRejected={onRejected} maxSize={100} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'.repeat(200)], 'big.txt', { type: 'text/plain' })
    Object.defineProperty(input, 'files', {
      value: { 0: file, length: 1, [Symbol.iterator]: Array.prototype[Symbol.iterator] },
    })
    fireEvent.change(input)
    expect(onFilesAdded).not.toHaveBeenCalled()
    expect(onRejected).toHaveBeenCalledWith([file], 'size')
  })

  it('formats file size correctly', () => {
    render(
      <FileUploader
        files={[{ id: '1', name: 'f.pdf', size: 1024 * 1024 * 2.5, status: 'complete' }]}
      />,
    )
    expect(screen.getByText('2.5 MB')).toBeInTheDocument()
  })
})
