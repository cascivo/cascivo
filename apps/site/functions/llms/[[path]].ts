import { docOr404 } from '../_lib/not-found'

// A missing /llms/<name>.md serves the machine-readable hint (llms-404.md) as a
// real 404 instead of the HTML SPA shell.
export const onRequest = docOr404('/llms-404.md', 'text/markdown; charset=utf-8')
