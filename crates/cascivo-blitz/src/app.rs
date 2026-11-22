//! [`App`]: a `.cv` document plus Rust event handlers, signal bindings and native behaviours.
//! [`InteractiveDocument`] is the Blitz [`Document`] it builds. It runs headless, so tests can
//! send synthetic events and read the DOM back.

use std::cell::{Cell, RefCell};
use std::ops::{Deref, DerefMut};
use std::rc::Rc;
use std::sync::Arc;

use blitz_dom::{
    BaseDocument, DocGuard, DocGuardMut, Document, DocumentConfig, EventDriver, EventHandler,
    LocalName, NodeId,
};
use blitz_html::{HtmlDocument, HtmlProvider};
use blitz_traits::events::{
    BlitzInputEvent, BlitzKeyEvent, DomEvent, DomEventData, DomEventKind, EventState, KeyState,
    UiEvent,
};
use blitz_traits::shell::Viewport;
use keyboard_types::{Code, Key, Location, Modifiers};

use crate::behaviors::{self, Behaviors};
use crate::dom::Dom;
use crate::reactive::{Effect, effect};
use crate::{Diagnostic, Error, Options, enable_prefs, html_from_cv};

/// A DOM event a handler can listen for.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Event {
    Click,
    DoubleClick,
    /// Text input or a checkbox or radio change.
    Input,
    KeyDown,
    KeyUp,
    Focus,
    Blur,
}

impl Event {
    fn kind(self) -> DomEventKind {
        match self {
            Event::Click => DomEventKind::Click,
            Event::DoubleClick => DomEventKind::DoubleClick,
            Event::Input => DomEventKind::Input,
            Event::KeyDown => DomEventKind::KeyDown,
            Event::KeyUp => DomEventKind::KeyUp,
            Event::Focus => DomEventKind::Focus,
            Event::Blur => DomEventKind::Blur,
        }
    }
}

/// What a handler sees: the event, and the document to change.
pub struct Ctx<'a> {
    dom: Dom<'a>,
    target: NodeId,
    current: NodeId,
    event: &'a DomEvent,
    state: &'a mut EventState,
}

impl<'a> Ctx<'a> {
    /// The node the event started on.
    pub fn target(&self) -> NodeId {
        self.target
    }

    /// The node whose selector matched.
    pub fn current(&self) -> NodeId {
        self.current
    }

    /// The pressed key, for key events.
    pub fn key(&self) -> Option<&Key> {
        match &self.event.data {
            DomEventData::KeyDown(k) | DomEventData::KeyUp(k) => Some(&k.key),
            _ => None,
        }
    }

    /// The new value, for [`Event::Input`]. A checkbox gives `"true"` or `"false"`.
    pub fn input_value(&self) -> Option<&str> {
        match &self.event.data {
            DomEventData::Input(i) => Some(&i.value),
            _ => None,
        }
    }

    /// Skip Blitz's default action for this event.
    pub fn prevent_default(&mut self) {
        self.state.prevent_default();
    }

    /// Do not call handlers on ancestors.
    pub fn stop_propagation(&mut self) {
        self.state.stop_propagation();
    }

    /// Node-level access to the document.
    pub fn dom(&mut self) -> &mut Dom<'a> {
        &mut self.dom
    }

    /// Replace the text of every node matching `selector`.
    pub fn set_text(&mut self, selector: &str, text: &str) {
        for n in self.dom.query_all(selector) {
            self.dom.set_text(n, text);
        }
    }

    /// Text of the first node matching `selector`.
    pub fn text(&self, selector: &str) -> Option<String> {
        self.dom.query(selector).map(|n| self.dom.text(n))
    }

    pub fn set_attr(&mut self, selector: &str, name: &str, value: &str) {
        for n in self.dom.query_all(selector) {
            self.dom.set_attr(n, name, value);
        }
    }

    pub fn remove_attr(&mut self, selector: &str, name: &str) {
        for n in self.dom.query_all(selector) {
            self.dom.remove_attr(n, name);
        }
    }

    pub fn attr(&self, selector: &str, name: &str) -> Option<String> {
        self.dom
            .query(selector)
            .and_then(|n| self.dom.attr(n, name))
    }

    pub fn set_class(&mut self, selector: &str, class: &str, on: bool) {
        for n in self.dom.query_all(selector) {
            self.dom.set_class(n, class, on);
        }
    }

    /// Flip `class` on every match. Returns the state of the first match.
    pub fn toggle_class(&mut self, selector: &str, class: &str) -> bool {
        let mut first = None;
        for n in self.dom.query_all(selector) {
            let on = self.dom.toggle_class(n, class);
            first.get_or_insert(on);
        }
        first.unwrap_or(false)
    }

    /// The chosen value of the `<select>` matching `selector`.
    pub fn select_value(&self, selector: &str) -> Option<String> {
        behaviors::select_value(&self.dom, self.dom.query(selector)?)
    }

    pub fn open_dialog(&mut self, selector: &str) {
        if let Some(n) = self.dom.query(selector) {
            behaviors::open_dialog(&mut self.dom, n);
        }
    }

    pub fn close_dialog(&mut self, selector: &str) {
        if let Some(n) = self.dom.query(selector) {
            behaviors::close_dialog(&mut self.dom, n);
        }
    }
}

