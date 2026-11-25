import { Container, getContainer } from '@cloudflare/containers'

interface Env {
  APP: DurableObjectNamespace<App>
  /** `wrangler secret put APP_SECRET`: signs sessions and island props. */
  APP_SECRET: string
}

export class App extends Container<Env> {
  // Must match `ADDR` in the Dockerfile.
  defaultPort = 8080
  // Stop the (billed) container after 5 idle minutes; the next request starts it again.
  sleepAfter = '5m'

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    // The release binary refuses to start without it.
    this.envVars = { APP_SECRET: env.APP_SECRET }
  }
}

export default {
  // One shared instance. Use `getContainer(env.APP, id)` to shard (per tenant, per user).
  fetch(request: Request, env: Env): Promise<Response> {
    return getContainer(env.APP).fetch(request)
  },
}
