# Platform spike: publishing generated apps on Cloudflare

Date: 2026-09-30. Question: how should an app built with cascivo host many small apps that
an agent or an end user makes — a generated view published as a live page, with no deploy
step for each one?

Two Cloudflare mechanisms were candidates: Workers for Platforms (dispatch namespaces) and
Worker Loaders (dynamic Workers from code strings). This note records what was checked,
what was built, and what is left to prove on a real account.

## Answer: a view is data, so publishing one needs neither

A cascivo view (`ViewConfig`) is JSON that arranges the app's own components with props
their manifests allow. It carries no code. Publishing one is storing it and rendering it
with `<CascivoView>`, which validates it first. There is nothing to isolate, so neither
dispatch namespaces nor Worker Loaders are needed for it.

That is what shipped: `cascivo create --framework cloudflare --example publish` stores
pages in D1 and serves each at `/p/<slug>`. It runs locally and on a temporary account.

A sandbox matters only once tenants supply code: a handler, a data transform, a custom
component. That is the case the rest of this note covers, and it is not built yet.

## Found on the way: views could carry script-running links

`validateView` accepted any string for URL props. React 19 blocks `javascript:` links;
Preact writes them to the DOM as given (checked in jsdom). So on Preact, the default
runtime of the Cloudflare scaffold, a generated or published view could carry a link that
runs script on the app's origin when clicked. `validateView` now refuses URL props at any
depth (`Header.links[].href` too) whose scheme is not `http`, `https`, `mailto` or `tel`.
Since `<CascivoView>` validates before rendering, every render path is covered.

## Worker Loaders: probed locally

Probed in workerd through `@cloudflare/vite-plugin` 1.62 (miniflare 5.20260926, workerd
1.20260926), with a `worker_loaders` binding and code sent per request:

| Property                                          | Local result                                               |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `env` holds only what the host passes             | Yes                                                        |
| `globalOutbound: null` blocks `fetch()`           | Yes: "not permitted to access the internet"                |
| `eval` / `new Function` inside the sandbox        | Refused: "Code generation from strings disallowed"         |
| A syntax error or a throw in tenant code          | Reaches the host as a catchable error; the host stays up   |
| New code under an id that was already loaded      | **Still runs the old code**: the id must hash the code     |
| `limits.cpuMs`                                    | **Not enforced**: a 2-second busy loop finished under 50ms |
| Memory                                            | 300 MB allocated without complaint                         |
| An infinite loop                                  | **Hung the whole local runtime**; every request after it   |

What this means for a design:

- **The id is a cache key.** Use the code's hash (plus the tenant) as the id, or updates
  silently do not apply.
- **Default-deny outbound.** Pass `globalOutbound: null` and give the tenant only narrow
  bindings (an RPC entrypoint that exposes what it may do), never the host's `env`.
- **Local dev cannot test resource limits.** CPU and memory limits, and what production
  does with a runaway loop, can be proven only on a real account. Until they are, running
  untrusted code in local dev can hang it.

## Workers for Platforms: not testable here

Miniflare accepts a `dispatch_namespaces` binding only as a proxy to a real account, so
nothing about it can be verified locally, and dispatch namespaces are a paid feature. It
fits when each tenant is a full Worker deployed through the API, with its own
bindings and limits. That makes it heavier than a view needs, and a later step after Worker Loaders.

## Next steps, each needing a real account

1. Worker Loaders in production: confirm `limits.cpuMs` and `subRequests` are enforced,
   what a runaway loop costs the host request, and the memory ceiling.
2. Decide the tenant code model before an API: a `fetch` handler per page, or a narrow
   entrypoint (`load(params) → data` feeding the view's `$data`), which is smaller and
   keeps rendering in the host.
3. Only then consider `@cascivo/app` helpers (hashed ids, outbound denied by default,
   errors mapped to responses), with the probe above turned into tests against a real
   account.
