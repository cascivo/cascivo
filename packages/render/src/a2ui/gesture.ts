// What counts as the user acting on a control: the event types a browser marks trusted only
// when the user produced them. A click (keyboard activation of a button is one too), a key
// press or a pointer release; not `change`, `close` or `pointerdown`, which script or a
// programmatic state change can cause without the user touching the control.
const GESTURES: ReadonlySet<string> = new Set(['click', 'keydown', 'keyup', 'pointerup'])

/**
 * Whether `event`, the first argument a handler got, is a trusted user gesture: a DOM event, or
 * a React synthetic event (checked through its `nativeEvent`), with `isTrusted` set by the
 * browser. An event a script dispatches, or a callback called without one, is not.
 */
export function isTrustedGesture(event: unknown): boolean {
  if (typeof event !== 'object' || event === null) return false
  const native: unknown = 'nativeEvent' in event ? event.nativeEvent : event
  if (typeof native !== 'object' || native === null) return false
  if (!('isTrusted' in native) || native.isTrusted !== true) return false
  return 'type' in native && typeof native.type === 'string' && GESTURES.has(native.type)
}
