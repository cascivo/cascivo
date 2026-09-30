import { createRouter } from '@cascivo/app'
import { notFound, routes } from './routes.gen'

// `routes.gen.ts` is written by `cascivoRoutes()` (vite.config.ts) from `src/routes/**`.
export const router = createRouter({ routes, notFound })
