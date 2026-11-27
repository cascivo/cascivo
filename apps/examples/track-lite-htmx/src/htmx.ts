// htmx and its SSE extension: the one third-party engine, shipped as its own file so the page
// budget can count cascivo's JS without it (`scripts/checks/dynamic`).
import 'htmx.org'
import 'htmx-ext-sse'

// One id per tab: sent with every request, echoed in the SSE `changed` event, and used to drop
// our own events, so the tab that mutated doesn't refetch the list its response already carried.
const clientId = crypto.randomUUID()
document.addEventListener('htmx:configRequest', (e) => {
  ;(e as CustomEvent<{ headers: Record<string, string> }>).detail.headers['X-Client-Id'] = clientId
})
// Capture phase on document runs before htmx's listener on the target.
document.addEventListener(
  'sse:changed',
  (e) => {
    if ((e as CustomEvent<MessageEvent<string>>).detail.data === clientId) e.stopPropagation()
  },
  true,
)
