Core runtime for cascivo — micro-FSM engine, Preact Signals integration (`useSignal`, `useComputed`, `useSignalEffect`, `useSignals`), and base utilities shared across all components.

## Interaction hooks

Signal-driven, SSR-safe hooks (no `useState`/`useEffect`). These cover the user-facing `@heroui/use-*` hooks cascivo previously lacked.

### `useDisclosure`

Open/close state for overlays, controllable via an optional `isOpen`.

```tsx
const { isOpen, open, close, toggle } = useDisclosure({ defaultOpen: false })
// isOpen is a ReadonlySignal<boolean>; pass isOpen + onOpenChange for controlled use.
```

### `useInfiniteScroll`

Calls `onLoadMore` when a sentinel element scrolls into view (`IntersectionObserver`), gated by `hasMore`.

```tsx
const { sentinelRef } = useInfiniteScroll({ hasMore, onLoadMore: loadNextPage })
return (
  <ul>
    {rows}
    <li ref={sentinelRef} />
  </ul>
)
```

### `useDraggable`

Pointer-driven drag offset applied as a CSS `translate` — no animation library (replaces HeroUI's Framer-based drag).

```tsx
const { handleRef, targetRef, offset } = useDraggable({ axis: 'both' })
// apply offset.value as translate(offset.x, offset.y) on the target element.
```
