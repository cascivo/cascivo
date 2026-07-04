import '@testing-library/jest-dom'

if (typeof CSS === 'undefined') {
  // @ts-expect-error — jsdom omits CSS global
  globalThis.CSS = { supports: () => false }
} else if (typeof CSS.supports !== 'function') {
  CSS.supports = () => false
}

// jsdom lacks the Popover API used by HeaderPanel / Sheet — stub it.
const _setAttribute = HTMLElement.prototype.setAttribute
HTMLElement.prototype.setAttribute = function (name: string, value: string) {
  if (name === 'popover') return
  _setAttribute.call(this, name, value)
}
HTMLElement.prototype.showPopover = function () {}
HTMLElement.prototype.hidePopover = function () {}

// jsdom lacks ResizeObserver, used by useElementSize.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
