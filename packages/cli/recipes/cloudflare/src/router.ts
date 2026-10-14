import { createRouter } from '@cascivo/app'
import { notFound, routes } from './routes.gen'

// `routes.gen.ts` is written by `cascivoRoutes()` (vite.config.ts) from `src/routes/`:
// add, rename or delete a file there and the route table follows.
export const router = createRouter({ routes, notFound })
