/**
 * The announcement and identity layer, which had no coverage: the live region was mounted in
 * the same commit as its first file (so the first upload announced nothing), per-file status
 * was an `aria-label` on a roleless `<span>` (which is not honoured, so "Upload complete"
 * never reached a screen reader), and the ids were derived from the label — which defaults to
 * the same string for every instance, so two uploaders on a page collided.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, createEvent, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUploader } from './file-uploader'
import type { UploaderFile } from './file-uploader'

afterEach(cleanup)

const zone = (name: RegExp | string = /upload files/i): HTMLElement =>
  screen.getByRole('button', { name })

function announcer(): HTMLElement | undefined {
  return screen
    .getAllByRole('status', { hidden: true })
    .find((el) => el.getAttribute('aria-live') === 'polite' && el.tagName === 'SPAN')
}

describe('announcement', () => {
  it('mounts the live region before any file exists', () => {
    render(<FileUploader />)
    // A region added in the same commit as its content announces nothing, which is why the
    // first upload was always silent.
    expect(announcer()).toBeDefined()
    expect(announcer()).toHaveTextContent('')
  })

  it('reports the list once files arrive, with the right plural form', () => {
    const { rerender } = render(<FileUploader files={[]} />)
    rerender(<FileUploader files={[{ id: '1', name: 'a.txt', status: 'uploading' }]} />)
    expect(announcer()).toHaveTextContent('1 file: Uploading')
    rerender(
      <FileUploader
        files={[
          { id: '1', name: 'a.txt', status: 'complete' },
          { id: '2', name: 'b.txt', status: 'complete' },
        ]}
      />,
    )
    expect(announcer()).toHaveTextContent('2 files: Upload complete')
  })

  it('gives each per-file status an announced role', () => {
    const files: UploaderFile[] = [
      { id: '1', name: 'ok.txt', status: 'complete' },
      { id: '2', name: 'bad.txt', status: 'error' },
    ]
    render(<FileUploader files={files} />)
    // aria-label is not honoured on a roleless <span>, so these names were dropped entirely.
    expect(screen.getByRole('img', { name: 'Upload complete' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Upload failed' })).toBeInTheDocument()
  })

  it('announces a per-file error message', () => {
    render(
      <FileUploader
        files={[{ id: '1', name: 'x.zip', status: 'error', errorMessage: 'Too large' }]}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Too large')
  })
})

describe('identity and naming', () => {
  it('keeps two uploaders on one page distinct', () => {
    render(
      <>
        <FileUploader hint="First hint" />
        <FileUploader hint="Second hint" />
      </>,
    )
    const zones = screen.getAllByRole('button', { name: /upload files/i })
    const described = zones.map((z) => z.getAttribute('aria-describedby'))
    // Ids were a slug of the label, which defaults to the same string for every instance, so
    // aria-describedby resolved to whichever came first.
    expect(described[0]).not.toBe(described[1])
    expect(new Set(described).size).toBe(2)
  })

  it('names the zone from its visible label, not from its own generic text', () => {
    render(<FileUploader label="Import CSV" />)
    // The label used to be wired as a *description*, so every uploader announced the same
    // "Drag and drop files here…" as its name.
    expect(screen.getByRole('button', { name: 'Import CSV' })).toBeInTheDocument()
  })

  it('lets ariaLabel override the visible label for the name', () => {
    render(<FileUploader label="Import CSV" ariaLabel="Import a CSV of contacts" />)
    expect(screen.getByRole('button', { name: 'Import a CSV of contacts' })).toBeInTheDocument()
  })

  it('describes the zone with the hint only', () => {
    render(<FileUploader hint="Max 10 MB" />)
    const described = zone().getAttribute('aria-describedby')
    expect(described).toBeTruthy()
    expect(document.getElementById(described!)).toHaveTextContent('Max 10 MB')
  })

  it('does not hide the focusable file input from the tree', () => {
    render(<FileUploader />)
    const input = document.querySelector('input[type="file"]')
    // aria-hidden on a node that is programmatically focusable and is .click()ed is an ARIA
    // violation.
    expect(input).not.toHaveAttribute('aria-hidden')
  })
})

describe('disabled', () => {
  it('disables the remove buttons too', () => {
    render(<FileUploader files={[{ id: '1', name: 'a.txt', status: 'complete' }]} disabled />)
    // `disabled` reached only the input and the zone, so the remove buttons stayed live.
    expect(screen.getByRole('button', { name: /remove a\.txt/i })).toBeDisabled()
  })

  it('refuses a drop', () => {
    const onFilesAdded = vi.fn()
    render(<FileUploader disabled onFilesAdded={onFilesAdded} />)
    fireEvent.drop(zone(), {
      dataTransfer: {
        files: {
          0: new File(['x'], 'a.txt'),
          length: 1,
          [Symbol.iterator]: Array.prototype[Symbol.iterator],
        },
      },
    })
    expect(onFilesAdded).not.toHaveBeenCalled()
  })
})

describe('drag state', () => {
  /**
   * jsdom implements no `DragEvent`, so `fireEvent.dragLeave` falls back to a plain `Event`
   * whose constructor silently drops `relatedTarget` from the init dict. Build the event and
   * define the property on it directly, which is what React then reads off the native event.
   */
  function dragLeaveTowards(target: HTMLElement, relatedTarget: Node | null): void {
    const event = createEvent.dragLeave(target)
    Object.defineProperty(event, 'relatedTarget', { value: relatedTarget })
    fireEvent(target, event)
  }

  it('does not flicker off when the pointer crosses a child', () => {
    render(<FileUploader />)
    const target = zone()
    fireEvent.dragEnter(target)
    expect(target).toHaveAttribute('data-state', 'dragover')
    // Without a relatedTarget check this fired for every child crossing mid-drag.
    dragLeaveTowards(target, target.querySelector('span'))
    expect(target).toHaveAttribute('data-state', 'dragover')
    dragLeaveTowards(target, document.body)
    expect(target).toHaveAttribute('data-state', 'idle')
  })
})

