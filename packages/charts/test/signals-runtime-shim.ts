// Preact-bridge shim for `@preact/signals-react/runtime`. Under preact/compat
// the signals-react auto-tracking runtime reaches into React-specific internals
// that don't exist on Preact, so `useSignals()` is shimmed to a no-op (the same
// approach the docs/Button Preact bridge uses). `useSignal` and friends keep
// working via preact's own hooks; reactivity isn't needed for the mount smoke
// test, only that the components render under the bridge.
export function useSignals(): { f: () => void } {
  return { f() {} }
}
