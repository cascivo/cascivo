// Public entry for `@cascivo/render/a2ui/v0_9`: the A2UI v0.9 store, surface and catalogs.
import { basicCatalog } from './a2ui/basic-catalog'
import { basicCatalogSpec } from './a2ui/basic-spec'
import { cascivoCatalogSpec } from './a2ui/catalog-spec'
import { cascivoCatalog } from './a2ui/surface'

export { createA2uiStore, DEFAULT_A2UI_LIMITS } from './a2ui/store'
export type { A2uiStore, A2uiLimits, A2uiSurfaceState } from './a2ui/store'
export { A2uiSurface, cascivoCatalog } from './a2ui/surface'
export type { A2uiSurfaceProps, A2uiRenderCatalog, A2uiAdapter, AdapterInput } from './a2ui/surface'
export { basicCatalog } from './a2ui/basic-catalog'
export { cascivoCatalogSpec } from './a2ui/catalog-spec'
export type { A2uiCatalogSpec } from './a2ui/catalog-spec'
export { basicCatalogSpec } from './a2ui/basic-spec'
export {
  A2UI_VERSION,
  A2UI_CATALOG_ID,
  BASIC_CATALOG_ID,
  parseServerMessage,
} from './a2ui/messages'
export type { A2uiActionMessage, A2uiErrorMessage, A2uiComponent } from './a2ui/messages'

/** Render catalogs for `<A2uiSurface catalogs>`, in the order the store's specs are given. */
export const defaultCatalogs = [cascivoCatalog, basicCatalog] as const
/** Specs for `createA2uiStore({ catalogs })`; pairs with `defaultCatalogs`. */
export const defaultCatalogSpecs = [cascivoCatalogSpec, basicCatalogSpec] as const