type Callback = Box<dyn FnMut(&mut Ctx)>;

struct Handler {
    selector: String,
    event: Event,
    f: Callback,
}

enum Patch {
    Text(String, String),
    Attr(String, String, Option<String>),
    Class(String, String, bool),
}

type Queue = Rc<RefCell<Vec<Patch>>>;

fn apply(dom: &mut Dom, patch: Patch) {
    match patch {
        Patch::Text(sel, text) => dom
            .query_all(&sel)
            .into_iter()
            .for_each(|n| dom.set_text(n, &text)),
        Patch::Attr(sel, name, Some(v)) => dom
            .query_all(&sel)
            .into_iter()
            .for_each(|n| dom.set_attr(n, &name, &v)),
        Patch::Attr(sel, name, None) => dom
            .query_all(&sel)
            .into_iter()
            .for_each(|n| dom.remove_attr(n, &name)),
        Patch::Class(sel, class, on) => dom
            .query_all(&sel)
            .into_iter()
            .for_each(|n| dom.set_class(n, &class, on)),
    }
}

enum Binding {
    Text(String, Box<dyn Fn() -> String>),
    Attr(String, String, Box<dyn Fn() -> Option<String>>),
    Class(String, String, Box<dyn Fn() -> bool>),
}

enum Source {
    Cv(String),
    Html(String),
}

/// Builds an interactive document. Handlers match by CSS selector, so `#id`, `.class`,
/// `[data-action=save]` and `button` all work.
///
/// ```
/// # fn main() -> Result<(), cascivo_blitz::Error> {
/// use cascivo_blitz::{App, Event, Options, Signal};
///
/// let count = Signal::new(0);
/// let c = count.clone();
/// let mut doc = App::from_cv("text \"0\"\nbutton \"+\" primary\n", Options::default())
///     .on("button", Event::Click, move |_| c.update(|n| *n += 1))
///     .bind_text("p", move || count.get().to_string())
///     .build()?;
/// doc.click("button");
/// assert_eq!(doc.text("p").as_deref(), Some("1"));
/// # Ok(()) }
/// ```
pub struct App {
    source: Source,
    opts: Options,
    behaviors: Behaviors,
    handlers: Vec<Handler>,
    bindings: Vec<Binding>,
}

impl App {
    /// Start from `.cv` text.
    pub fn from_cv(src: &str, opts: Options) -> Self {
        Self::new(Source::Cv(src.to_owned()), opts)
    }

    /// Start from HTML. Use this for markup you wrote yourself. The cascivo theme is not added.
    pub fn from_html(html: &str, opts: Options) -> Self {
        Self::new(Source::Html(html.to_owned()), opts)
    }

    fn new(source: Source, opts: Options) -> Self {
        Self {
            source,
            opts,
            behaviors: Behaviors::all(),
            handlers: Vec::new(),
            bindings: Vec::new(),
        }
    }

    /// Run `f` when `event` reaches a node matching `selector` (on the node or a descendant).
    pub fn on(mut self, selector: &str, event: Event, f: impl FnMut(&mut Ctx) + 'static) -> Self {
        self.handlers.push(Handler {
            selector: selector.to_owned(),
            event,
            f: Box::new(f),
        });
        self
    }

