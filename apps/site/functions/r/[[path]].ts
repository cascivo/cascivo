import { docOr404 } from '../_lib/not-found'

// A missing /r/<name>.json serves the machine-readable hint (r-404.json) as a real
// 404 instead of the HTML SPA shell.
export const onRequest = docOr404('/r-404.json', 'application/json; charset=utf-8')
