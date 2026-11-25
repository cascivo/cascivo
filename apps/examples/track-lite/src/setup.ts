import '@testing-library/jest-dom'

if (typeof CSS === 'undefined') {
  // @ts-expect-error — jsdom omits CSS global
  globalThis.CSS = { supports: () => false }
} else if (typeof CSS.supports !== 'function') {
  CSS.supports = () => false
}

// jsdom has no modal dialog: open/close by attribute, enough for Modal's showModal()/close().
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
