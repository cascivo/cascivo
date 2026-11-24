/**
 * The `generateScopedName` for cascivo's own Vite builds (`@cascivo/react`, site, storybook,
 * examples): `cv-<unit>-<local>` for `packages/components/src/<unit>/*.module.css`, hashed for
 * everything else. Every local follows the pattern, matching lightningcss in `css.ts`, so the
 * React DOM carries the contract classes. Imported by path (not `@cascivo/css/vite`) so a
 * config loads without a prior build.
 */
import { createCascivoScopedName } from '../../packages/css/src/vite.ts'

const COMPONENT_MODULE = /\/packages\/components\/src\/([^/]+)\/[^/]+\.module\.css$/

export const cascivoRepoScopedName = createCascivoScopedName({
  unit: (file) => COMPONENT_MODULE.exec(file)?.[1],
  locals: 'any',
})
