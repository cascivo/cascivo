Storybook for cascivo — **stories generated from the component manifests**, showing every variant, state, and size for all 165 components without a hand-written story file. Deployed to [storybook.cascivo.com](https://storybook.cascivo.com).

## Develop

```sh
pnpm exec vp run @cascivo/storybook#dev
```

Because stories are derived from each component's `component.meta.ts`, adding a variant or size to a component automatically surfaces it in Storybook — there is nothing to keep in sync by hand. Use it for visual review across all 14 themes; the docs site ([docs.cascivo.com](https://docs.cascivo.com)) covers prose, API tables, and accessibility.
