import { createAuth } from '@cascivo/app/auth'

/**
 * Who is signed in, shared by every page: `auth.user.value` is `undefined` while the first
 * check runs, then the user or `null`. The Worker side is `handleAuth` in worker/index.ts.
 */
export const auth = createAuth()
