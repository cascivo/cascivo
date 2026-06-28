A copy-paste starting point for publishing a **template** to the cascivo marketplace.

A template bundles a working page with the components it composes. This starter ships one template, `hero-landing`,
that composes the first-party `button` and `card` components and adds its own page + fixtures.

## Layout

```
template-starter/
├── cascivo-registry.json          # the registry index (one template item)
├── public/r/                      # built static artifacts (after `build`)
└── src/hero-landing/
    ├── hero-landing.tsx           # the page → src/pages/hero-landing.tsx
    ├── hero-landing.module.css    # styles → src/pages/hero-landing.module.css
    ├── fixtures.ts                # mock copy → src/fixtures/hero-landing.ts
    └── hero-landing.template.ts   # the TemplateMeta manifest
```

## Build

```sh
pnpm build   # cascivo registry build --in cascivo-registry.json --out public/r
```

## Use

```sh
cascivo add your-org/template-starter/hero-landing
# or into a fresh app:
cascivo create my-app --template your-org/template-starter/hero-landing
```

See [Contributing a Template](../../../docs/CONTRIBUTING-TEMPLATES.md) for the full author → build → host → submit loop.
</content>
