---
'@cascivo/core': minor
---

`persistedSignal(key, initial, { parse })` checks what it reads back. `parse(raw)` returns the
stored value as a `T` or throws; a value that throws is dropped with a warning and the signal
keeps its current value. It runs on load and on every change from another tab. Without
`parse`, a stored value is still taken as it is.
