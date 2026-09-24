---
'@cascivo/core': minor
'@cascivo/react': minor
---

New `useSignalState(initial)` — local state as `[signal, setter]`, the React Compiler-safe way
to hold state in your own components:

```tsx
const [count, setCount] = useSignalState(0)
// render: count.value · handlers: setCount(next) or setCount((n) => n + 1)
```

Assigning `count.value = …` to a signal a hook returned fails the React Compiler build and is
reported by `react-hooks/immutability`; calling the setter is neither, so this form compiles,
stays reactive and lets you keep that lint rule on (checked by `pnpm compiler:check`). The
setter is stable for the component's life, and the hook subscribes the component itself. Also
exported from `@cascivo/react`. The docs, `llms.txt` and the AI rules now teach this form;
existing `.value` assignments keep working at runtime.
