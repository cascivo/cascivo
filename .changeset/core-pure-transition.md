---
'@cascivo/core': minor
'@cascivo/react': patch
---

`transition(machine, state, event)`: the transition rule `useMachine` runs, as a pure function.
`createMachine` and `transition` are now also on `@cascivo/core/pure`, for framework-free code.

`Menu` trigger and items meet the 44px coarse-pointer target; on coarse pointers below `30rem`
the `DatePicker` calendar opens as a bottom sheet instead of overflowing the viewport.
