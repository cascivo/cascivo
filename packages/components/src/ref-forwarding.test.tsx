/**
 * Ref forwarding — `ref` must be typed AND reach the real DOM node.
 *
 * There was not one `forwardRef` in `@cascivo/react`'s 4,755-line `.d.ts` and no component
 * declared a `ref` prop, so `<Textarea ref={r} />` was a `ts(2322)`. At runtime it worked
 * anyway on React 19 — components spread unknown props onto the underlying element and
 * React 19 passes `ref` through as an ordinary prop — so the behaviour was correct and only
 * the types were missing. But a consumer has no way to know that, so every call site needed
 * a cast. A 2026-07-28 adopter needed the element for caret restoration in a collaborative
 * postmortem editor and kept the cast quarantined in a file of its own (report C10).
 *
 * These assert the property that matters and that a type-only fix could not give: the ref
 * resolves to a real element of the right kind, and imperative DOM methods work on it. The
 * reporter's own `setSelectionRange` check is reproduced directly.
 */
import { describe, expect, it } from 'vitest'
import { createRef } from 'react'
import { render } from '@testing-library/react'
import { Checkbox } from './checkbox/checkbox'
import { Input } from './input/input'
import { NativeSelect } from './native-select/native-select'
import { Textarea } from './textarea/textarea'

describe('ref forwarding', () => {
  it('Textarea resolves to a real HTMLTextAreaElement and accepts imperative calls', () => {
    const ref = createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} defaultValue="postmortem draft" />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    // The exact operation the reporter needed and could not reach without a cast.
    ref.current!.setSelectionRange(2, 5)
    expect(ref.current!.selectionStart).toBe(2)
    expect(ref.current!.selectionEnd).toBe(5)
  })

  it('Input resolves to a real HTMLInputElement', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} defaultValue="hello" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    ref.current!.focus()
    expect(document.activeElement).toBe(ref.current)
  })

  it('NativeSelect resolves to a real HTMLSelectElement', () => {
    const ref = createRef<HTMLSelectElement>()
    render(
      <NativeSelect ref={ref}>
        <option value="a">A</option>
      </NativeSelect>,
    )
    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
  })

  it('Checkbox forwards a ref WITHOUT breaking its own indeterminate wiring', () => {
    // Checkbox already used an internal ref to drive `indeterminate`, so the forwarded ref
    // is composed with it. A plain `ref={ref}` would have clobbered the internal one and
    // silently broken indeterminate — which is why this asserts both at once.
    const ref = createRef<HTMLInputElement>()
    render(<Checkbox ref={ref} indeterminate />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current!.indeterminate).toBe(true)
  })
})
