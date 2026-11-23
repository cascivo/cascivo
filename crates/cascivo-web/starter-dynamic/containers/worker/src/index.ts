import { Container, getContainer } from "@cloudflare/containers";

export class App extends Container {
  // Must match `PORT` in the Dockerfile.
  defaultPort = 8080;
  // Stop the (billed) container after 5 idle minutes; the next request starts it again.
  sleepAfter = "5m";
}

interface Env {
  APP: DurableObjectNamespace<App>;
}

export default {
  // One shared instance. Use `getContainer(env.APP, id)` to shard (per tenant, per user).
  fetch(request: Request, env: Env): Promise<Response> {
    return getContainer(env.APP).fetch(request);
  },
};
