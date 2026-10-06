// The `/vitest` entry augments vitest's `Assertion`; the bare entry augments the `jest` global,
// which vitest 5 no longer folds into `Assertion`.
import '@testing-library/jest-dom/vitest'
