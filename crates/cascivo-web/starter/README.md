# __NAME__

A [cascivo-web](https://github.com/cascivo/cascivo) static site.

```sh
cascivo-web build            # render to dist/
cascivo-web dev              # serve with live reload on http://127.0.0.1:4321
cascivo-web deploy --dry-run # build, then print the wrangler command
cascivo-web deploy           # build and deploy to Cloudflare Workers Static Assets
```

Content lives in `content/`, routes in `pages/`, templates in `layouts/`, static files in `public/`.