    /// Keep the text of every node matching `selector` equal to `f()`. `f` may read signals.
    pub fn bind_text(mut self, selector: &str, f: impl Fn() -> String + 'static) -> Self {
        self.bindings
            .push(Binding::Text(selector.to_owned(), Box::new(f)));
        self
    }

    /// Keep an attribute equal to `f()`. `None` removes it.
    pub fn bind_attr(
        mut self,
        selector: &str,
        name: &str,
        f: impl Fn() -> Option<String> + 'static,
    ) -> Self {
        self.bindings.push(Binding::Attr(
            selector.to_owned(),
            name.to_owned(),
            Box::new(f),
        ));
        self
    }

    /// Keep a class on or off to follow `f()`.
    pub fn bind_class(
        mut self,
        selector: &str,
        class: &str,
        f: impl Fn() -> bool + 'static,
    ) -> Self {
        self.bindings.push(Binding::Class(
            selector.to_owned(),
            class.to_owned(),
            Box::new(f),
        ));
        self
    }

    /// Choose which native behaviours run. Default: all.
    pub fn behaviors(mut self, b: Behaviors) -> Self {
        self.behaviors = b;
        self
    }

    /// Build the document without opening a window.
    pub fn build(self) -> Result<InteractiveDocument, Error> {
        enable_prefs();
        let (html, warnings) = match &self.source {
            Source::Cv(src) => {
                let mut warnings = if self.opts.lint {
                    crate::lint_cv(src, &self.opts)?
                } else {
                    Vec::new()
                };
                // Handled here: the `:has()` pref is set above, and sorting is native.
                warnings.retain(|w| {
                    !w.msg.contains("layout.css.has-selector")
                        && !(self.behaviors.table_sort && w.msg.contains("sorting is client JS"))
                });
                (html_from_cv(src, &self.opts)?, warnings)
            }
            Source::Html(h) => (h.clone(), Vec::new()),
        };
        let viewport = Viewport {
            color_scheme: self.opts.color_scheme,
            ..self.opts.viewport.clone()
        };
        let mut inner = HtmlDocument::from_html(
            &behaviors::inject_css(&html),
            DocumentConfig {
                viewport: Some(viewport),
                html_parser_provider: Some(Arc::new(HtmlProvider)),
                ..Default::default()
            },
        );
        behaviors::enhance(&mut Dom::new(&mut inner), &self.behaviors);

        let queue: Queue = Rc::default();
        let effects = self
            .bindings
            .into_iter()
            .map(|b| {
                let q = queue.clone();
                match b {
                    Binding::Text(s, f) => {
                        effect(move || q.borrow_mut().push(Patch::Text(s.clone(), f())))
                    }
                    Binding::Attr(s, n, f) => {
                        effect(move || q.borrow_mut().push(Patch::Attr(s.clone(), n.clone(), f())))
                    }
                    Binding::Class(s, c, f) => {
                        effect(move || q.borrow_mut().push(Patch::Class(s.clone(), c.clone(), f())))
                    }
                }
            })
            .collect();
        let mut doc = InteractiveDocument {
            inner,
            handlers: self.handlers,
            behaviors: self.behaviors,
            queue,
            _effects: effects,
            warnings,
        };
        doc.flush();
        Ok(doc)
    }

    /// Open a window and block until it closes. Compatibility warnings go to stderr.
    #[cfg(feature = "window")]
    pub fn launch(self) -> Result<(), Error> {
        let doc = self.build()?;
        for w in doc.warnings() {
            eprintln!("cascivo-blitz: warning: {w}");
        }
        crate::launch_document(doc)
    }
}

/// A Blitz document with handlers, bindings and native behaviours. Derefs to [`HtmlDocument`],
/// so `resolve`, `query_selector` and `resolved_style_value` work.
pub struct InteractiveDocument {
    inner: HtmlDocument,
    handlers: Vec<Handler>,
    behaviors: Behaviors,
    queue: Queue,
    _effects: Vec<Effect>,
    warnings: Vec<Diagnostic>,
}

impl Deref for InteractiveDocument {
    type Target = HtmlDocument;
    fn deref(&self) -> &HtmlDocument {
        &self.inner
    }
}

