// Compile-time only (tsc via `check`): proves the generated augmentation reaches Solid's JSX.
import './cv-elements.ts'

export const ok = (
  <cv-combobox name="x" required on:cv-value-change={(e) => e.detail.value?.toUpperCase()} />
)
export const tabs = (
  <cv-tabs activation="manual" on:cv-value-change={(e) => e.detail.value.length} />
)
// @ts-expect-error unknown attribute on a typed element
export const bad = <cv-tabs activation="sideways" />
