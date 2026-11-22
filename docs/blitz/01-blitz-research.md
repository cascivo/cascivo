# Blitz research — making cascivo the best UI library for Blitz

Date: 2026-11-22. Sources: `DioxusLabs/blitz` @ `6636442`-era main (shallow clone `/tmp/opencode/blitz`, workspace `0.3.0-beta.4`), docs.rs `dioxus-native 0.7.10`, blitz.is status pages, crates.io API, and **an empirical probe** (`/tmp/opencode/probe`, headless `blitz-dom` + `blitz-html`, reads `resolved_style_value`). Probe results are marked **[probed]**.

## 1. Blitz architecture

### Crates (`Cargo.toml` workspace members)

| Crate | Role | Key public API |
|---|---|---|
| `blitz-traits` | Shared types, no deps on siblings | `events::{UiEvent, DomEvent, DomEventData, DomEventKind, EventState, BlitzPointerEvent, BlitzKeyEvent}`, `shell::{ShellProvider, Viewport, ColorScheme}`, `net::NetProvider`, `navigation`, `NodeId` |
| `blitz-dom` | DOM + Stylo style + Taffy layout + Parley text + events | `BaseDocument`, `Document` trait, `DocumentMutator`, `EventDriver`/`EventHandler`, `Widget` (custom-widget), `DocumentConfig`, `UserAgentStylesheet` |
| `blitz-html` | html5ever → blitz-dom | `HtmlDocument::from_html(&str, DocumentConfig)`, `from_xml`, `DocumentHtmlParser`, `HtmlProvider` |
| `blitz-paint` | DOM → anyrender draw cmds | `paint_scene` (features `scrollbars`) |
| `blitz-shell` | winit loop, accesskit, muda, clipboard | `BlitzApplication`, `WindowConfig::new(Box<dyn Document>, renderer)`, `BlitzShellProxy`, `BlitzShellEvent`, `View`, `create_default_event_loop`, `Config{stylesheets, base_url}` |
| `blitz-net` | reqwest/file/data-URI fetch | `Provider` |
| `blitz` | High-level wrapper | `launch_static_html(&str)`, `launch_static_html_cfg(&str, Config)`, `launch_url` (`packages/blitz/src/lib.rs`); re-exports `dom/html/shell/paint/net/traits` |
| `dioxus-native`, `dioxus-native-dom` | Dioxus renderer | see §3 |
| `blitz-vibey-script` | **Boa JS runtime** (`ScriptDocument`), runs `<script>`, runs Preact | `ScriptDocument::from_html`, `execute_scripts` — not published as stable |
| `blitz-vibey-cdp-server`, `blitz-test-harness`, `stylo_taffy`, `accesskit_xplat`, `parley_code_editor` | devtools, headless tests, glue | `Harness::{from_html, dispatch, pump, tick}` |
| external | `anyrender` 0.15 (+ `anyrender_vello` 0.16, `anyrender_vello_cpu` 0.19, Skia backend), `stylo` 0.24, `taffy` (git rev; 0.15.1 on crates.io), `parley` 0.13, `winit` 0.30 | |

### Versions (crates.io, queried 2026-11-22)

| Crate | Latest stable | Latest (pre) |
|---|---|---|
| blitz | 0.2.1 | 0.3.0-beta.4 |
| blitz-dom | 0.2.4 | 0.3.0-beta.4 |
| blitz-html | 0.2.0 | 0.3.0-beta.4 |
| blitz-shell | 0.2.3 | 0.3.0-beta.4 |
| blitz-paint | 0.2.1 | 0.3.0-beta.4 |
| blitz-traits | 0.2.0 | 0.3.0-beta.4 |
| blitz-net | 0.2.1 | 0.3.0-beta.4 |
| dioxus-native | 0.7.10 | 0.8.0-alpha.3 |
| stylo | 0.24.0 | — |
| anyrender / _vello / _vello_cpu | 0.15 / 0.16 / 0.19 | — |
| taffy / parley | 0.15.1 / 0.13.0 | — |

Beta (0.3) MSRV 1.91, edition 2024. API differs between 0.2 and 0.3 (e.g. `Document::poll`, `DocumentMutator`, `custom-widget`). **Decision needed: target 0.3.0-beta.4 (richer API, matches git main) vs 0.2.x (stable).** Probe built on 0.3.0-beta.4 in 75 s release.

