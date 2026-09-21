/**
 * A live DOM subtree → `TextNode` tree, with the *current* state of every control.
 *
 * This is the half that makes <TextView> worth having over rendering the same markup to a
 * string: an HTML string carries the control values a component was born with, while the DOM
 * carries what someone has typed, checked, selected and opened since. `input.value` and
 * `input.getAttribute('value')` diverge the moment a key is pressed, and it is the property
 * that is true.
 *
 * Live state is written into `attrs` so `emit()` never needs to know which adapter produced
 * the tree — the difference is resolved here, once.
 *
 * Duck-typed rather than `instanceof HTMLInputElement`: this module is reachable from the
 * serializer entry, and a bare Node process has no such global to compare against.
 */
import type { TextNode } from './tree.ts'
import { CLOSED, element, text } from './tree.ts'

const TEXT_NODE = 3
const ELEMENT_NODE = 1

interface LiveControl {
  value?: unknown
  checked?: unknown
  open?: unknown
  indeterminate?: unknown
}

/** Overlay the properties that outrank the attributes they shadow. */
function liveState(el: Element, attrs: Record<string, string>): void {
  const live = el as unknown as LiveControl
  const tag = el.tagName.toLowerCase()

  if (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    tag === 'progress' ||
    tag === 'meter'
  ) {
    if (typeof live.value === 'string' || typeof live.value === 'number') {
      attrs['value'] = String(live.value)
    }
  }
  if (tag === 'input') {
    if (live.checked === true) attrs['checked'] = ''
    else delete attrs['checked']
    if (live.indeterminate === true) attrs['aria-checked'] = 'mixed'
  }
  if (tag === 'details' || tag === 'dialog') {
    if (live.open === true) {
      attrs['open'] = ''
    } else {
      delete attrs['open']
      // Proof, not absence of evidence: an open <dialog> has no `open` ATTRIBUTE either.
      attrs[CLOSED] = ''
    }
  }
  // A native popover's open state lives nowhere but the selector. `matches` throws on an
  // unknown pseudo-class in older engines, which is not a reason to lose the whole tree.
  if (el.hasAttribute('popover')) {
    try {
      if (el.matches(':popover-open')) attrs['data-state'] = 'open'
    } catch {
      /* engine without :popover-open — the attribute-derived state stands */
    }
  }
}

/** Snapshot `el` and everything under it. */
export function fromElement(el: Element): TextNode {
  const attrs: Record<string, string> = {}
  for (const { name, value } of Array.from(el.attributes)) attrs[name.toLowerCase()] = value
  liveState(el, attrs)

  const node = element(el.tagName.toLowerCase(), attrs)
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === TEXT_NODE) {
      const value = child.nodeValue ?? ''
      if (value !== '') node.children.push(text(value))
    } else if (child.nodeType === ELEMENT_NODE) {
      node.children.push(fromElement(child as Element))
    }
  }
  return node
}
