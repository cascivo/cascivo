# T5-4 Deferral: Badge/Alert if(style()) Pilot

**Status:** Deferred within v13  
**Decision date:** 2026-06-13  
**Tranche:** T5 (CSS-native progressive enhancement)

## What was planned

Pilot `if(style())` variant selection on Badge and Alert, replacing per-variant
`data-variant` attribute selector rules with a single `if(style())` branch:

```css
.badge {
  background: var(--cascivo-badge-bg); /* static fallback */
  background: if(
    /* progressive */ style(--variant: success): var(--cascivo-color-success-subtle) ;
      else: var(--cascivo-badge-bg)
  );
}
```

## Why this requires deferral

`if(style())` branches on CSS custom property values, not HTML attribute values.
`data-variant="success"` on the element does **not** automatically create a
`--variant` custom property — that is not how HTML attributes work.

To wire `--variant` as a custom property, one of these approaches is needed:

1. **TSX change:** `style={{ '--variant': variant }}` on the root element — sets
   the custom property inline alongside the `data-variant` attribute. This is a
   JSX/TSX source change in every affected component.

2. **CSS `attr()` with custom property type:** `--variant: attr(data-variant type(<custom-ident>))` —
   has limited cross-browser support and is not yet widely available.

Both options require touching component TSX sources (option 1) or relying on a
CSS feature with even narrower support than `if(style())` itself (option 2).
Neither qualifies as a one-line CSS-only change.

The task brief's decision rule is explicit: "If wiring `--variant` as a CSS
custom property requires changing the TSX source, record as deferred."

## What remains in place

The existing `data-variant` attribute selector rules in `badge.module.css` and
`alert.module.css` are correct, fully supported, and serve as the static
fallback layer. They stay unchanged.

## Path to implementing in a future tranche

When `if(style())` support matures and the project is ready to ship the TSX
wiring cost, the steps are:

1. Add `style={{ '--variant': variant } as React.CSSProperties}` to the root
   element of Badge and Alert (and any other variant-driven components).
2. Add the `if(style())` progressive layer above the existing attribute selector
   rules, with the existing rules as explicit fallbacks.
3. Run `css-fallback` audit and all component tests to verify.
4. The existing `data-variant` rules must remain — they are the fallback for
   Firefox/Safari.
