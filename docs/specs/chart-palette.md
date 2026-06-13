# Chart Categorical Palette: CVD-Safe Design Research

## Lineage

The `--cascade-chart-1..8` tokens are grounded in the **Okabe-Ito 8-color palette**, the de-facto standard for scientific figures requiring color vision deficiency (CVD) safety.

The palette was designed to be distinguishable under all three common forms of color blindness:

- **Protanopia** — reduced sensitivity to red (affects ~1% of males)
- **Deuteranopia** — reduced sensitivity to green (affects ~6% of males, most common form)
- **Tritanopia** — reduced sensitivity to blue (rare, ~0.01%)

### Cross-checks against other design systems

| System                      | Palette                                 | CVD claims                                               |
| --------------------------- | --------------------------------------- | -------------------------------------------------------- |
| **Okabe-Ito**               | 8 colors, tuned for all three CVD types | Published peer-reviewed basis                            |
| **Tableau 10**              | 10 colors, perceptually distinct        | Partially CVD-safe; some pairs fail under protanopia     |
| **ColorBrewer qualitative** | Multiple 8–12 color sets                | "Colorblind safe" flag available but not universal       |
| **IBM Carbon charts**       | 14-color categorical ramp               | CVD-tested via simulation; shares several Okabe-Ito hues |
| **shadcn `--chart-1..5`**   | 5 oklch values                          | No documented CVD basis; optimized for aesthetics        |

Okabe-Ito is the most rigorously validated choice and maps cleanly onto our 8-slot ramp.

---

## Mapping: Okabe-Ito → `--cascade-chart-1..8`

| Token               | Hue name       | sRGB hex                           | oklch value            |
| ------------------- | -------------- | ---------------------------------- | ---------------------- |
| `--cascade-chart-1` | orange         | `#E69F00`                          | `oklch(0.74 0.13 70)`  |
| `--cascade-chart-2` | sky blue       | `#56B4E9`                          | `oklch(0.74 0.11 240)` |
| `--cascade-chart-3` | bluish green   | `#009E73`                          | `oklch(0.66 0.13 165)` |
| `--cascade-chart-4` | yellow         | `#F0E442`                          | `oklch(0.93 0.16 100)` |
| `--cascade-chart-5` | blue           | `#0072B2`                          | `oklch(0.50 0.13 250)` |
| `--cascade-chart-6` | vermillion     | `#D55E00`                          | `oklch(0.60 0.16 40)`  |
| `--cascade-chart-7` | reddish purple | `#CC79A7`                          | `oklch(0.66 0.12 350)` |
| `--cascade-chart-8` | neutral grey   | _(black in print, grey on screen)_ | `oklch(0.55 0.02 280)` |

chart-8 is a screen adaptation: the original Okabe-Ito black (`#000000`) is too harsh for most UI backgrounds and renders identically to text. Lightened to `oklch(0.55 …)` it remains neutral and legible while fitting on coloured surfaces.

---

## Subset Guidance: ≤4 Categories

When rendering 4 or fewer data series, use the **high-pairwise-contrast subset** for maximum CVD robustness:

1. `--cascade-chart-1` (orange)
2. `--cascade-chart-2` (sky blue)
3. `--cascade-chart-5` (blue)
4. `--cascade-chart-6` (vermillion)

This subset maximises lightness and hue contrast simultaneously, making pairs distinguishable even under severe protanopia or deuteranopia.

---

## Redundant-Encoding Rule

Color must never be the sole carrier of data meaning. Every chart series must pair color with at least one redundant encoding:

- **Direct labels** — annotate series at their endpoint or within the data
- **Legends with shape markers** — circle, square, triangle, dash, dot
- **Fill patterns** — hatching or stippling for filled areas (bar, area charts)
- **ARIA / accessible text** — `aria-label` or `<title>` elements on SVG paths

This ensures the chart is fully readable without functional color vision.

---

## Per-Theme Tuning

The base palette (`--cascade-chart-1..8` in `@cascade-ui/tokens`) is used unmodified for:

- `light` (default)
- `corporate`
- `flat`
- `minimal`

Theme overrides adjust the palette while **preserving hue order** so series identity remains stable across theme switches:

| Theme                          | Adjustment                                                              |
| ------------------------------ | ----------------------------------------------------------------------- |
| `dark`, `midnight`, `terminal` | Raise lightness by ~0.06–0.10 so series remain visible on dark surfaces |
| `pastel`                       | Reduce chroma by ~0.04–0.06 for a softer look                           |
| `brutalist`                    | Increase chroma and reduce lightness for maximum contrast               |

Hue values (`H` in oklch) are not changed by theme overrides — only `L` (lightness) and `C` (chroma) shift.

---

## Citations

- Okabe M, Ito K. "Color Universal Design (CUD): How to make figures and presentations that are friendly to colorblind people." https://conceptviz.app/blog/okabe-ito-palette-hex-codes-complete-reference
- Mahy M, Van Eylen L, et al. "Accessible Color Sequences for Data Visualization." arXiv:2107.02270. https://arxiv.org/pdf/2107.02270
- "Colorblind-Safe Palettes: Okabe-Ito Reference." Scidraw. https://sci-draw.com/blog/colorblind-safe-palettes-okabe-ito-reference
- "Color in Data Visualization." DataStoryCoach. https://www.datastorycoach.ai/blog/data-visualization-chart-design/color-in-data-visualization