### Minimal "HTML string + CSS in a window"

```rust
// A: one-liner (blitz 0.2/0.3) — no interactivity beyond built-in (links, forms, details, scroll, text input)
blitz::launch_static_html_cfg(&html, blitz::shell::Config { stylesheets: vec![extra_css], base_url: None });

// B: explicit (examples/inner_html.rs) — gives access to the document before the window starts
let mut doc = HtmlDocument::from_html(html, DocumentConfig { ua_stylesheets: vec![UserAgentStylesheet::parse(css)], ..Default::default() });
let id = doc.query_selector("#content_area")?.unwrap();
doc.mutate().set_inner_html(id, "<b>hi</b>");
let ev = create_default_event_loop();
let (proxy, rx) = BlitzShellProxy::new(ev.create_proxy());
let mut app = BlitzApplication::new(proxy, rx);
app.add_window(WindowConfig::new(Box::new(doc), VelloWindowRenderer::new()));
ev.run_app(app)?;
```

### How a non-Dioxus renderer drives the DOM

- `blitz_dom::Document` trait (`document.rs:132`): `inner()`, `inner_mut()`, `handle_ui_event(UiEvent)`, `poll(Option<TaskContext>) -> bool`, `id()`. **Implement it on your own struct** wrapping a `BaseDocument` → `WindowConfig::new(Box::new(my_doc), renderer)`. `HtmlDocument` and `PlainDocument` are the reference impls; `DioxusDocument` is the real-world example.
- Mutations: `BaseDocument::mutate() -> DocumentMutator` (`mutator.rs`): `create_element(QualName, attrs)`, `create_text_node`, `set_attribute`, `clear_attribute`, `set_node_text`, `append_children`, `insert_nodes_before/after`, `replace_node_with`, `remove_node`, `remove_and_drop_node`, `set_inner_html`, `set_style_property` / `remove_style_property`, `set_sub_document`, `set_custom_widget`, `deep_clone_node`. Dropping the mutator flushes (stylesheets, forms, focus) and calls `shell_provider.request_redraw()`.
- Queries: `get_element_by_id`, `query_selector`, `query_selector_all`-style, `get_client_bounding_rect(node)`, `hit(x,y)`, `element_from_point`, `resolved_style_value(node, "prop")` (getComputedStyle), `find_element_by_tag_name`.
- Layout/style: `doc.resolve(time)` (style + layout), `set_viewport`, `set_media_type`, `viewport_mut().set_color_scheme`.
- Events: `EventDriver::new(&mut dyn Document, impl EventHandler)`; `EventHandler::handle_event(chain: &[NodeId], event: &mut DomEvent, doc, &mut EventState)` receives each DOM event with the bubbling chain (target→root) — this is the hook. `DomEventKind`/`DomEventData`: pointer*/mouse*/touch*/click/dblclick/contextmenu/wheel/scroll/keydown/keyup/keypress/input/ime/focus/blur/focusin/focusout. Default `Document::handle_ui_event` uses `NoopEventHandler` (built-in behaviors still run: focus, checkbox toggle, `<details>`, link nav, text input editing). Queue API: `queue_event`, `pop_pending_event`, `flush_pending_events`.
- Shell abstraction: `ShellProvider` (redraw, cursor, title, IME, clipboard, file dialog, window drag/close/maximize for frameless custom titlebars). Custom external wake-ups: `BlitzShellEvent::Embedder(Arc<dyn Any>)` via `BlitzShellProxy::send_event`.
- Widget escape hatch: `blitz_dom::Widget` trait (`custom_widget.rs:75`: `connected`, `attribute_changed`, `handle_event(&UiEvent)`, `intrinsic_sizes`, `paint(...) -> anyrender::Scene`, `requires_redraw`). Attach via `mutate().set_custom_widget(node, Box<dyn Widget>)` → vector-painted custom controls (charts!) inside the DOM. Sub-documents (`set_sub_document`) embed another `Document` in a node.
- Scripting: `blitz-vibey-script` (Boa) exists in-repo (not on stable crates.io, per `Cargo.toml` listing) — would allow running cascivo's existing tiny JS snippets (`cascivo_html::render::script`) unchanged. Status page still says `<script>` unsupported for the stock `blitz` crate.

