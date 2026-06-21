Remotion video studio for cascivo — animated explainers and launch films for the design system. Private workspace package; not published to npm.

The flagship composition is **`Intro`**: a ~2½-minute launch film that pitches cascivo end to end — the problem it removes, modern CSS over Tailwind, signal-driven reactivity, 14 themes from one attribute, 165 components, three-level tokens, the AI-first context layer, accessibility, and a closing call to action. It uses the real brand palette (brand blue + AI purple) and the positioning from the project README.

## Develop

```sh
pnpm --filter @cascivo/video studio   # open Remotion Studio (live preview)
pnpm --filter @cascivo/video render   # render Intro → out/cascivo-intro.mp4
pnpm --filter @cascivo/video still    # render a poster frame → out/poster.png
```

`render` downloads a headless Chromium on first run.

## Structure

```
src/
├── index.ts          # registerRoot entry (Remotion picks this up)
├── Root.tsx          # composition registry
├── Intro.tsx         # the film: scenes wired with quick transitions
├── timeline.ts       # ordered scene list + durations — the single source of truth
├── timeline.test.ts  # pure-data checks (runtime stays in the 2–3 min brief)
├── constants.ts      # fps / dimensions
├── theme.ts          # brand-derived palette, fonts, gradients
├── anim.ts           # small reveal / spring helpers
├── components/       # reusable visual building blocks (Background, Mark, CodeWindow…)
└── scenes/           # one file per scene
```

To change pacing, edit `SCENES` in `timeline.ts`; the composition length, the progress bar, and the chapter labels all derive from it. `pnpm test` (and the monorepo gate) verify the total runtime stays within the brief.

## Adding a scene

1. Add an entry to `SCENES` in `timeline.ts` (id, label, seconds).
2. Create `scenes/<Name>.tsx`.
3. Register it in `SCENE_COMPONENTS` and add a transition presentation in `Intro.tsx`.
