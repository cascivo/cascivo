export type {
  RegistryFile,
  RegistryItemType,
  RegistryAdvisory,
  RegistryItem,
  RegistryIndex,
  LegacyRegistry,
  LegacyRegistryEntry,
} from './types.ts'

export { validateItem, validateIndex, parseLegacyRegistry } from './validate.ts'
export type { ValidationResult } from './validate.ts'

export { buildRegistry } from './build.ts'

export { toShadcnItem, shadcnName, writeShadcnRegistry } from './shadcn.ts'
export type {
  ShadcnItemType,
  ShadcnRegistryFile,
  ShadcnRegistryItem,
  ToShadcnOptions,
} from './shadcn.ts'

export { matchAdvisories } from './advisories.ts'

export type { DirectoryEntry, RegistryDirectory, DirectoryValidationResult } from './directory.ts'
export { validateDirectory } from './directory.ts'
