Platform-idiomatic **geometry, motion and interaction affordance** for cascivo, selected with a single `data-platform` attribute — the axis that lets the same components present as iOS, as Material, or as the web look cascivo has always had.

> **Status: the axis, not the skins.** Today `web` is the only platform, and its values are identical to the `@cascivo/tokens` defaults, so installing this package changes nothing. That is deliberate: the mechanism lands and is proven inert before any platform-specific values exist. See `docs/internal/ROADMAP-V59.md`.

## The rule that makes this work

```
data-platform  →  geometry, motion, interaction affordance
data-theme     →  colour
```

**Neither axis writes the other's properties.** That is not a convention, it is enforced — `src/parity.test.ts` fails the build if a platform stylesheet sets any `--cascivo-color-*` property.

The payoff is that the axes compose _additively_. Twelve themes plus N platforms, not twelve times N. "Corporate colours, iOS geometry" is one attribute pair, not a hand-maintained combination:

```html
<html data-theme="corporate" data-platform="web"></html>
```

Absent `data-platform` means `web`, so existing apps are unaffected until they opt in.

## Import

```ts
import '@cascivo/platform/all.css' // tokens (once) + every platform
```

Or exactly one platform, self-contained:

```ts
import '@cascivo/platform/web.css'
```

Pair it with a theme — this package deliberately ships no colour:

```ts
import '@cascivo/themes/all.css'
import '@cascivo/platform/all.css'
```

## Scoping

Like `data-theme`, the attribute works on **any** element, not just `<html>`. A single embedded surface can present differently from the page around it:

```html
<body data-platform="web">
  <div data-platform="ios">…this subtree only…</div>
</body>
```

## The contract

Every platform declares exactly these tokens, and the parity test fails if one is missing — a component reading a knob a platform forgot would silently fall back to the tokens tier and look wrong on that platform alone.

| Token                                  | Owns                                                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--cascivo-radius-base`                | The geometry root. `radius-control`/`-field`/`-item`/`-surface`/`-overlay`/`-indicator` all derive from it, so one value re-tunes the whole family. |
| `--cascivo-control-height-sm/md/lg`    | Control density                                                                                                                                     |
| `--cascivo-motion-enter/exit/emphasis` | Duration + easing. A platform may substitute springs — this is where Material 3 Expressive's motion model would land.                               |
| `--cascivo-target-min-coarse`          | Minimum comfortable touch target under a coarse pointer                                                                                             |
| `--cascivo-list-separator-inset`       | How far a list separator is inset from the row's leading edge (0 on web and Material; iOS insets to the label)                                      |

## Cascade position

`cascivo.platform` sits **above** `cascivo.component` and **below** `cascivo.theme`:

```css
@layer cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.platform,
  cascivo.theme, cascivo.blocks, cascivo.override;
```

Above component, so a platform can re-tune the geometry a component chose. Below theme, so a platform can never win a colour decision — which is safe precisely because it is forbidden from making one.
