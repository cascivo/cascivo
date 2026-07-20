// Machine-readable 404 for missing doc paths.
//
// Cloudflare Pages `_redirects` cannot set a 404 status — it supports only 200
// proxying and 3xx redirects ("rewrites (other status codes)" are unsupported) — so
// a guessed `/llms/*`, `/context/*`, or `/r/*` name would otherwise be served the
// built 404.html SPA shell, and an agent fetching it reads HTML where it expected
// markdown/JSON. This Function wraps the asset pipeline: real files and `_redirects`
// 301 aliases pass straight through (next() runs the header and redirect rules); only
// a genuine miss is rewritten to the static hint body, keeping the 404 status.

interface Context {
  request: Request
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>
}

/** Serve the requested doc, or the `hintAsset` body with a 404 status when it is missing. */
export function docOr404(hintAsset: string, contentType: string) {
  return async (context: Context): Promise<Response> => {
    const res = await context.next()
    if (res.status !== 404) return res
    const hint = await context.next(new URL(hintAsset, context.request.url).toString())
    if (!hint.ok) return res
    return new Response(hint.body, {
      status: 404,
      headers: {
        'content-type': contentType,
        'access-control-allow-origin': '*',
        'x-robots-tag': 'noindex',
      },
    })
  }
}