impl DerefMut for InteractiveDocument {
    fn deref_mut(&mut self) -> &mut HtmlDocument {
        &mut self.inner
    }
}

struct Dispatcher<'a> {
    handlers: &'a mut [Handler],
    behaviors: &'a Behaviors,
    keydown_cancelled: &'a Cell<bool>,
    clicked: &'a Cell<Option<NodeId>>,
}

impl EventHandler for Dispatcher<'_> {
    fn handle_event(
        &mut self,
        chain: &[NodeId],
        event: &mut DomEvent,
        doc: &mut dyn Document,
        state: &mut EventState,
    ) {
        let kind = event.data.kind();
        let mut guard = doc.inner_mut();
        let base: &mut BaseDocument = &mut guard;

        // Native behaviours run first, so handlers see the sorted table or the chosen option.
        behaviors::handle(&mut Dom::new(base), self.behaviors, chain, event, state);

        let hits: Vec<Vec<NodeId>> = self
            .handlers
            .iter()
            .map(|h| {
                if h.event.kind() == kind {
                    base.query_selector_all(&h.selector)
                        .map(|v| v.to_vec())
                        .unwrap_or_default()
                } else {
                    Vec::new()
                }
            })
            .collect();
        'chain: for &node in chain {
            for (h, hit) in self.handlers.iter_mut().zip(&hits) {
                if !hit.contains(&node) {
                    continue;
                }
                let mut ctx = Ctx {
                    dom: Dom::new(base),
                    target: event.target,
                    current: node,
                    event,
                    state,
                };
                (h.f)(&mut ctx);
                if state.propagation_is_stopped() {
                    break 'chain;
                }
            }
        }

        if kind == DomEventKind::Click {
            self.clicked.set(chain.first().copied());
        }
        if kind == DomEventKind::KeyDown {
            self.keydown_cancelled.set(state.is_cancelled());
        }
    }
}

impl InteractiveDocument {
    /// Compatibility warnings from `cascivo_html::lint`, when `Options::lint` is on.
    pub fn warnings(&self) -> &[Diagnostic] {
        &self.warnings
    }

    /// Apply queued binding updates. Returns whether anything was queued.
    pub fn flush(&mut self) -> bool {
        let patches: Vec<Patch> = self.queue.borrow_mut().drain(..).collect();
        let any = !patches.is_empty();
        let mut dom = Dom::new(&mut self.inner);
        for p in patches {
            apply(&mut dom, p);
        }
        any
    }

    /// Blitz drops focus after a click on a plain button, which breaks keyboard use: the next
    /// Space or Enter goes nowhere. Give focus back to the clicked control.
    fn keep_focus(&mut self, clicked: Option<NodeId>) {
        let Some(node) = clicked else { return };
        let none = self.inner.get_focussed_node_id() == self.inner.try_root_element().map(|e| e.id);
        if !none {
            return;
        }
        let target = self
            .inner
            .node_chain(node)
            .into_iter()
            .find(|n| self.inner.get_node(*n).is_some_and(|n| n.is_focussable()));
        if let Some(t) = target {
            self.inner.set_focus_to(t);
        }
    }

    /// Text of the first node matching `selector`.
    pub fn text(&self, selector: &str) -> Option<String> {
        let n = self.inner.query_selector(selector).ok().flatten()?;
        Some(self.inner.get_node(n)?.text_content())
    }

    /// Attribute of the first node matching `selector`.
    pub fn attr(&self, selector: &str, name: &str) -> Option<String> {
        let n = self.inner.query_selector(selector).ok().flatten()?;
        self.inner
            .get_node(n)?
            .attr(LocalName::from(name))
            .map(str::to_owned)
    }