## 2. CSS support matrix (cascivo-relevant)

Evidence legend: **[probed]** = my headless probe (resolved computed values); **[status]** = blitz.is/status/css|elements|events; **[src]** = Blitz source; **[wpt]** = blitz.is/status/wpt (css total 54.2 % interop; css-flexbox 88 %, css-align 86 %, css-variables 91 %, css-color 85.5 %, css-logical 89 %, css-nesting 79 %, css-cascade 57 %, css-contain 53 %, css-conditional 44 %, mediaqueries 51 %, css-mixins 9 %).

| Feature | Status | Evidence / notes |
|---|---|---|
| `@layer` (statement + block, ordering, unlayered > layered) | **Supported** | [probed] `@layer a,b` → later layer wins; unlayered beats layered. Stylo-native. |
| `@container` / `container-type` / `container-name` | **Missing** (parses, never matches) | [probed] `cq.width` stayed `1px` even with pref on. `stylo/dom.rs:718` `query_container_size` → `// FIXME: Implement container queries… Default::default()`. `container-type` ❌ in [status]. Stylo pref `layout.css.container-queries.enabled=false` by default (`stylo_static_prefs-0.24.0/preferences.toml:18`). Needs blitz-dom patch (upstream PR) or CSS fallback. |
| `:has()` | **Supported only if pref enabled** | [probed] default **off** → `:has()` rules silently ignored (`color` stayed base; `:not(:has())` also failed). Stylo default `layout.css.has-selector.enabled=false` and Blitz `blitz-dom/src/stylo/prefs.rs` does NOT enable it. Setting `style_config::set_pref!("layout.css.has-selector.enabled", true)` from outside **before first resolve** → `:has(> .kid)`, `:has(+ .sib)`, `:not(:has())` all correct. **Cheap win**: cascivo-blitz crate can flip it (depend on `stylo_static_prefs = "0.24"` matching Blitz's stylo version). |
| `@scope` | Supported with pref | [probed] works after `layout.css.at-scope.enabled=true`; off by default. |
| CSS nesting | Supported | [probed] `#nest { .inner {…} }` applied; [wpt] 79 %. |
| `var()` / custom properties | **Supported** | [probed] `width: var(--x)`, `calc(var(--x)*2+4px)=44px`; [wpt] css-variables 91 %. |
| `@property` registered props | Supported | [probed] `initial-value: 5px` → `5px`. |
| `@function` / css-mixins | Missing | [wpt] css-mixins 9 % (1/66 tests). cascivo tokens' `@function` helpers (`cascivo.tokens` layer) must be pre-expanded. |
| `calc()` | Supported | [probed]. Taffy built with `calc`. |
| `clamp()/min()/max()` | Supported | [probed] `clamp(10px,50%,80px)` → `80px`. |
| Logical properties (`margin-inline`, `padding-block-start`, `inline-size`, `inset-*`) | Supported (flow-relative) | [probed] `margin-inline:7px`→`margin-left 7px`, `padding-block-start`, `inline-size:33px`; [status] "flow relative versions … supported"; [wpt] css-logical 89 %. `writing-mode` only partial (feature flag `writing-mode`). RTL: `direction` partial (block-level only). |
| `oklch()` / `color()` | **Supported** | [probed] computed `oklch(0.7 0.1 140)`; paint converts via `color` crate. [wpt] css-color 85.5 %. |
| `color-mix()` | Supported | [probed] `in oklch`, `in srgb` give correct mix. |
| Relative colour syntax `rgb(from …)` | Supported | [probed] `rgb(from red r g 200)` → `color(srgb 1 0 0.78)`. |
| `light-dark()` | Supported | [probed] flips with `ColorScheme`; `document.rs:2299` comment mentions it. |
| `@media (prefers-color-scheme)` | **Supported** | [probed] light→base, dark→99px. Fed from `Viewport.color_scheme` / winit theme (`stylo/device.rs:89`). `color-scheme` *property* ❌ [status]. |
| `@media (min-width…)` / viewport | Supported | `Device` from `Viewport`; [wpt] mediaqueries 51 % (subtests low — edge cases). |
| Grid (`repeat(auto-fill, minmax())`, `fr`, areas, gap) | **Supported** | [probed] `auto-fill minmax(100px,1fr)` 330 px w/ gap 10 → `103.333px` ×3 columns. No subgrid ([status], taffy#468). `grid-lanes` ❌. |
| Flexbox + gap | Supported | [status]; [wpt] flexbox 88 %. |
| `aspect-ratio` | Supported | [probed] 100 px, `2/1` → 50 px. |
| `position: sticky` | **In progress** | [status] blitz#887. `fixed/absolute/relative` ok. |
| `overflow: scroll/hidden/clip` | Supported; **`overflow:auto` ❌** | [status] "overflow:auto ❌ Not supported" (treat as scroll? verify). `scrollbar-width/color` ✓, `scrollbar-gutter` ❌, scroll-snap ❌, overscroll-behavior ❌ (pref on, not implemented). |
| `:focus` | Supported | [probed] `:focus` bg applied. |
| **`:focus-visible`** | **Never matches** | `stylo/dom.rs:291` `NonTSPseudoClass::FocusVisible => false`; [probed] input+button focused, rule not applied. Cascivo's `:focus-visible` rings are invisible → need `:focus` fallback / `:focus-within`. `FOCUSRING` state *is* set on `Node::focus()` (`node.rs:782`), so patching match is a 1-line upstream fix. |
| `:focus-within`, `:hover`, `:active`, `:checked`, `:disabled`, `:enabled`, `:link`, `[open]` | Supported | `dom.rs:274-320`. |
| `:indeterminate`, `:placeholder-shown`, `:read-only/-write`, `:valid/:invalid`, `:target`, `:default`, `:required/:optional`, `:state()` | **false** (`:state()` custom state: `each_custom_state` is `todo!()` → potential panic) | `dom.rs:274-330`. Use `[data-*]`/`[aria-*]` attribute selectors instead (attribute matching works). |
| Transitions / animations / `@keyframes` | Supported | [status] 80 % / 69 %; `Document::is_animating`, `animation_timer` in View; [wpt] transitions 41 %, animations 54 %. `@starting-style` unverified. |
| `@font-face` | Supported (woff/woff2 via `wuff`, feature `woff`) | [status] "family name can't be overridden"; `font-display` ❌; system-fonts feature (`parley/system`). cascivo `fonts/` can be bundled via data-URI/`file://`. Variable fonts ✓ (`font-variation-settings`). |
| Inline SVG | **Renders, styling not** | [status] SVG "Partial": static render via `usvg`; **`fill`, `stroke*`, `stroke-dasharray` CSS ❌**. `currentColor`/CSS-driven chart colors won't work → cascivo chart emitter must inline presentation attributes (`fill="…"`) not CSS. |
| `filter` | Partial (blur/drop-shadow on Vello Hybrid; full on Skia) | [status] |
| `backdrop-filter` | Partial (Skia only) | [status] |
| `box-shadow`, `outline`, gradients, `clip-path`, masks, 2D `transform/translate/scale/rotate`, `opacity` | Supported | [status] |
| 3D transforms, `will-change`, `appearance`, `accent-color`, `resize`, `line-clamp`, `text-overflow` (in progress #893), `content-visibility`, multicol (partial), anchor positioning, `counter()`, `hyphens` | Missing | [status] |
| `<dialog>`, `<select>`, `<progress>`, `<meter>`, `<input type=password>`, `<picture>`, `srcset`, `<caption>/<col>/<tfoot>` | **Missing** | [status/elements]. `<details>/<summary>` ✓, checkbox/radio/textarea/button/text input ✓, `<canvas>`, `<iframe>`. cascivo needs its own div-based select/dialog/progress. |
| Events | Mouse/pointer/touch/keyboard/focus/wheel/scroll/input/submit ✓; `change`, `beforeinput`, clipboard cut/copy/paste, drag&drop, composition, `ResizeObserver`/`MutationObserver`/`IntersectionObserver` ❌ | [status/events]. Single primary pointer only. |

### Takeaways on CSS
1. cascivo's core stack (`@layer`, custom properties, `calc/clamp`, logical props, `oklch/color-mix`, grid/flex/gap, `aspect-ratio`, `prefers-color-scheme`, nesting) **already works** on Blitz with zero changes.
2. Three gaps hit cascivo's CSS signature features: **`@container`** (missing in engine), **`:has()`** (pref off — trivially fixable by us), **`:focus-visible`** (hard-coded false).
3. SVG styling and `<select>/<dialog>` are the component-level gaps.

## 3. How Dioxus Native integrates

- `dioxus-native-dom::DioxusDocument { inner: Rc<RefCell<BaseDocument>>, vdom: VirtualDom, vdom_state }` implements `blitz_dom::Document` (`dioxus_document.rs`): `poll()` → `vdom.wait_for_work()` → render mutations into `BaseDocument`; `handle_ui_event()` wraps `EventDriver` with `DioxusEventHandler` that finds the `data-dioxus-id` attr on the target chain and calls `vdom.runtime().handle_event`.
- `mutation_writer.rs`: implements Dioxus `WriteMutations` over a `RealDom` trait → `DocumentMutator` (create_element, set_attribute, append_children, insert_before/after, replace, remove, add/remove_event_listener). Event converter implements `dioxus_html::HtmlEventConverter` (pointer, keyboard, focus, form, scroll, wheel, touch).
- `dioxus-native`: `launch`, `launch_cfg`, `launch_cfg_with_props`; `Config` (winit `WindowAttributes`, `FontContext`, `CompositeAlphaMode`, `base_color`, devtools shortcuts), `DioxusNativeApplication`, `DioxusNativeWindowRenderer`, `use_wgpu`/`CustomPaintSource` (wgpu textures), `CustomWidgetAttr`/`SubDocumentAttr`, hot-reload (manganis assets), `muda` menu, accesskit. Features: `accessibility, hot-reload, menu, tracing, prelude, vello|vello-gpu`.
- docs.rs (0.7.10): only **37.5 %** of the crate is documented; public items are launch fns, `Config`, `DioxusDocument`, GPU types.

### Weaknesses (cascivo's attack surface)
| Weakness | Evidence |
|---|---|
| **No component library** — raw `div/button/input` + hand-written CSS; ecosystem pieces (`dioxus-components`, etc.) target the *web* renderer and must match Dioxus 0.8-alpha | README "Using the git version": 3rd-party libs "need to be versions that work with Dioxus 0.8.0-alpha.3" |
| **No styling story**: no tokens/theme/dark-mode system, no sanctioned stylesheet strategy beyond `asset!(css)`; users hit the `:has/@container/:focus-visible` gaps on their own | no theming API in `Config`; stylo prefs hidden in `prefs.rs` |
| **Version coupling**: stable `dioxus-native 0.7.10` ↔ blitz 0.2.x; git main ↔ Dioxus 0.8 alpha (`286874c` split). Stable users are on an old CSS engine (no custom-widget etc.) | crates.io table above |
| **Heavy**: pulls the whole Dioxus core/signals/router/hooks tree; rsx macro compile times | `dioxus-native` Cargo deps |
| **Docs thin** (37.5 %), no a11y/keyboard conventions per control; `<select>/<dialog>` don't exist so no overlay primitives | status/elements |
| Interactivity requires VDOM diffing even for trivial toggles (accordion/tabs/dialog) that pure CSS/`details` could do | architecture |

## 4. Opportunities for a `cascivo-blitz` crate

Fit: cascivo-html already produces **one deterministic, self-contained HTML+CSS string** (`cascivo_html::render(src, &Options) -> Result<String, Vec<Diagnostic>>`, `render_fragment`, `render_parts` → `Fragment`, `stylesheet(theme, used)`, `script(name)`). That is *exactly* the input `HtmlDocument::from_html` takes. Components are CSS-first (`crates/cascivo-html/assets/css/*.css`, `@layer cascivo.*`), so Blitz renders them with the engine's strongest features.

### Proposed crate layout
```
cascivo-blitz
  ├─ cascivo_blitz::run(cv_src: &str, opts)          // .cv → HTML → Blitz window (thin wrapper over blitz-shell)
  ├─ cascivo_blitz::CascivoDocument (impl Document)  // wraps HtmlDocument/BaseDocument + reactive layer + EventHandler
  ├─ cascivo_blitz::prefs::enable()                  // set_pref! has-selector, at-scope (+ container-queries when engine supports)
  ├─ cascivo_blitz::compat                           // CSS lowering / runtime fallbacks (below)
  └─ cascivo_blitz::behaviors                        // Rust ports of cascivo's JS behaviors (tabs, accordion, dialog, select, tooltip, toast...)
```

| # | Opportunity | How (APIs) | Payoff |
|---|---|---|---|
| 1 | **`.cv`/HTML → native window in ~5 lines** | `cascivo_html::render` → `HtmlDocument::from_html` (set `UserAgentStylesheet`s for tokens/themes) → `WindowConfig::new(Box::new(doc), VelloWindowRenderer::new())`. Feature flags `vello` / `cpu-softbuffer` (headless CI) / `skia` (for `filter`/`backdrop-filter`). | `cargo install cascivo-html-cli`-style preview; "docs example = native app". Beats Dioxus: no rsx, no vdom, one string. |
| 2 | **Enable missing stylo prefs** | `style_config::set_pref!("layout.css.has-selector.enabled", true)` and `…at-scope.enabled` before first `BaseDocument::new` (probed working). | `:has()`-based cascivo styles (card, grid, data-table, dashboard-layout, link per grep) start working; one-line fix **no upstream change needed**. Must pin `stylo_static_prefs` to Blitz's stylo version (0.24). |
| 3 | **Container-query fallback** (`@container` isn't evaluated, `dom.rs:718`) | (a) *Compile-time lowering* in cascivo-html's CSS emission: each `@container (min-width: Xrem)` rule duplicated as `[data-cq~="w-X"] .sel {…}`; (b) *runtime*: after `doc.resolve()`, for every `[data-cq]` node read `get_client_bounding_rect`, `mutate().set_attribute(node, "data-cq", "w-30 w-40 …")`, re-resolve (loop until stable; layout→attr→layout is a standard ResizeObserver emulation). Hook on viewport resize in `Document::poll`. (c) *Upstream*: implement `query_container_size` in blitz-dom (needs layout-before-style; hard) — contribute and drop the shim. | cascivo's `@container` responsive cards/grids work natively — a **differentiator**: Dioxus Native users simply can't use container queries. |
| 4 | **`:focus-visible` fallback** | CSS lowering `x:focus-visible` → `x:focus` (keyboard-vs-pointer nuance lost) or runtime: set `data-focus-visible` attr in `EventHandler` on `keydown`-initiated focus; or upstream 1-line `FocusVisible => state.contains(FOCUSRING)` + set FOCUSRING only for keyboard (`document.rs:1847`). | WCAG 2.2 AA focus rings visible; a11y selling point. |
| 5 | **Dioxus-free reactive layer** | `CascivoDocument` implements `Document`; own `EventHandler` maps `DomEvent` → registered Rust closures by `data-cv-action="…"` attr (event delegation on `chain`); mutate via `DocumentMutator::set_attribute/set_node_text/set_inner_html`. Reactivity: tiny `Signal<T>` (or reuse `preact-signals`-style crate / `dioxus-signals` standalone / `futures-signals`) with effects that call `mutate()` on subscribed nodes (`data-cv-bind`). `poll()` drains signal-dirty set, returns `true` → shell redraws. Matches cascivo's "signals not useState" philosophy for *Rust* too. | No VirtualDom diff; O(changed-nodes) updates; ~zero extra deps. **Beats Dioxus** on weight and fits `.cv`-text authoring (declarative bindings in `.cv` → `data-*`). |
| 6 | **Interactive components without JS** | Port cascivo's small JS behaviors (`render::script(name)`) to Rust handlers on delegated events: tabs, accordion (`<details>` already native ✓), dialog/modal (own `div[role=dialog][data-open]` since `<dialog>` ❌ + `inert` supported: `ElementState::INERT`), select/combobox (div-based; `<select>` ❌), checkbox/radio/switch (native ✓ + `:checked`), tooltip/popover (abs-positioned; no anchor positioning), toast, form validation (`:invalid` false → attr-based), text input (native ✓, no `type=password`). Alternative: ship `blitz-vibey-script` (Boa) behind a feature to run the *existing* JS unchanged. | A complete component set where Dioxus gives primitives only. |
| 7 | **Custom widgets for chart/canvas** | `Widget::paint` returns an `anyrender::Scene` → paint `cascivo` charts as vector scenes (SVG `fill/stroke` CSS is ❌), animate via `requires_redraw`. Or inline presentation attributes (`fill="oklch(…)"`) in cascivo-html chart emitter (`emit/chart`) since `usvg` renders attributes. | Charts work today; widgets give GPU-fast, interactive (hover tooltips via `handle_event`). |
| 8 | **Theme/dark-mode runtime** | `[data-theme]` swaps + `prefers-color-scheme` already work. Expose `cascivo_blitz::set_theme(&mut doc, "dark")` → `mutate().set_attribute(html, data-theme)` and `viewport_mut().set_color_scheme`. Tokens as `UserAgentStylesheet` so authors' CSS can override cheaply (`add_user_agent_stylesheet`/`remove_user_agent_stylesheet`). `light-dark()` ✓, `color-mix` ✓, `oklch` ✓ → cascivo's colour system is *natively* representable (a place web-only libs using hex/hsl can't beat). | Hot theme switching with no relayout of Rust code. |
| 9 | **Compat linter** | Extend `cascivo-html check` with a `--target blitz` mode using the §2 matrix: warn on `:focus-visible` only, `@container` without fallback, SVG CSS fill/stroke, `<select>/<dialog>/<progress>`, `overflow:auto`, `position:sticky`, `@function`. Table is machine-readable (`registry.json` already carries per-component meta). | Agent-friendly (AI-first!): guarantee that generated `.cv` pages render correctly in Blitz. |
| 10 | **Headless snapshot/e2e testing** | `blitz-test-harness::Harness::from_html` + `dispatch(UiEvent)`; `examples/screenshot.rs` + `anyrender_vello_cpu` → PNG for visual regression of every cascivo component, no GPU. | CI-proof claim "pixel-tested on Blitz". |
| 11 | **Frameless window / chrome** | `ShellProvider::{drag_window, request_window_close, set_window_maximized}` → cascivo `app-shell`/`dashboard-layout` can draw its own titlebar. | Native-app feel from `.cv`. |
| 12 | **A11y** | `blitz-dom` `accessibility` feature (accesskit) derives roles from DOM; cascivo already emits ARIA → screen-reader support for free. Probe `tests/blitz-tests/tests/accessibility_*.rs`. | Beats Dioxus on a11y claim w/ evidence. |

### Risks / unknowns
- Blitz is **beta**; layout bugs likely (WPT css total 54 % interop). Pin versions (`=0.3.0-beta.4`) and test per bump. Taffy comes from a git rev in the workspace — check the published 0.3 beta crates actually depend on crates.io taffy.
- `set_pref!` is global/process-wide and relies on `stylo_static_prefs` being the same crate instance as Blitz's (cargo unifies by version; verified in probe).
- `NonTSPseudoClass::CustomState` + `each_custom_state` `todo!()` — avoid `:state()`.
- `overflow:auto` ❌ per status page (not probed here) — verify before relying on it; may behave like `visible`.
- Container-query shim triggers a second layout pass; bound iterations.
- Not probed: transitions on `@layer`ed rules, `position:sticky` partial behaviour, `<details>` styling, font loading from `fonts/`, actual painted output (only computed styles).
- Licensing: MIT/Apache (Blitz) – compatible with cascivo MIT.

### Suggested next steps
1. Spike `cascivo-blitz` `run()` (opp #1 + #2) against `crates/cascivo-html/examples/dashboard.html`; screenshot via `anyrender_vello_cpu`.
2. Run the §2 probe over cascivo's *real* component CSS (`assets/css/*.css`) to list which rules are dead on Blitz.
3. Prototype container-query runtime shim (#3) and open upstream issues/PRs for `:focus-visible` (1-line) and `query_container_size`.
4. Decide reactive layer (#5) vs Boa script reuse (#6).

### Reproducing the probe
`/tmp/opencode/probe` (Cargo workspace-less crate; path deps on `/tmp/opencode/blitz/packages/{blitz-dom,blitz-html,blitz-traits}`, `style_config = { version="0.24.0", package="stylo_static_prefs" }`). Run `./target/release/probe` (stock Blitz prefs) vs `./target/release/probe prefs` (has-selector + container-queries + at-scope enabled).
