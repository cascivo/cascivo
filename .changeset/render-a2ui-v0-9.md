---
'@cascivo/render': minor
---

Add `@cascivo/render/a2ui/v0_9`: an A2UI v0.9 renderer. `createA2uiStore` validates and holds
server messages as signals, `A2uiSurface` renders a surface with cascivo components, and two
catalogs ship with it (the cascivo catalog and A2UI's basic catalog). Limits, URL checks and a
safe `regex` function protect against hostile agents.

`./validate` changes too: a prop named `url` is now URL-checked at any depth (as `href` and `src`
already were), and `RadioCardGroup` props are now validated against the props it declares (an unknown prop is an
error) instead of accepting any prop.
