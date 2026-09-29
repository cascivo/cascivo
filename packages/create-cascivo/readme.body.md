Scaffold a new [cascivo](https://cascivo.com) app:

```sh
npm create cascivo@latest my-app
# or: pnpm create cascivo my-app · yarn create cascivo my-app · bun create cascivo my-app
```

The command runs `cascivo create`, so it accepts the same prompts and flags. It has no logic of its own.

## Pick a shape

| `--framework`          | What you get                                                                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `react-vite` (default) | A client-rendered React app built with Vite. It includes the cascivo app shell and side navigation.                                                                                                                                              |
| `astro`                | An Astro site. Pages are real routes and ship no JS. Only the shell hydrates.                                                                                                                                                                    |
| `cloudflare`           | A client-rendered app and its API, deployed as **one Cloudflare Worker**. It includes a live server-sent events demo (`@cascivo/data`) and persisted state (`@cascivo/storage`). It runs on Preact by default; pass `--runtime react` for React. |

```sh
npm create cascivo@latest my-app -- --framework cloudflare
cd my-app && npm install && npm run dev   # the Worker runs in workerd, locally
npx wrangler login && npm run deploy      # live on your Cloudflare account
```

Other flags: `--theme <name>`, `--sections "Overview,Reports"`, `--pm pnpm|npm|yarn|bun`, `--yes`.

npm needs the `--` before the flags. It passes everything after `--` on to the scaffolder.