describe('accept filtering', () => {
  function selectFile(file: File): void {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: { 0: file, length: 1, [Symbol.iterator]: Array.prototype[Symbol.iterator] },
    })
    fireEvent.change(input)
  }

  it('accepts a matching extension', () => {
    const onFilesAdded = vi.fn()
    render(<FileUploader accept=".csv" onFilesAdded={onFilesAdded} />)
    selectFile(new File(['a'], 'data.csv', { type: '' }))
    expect(onFilesAdded).toHaveBeenCalled()
  })

  it('accepts a wildcard MIME group', () => {
    const onFilesAdded = vi.fn()
    render(<FileUploader accept="image/*" onFilesAdded={onFilesAdded} />)
    selectFile(new File(['a'], 'p.png', { type: 'image/png' }))
    expect(onFilesAdded).toHaveBeenCalled()
  })

  it('rejects a non-matching type', () => {
    const onRejected = vi.fn()
    render(<FileUploader accept="image/*" onRejected={onRejected} />)
    selectFile(new File(['a'], 'a.txt', { type: 'text/plain' }))
    expect(onRejected).toHaveBeenCalledWith(expect.any(Array), 'type')
  })
})

describe('size formatting', () => {
  it('uses the reader’s locale rather than a hardcoded separator and unit', () => {
    render(
      <FileUploader
        files={[{ id: '1', name: 'f.pdf', size: 1024 * 1024 * 2.5, status: 'complete' }]}
      />,
    )
    // The unit strings and the decimal separator were both hardcoded English before.
    const row = screen.getByText('f.pdf').closest('li')!
    expect(within(row).getByText(/2[.,]5/)).toBeInTheDocument()
  })

  it('formats bytes without a fraction', () => {
    render(<FileUploader files={[{ id: '1', name: 'f.txt', size: 512, status: 'complete' }]} />)
    const row = screen.getByText('f.txt').closest('li')!
    expect(within(row).getByText(/^512/)).toBeInTheDocument()
  })
})

describe('labels', () => {
  it('replaces every {name} placeholder in a remove override', () => {
    render(
      <FileUploader
        files={[{ id: '1', name: 'a.txt', status: 'complete' }]}
        labels={{ remove: 'Drop {name} ({name})' }}
      />,
    )
    expect(screen.getByRole('button', { name: 'Drop a.txt (a.txt)' })).toBeInTheDocument()
  })

  it('opens the file dialog from the keyboard', async () => {
    const user = userEvent.setup()
    render(<FileUploader />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const click = vi.spyOn(input, 'click').mockImplementation(() => {})
    zone().focus()
    await user.keyboard('{Enter}')
    expect(click).toHaveBeenCalled()
  })
})