    /// Node-level access, for code that is not an event handler.
    pub fn dom(&mut self) -> Dom<'_> {
        Dom::new(&mut self.inner)
    }

    fn dispatch(&mut self, events: Vec<DomEvent>) {
        let cancelled = Cell::new(false);
        let clicked = Cell::new(None);
        {
            let handler = Dispatcher {
                handlers: &mut self.handlers,
                behaviors: &self.behaviors,
                keydown_cancelled: &cancelled,
                clicked: &clicked,
            };
            let mut driver = EventDriver::new(&mut self.inner, handler);
            for e in events {
                driver.handle_dom_event(e);
            }
        }
        self.keep_focus(clicked.get());
        self.flush();
    }

    /// Send a click to the first node matching `selector`, as a pointer click would.
    /// Returns false when nothing matches.
    pub fn click(&mut self, selector: &str) -> bool {
        let Some(node) = self.dom().query(selector) else {
            return false;
        };
        let ev = self
            .inner
            .get_node(node)
            .map(|n| n.synthetic_click_event(Modifiers::empty()));
        match ev {
            Some(data) => {
                self.dispatch(vec![DomEvent::new(node, data)]);
                true
            }
            None => false,
        }
    }

    /// Click at the centre of the first match with real pointer down and up events. Resolves
    /// layout first, so the click goes through hit testing.
    pub fn pointer_click(&mut self, selector: &str) -> bool {
        self.inner.resolve(0.0);
        let Some(node) = self.dom().query(selector) else {
            return false;
        };
        let Some(data) = self
            .inner
            .get_node(node)
            .map(|n| n.synthetic_click_event_data(Modifiers::empty()))
        else {
            return false;
        };
        self.handle_ui_event(UiEvent::PointerDown(data.clone()));
        self.handle_ui_event(UiEvent::PointerUp(data));
        true
    }

    /// Move focus to the first node matching `selector`.
    pub fn focus(&mut self, selector: &str) -> bool {
        let mut dom = self.dom();
        match dom.query(selector) {
            Some(n) => {
                dom.focus(n);
                true
            }
            None => false,
        }
    }

    /// Press and release `key` on the focused node.
    pub fn press(&mut self, key: Key) {
        self.press_with(key, Modifiers::empty());
    }

    pub fn press_with(&mut self, key: Key, modifiers: Modifiers) {
        for state in [KeyState::Pressed, KeyState::Released] {
            let ev = BlitzKeyEvent {
                key: key.clone(),
                code: Code::Unidentified,
                modifiers,
                location: Location::Standard,
                is_auto_repeating: false,
                is_composing: false,
                state,
                text: None,
            };
            self.handle_ui_event(match state {
                KeyState::Pressed => UiEvent::KeyDown(ev),
                KeyState::Released => UiEvent::KeyUp(ev),
            });
        }
    }

    /// Send an input event with `value` to the first node matching `selector`.
    pub fn input(&mut self, selector: &str, value: &str) -> bool {
        let Some(node) = self.dom().query(selector) else {
            return false;
        };
        let data = DomEventData::Input(BlitzInputEvent {
            value: value.to_owned(),
        });
        self.dispatch(vec![DomEvent::new(node, data)]);
        true
    }
}

impl Document for InteractiveDocument {
    fn inner(&self) -> DocGuard<'_> {
        self.inner.inner()
    }

    fn inner_mut(&mut self) -> DocGuardMut<'_> {
        self.inner.inner_mut()
    }

    fn handle_ui_event(&mut self, event: UiEvent) {
        // Blitz turns no key press into a click. Enter or Space on a control must.
        let mut activate = None;
        if let UiEvent::KeyDown(k) = &event
            && !k.is_auto_repeating
            && let Some(node) = self.inner.get_focussed_node_id()
            && behaviors::activates(&Dom::new(&mut self.inner), node, &k.key)
        {
            activate = self
                .inner
                .get_node(node)
                .map(|n| DomEvent::new(node, n.synthetic_click_event(k.modifiers)));
        }
        let cancelled = Cell::new(false);
        let clicked = Cell::new(None);
        {
            let handler = Dispatcher {
                handlers: &mut self.handlers,
                behaviors: &self.behaviors,
                keydown_cancelled: &cancelled,
                clicked: &clicked,
            };
            let mut driver = EventDriver::new(&mut self.inner, handler);
            driver.handle_ui_event(event);
            if let Some(click) = activate.filter(|_| !cancelled.get()) {
                driver.handle_dom_event(click);
            }
        }
        self.keep_focus(clicked.get());
        self.flush();
    }

    fn poll(&mut self, _: Option<std::task::Context>) -> bool {
        self.flush()
    }
}
