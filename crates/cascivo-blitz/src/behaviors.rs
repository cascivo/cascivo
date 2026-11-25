//! Native replacements for what Blitz lacks: the table-sort script, `<select>`, `<dialog>`, ARIA
//! tabs, and keyboard support for them. Built for cascivo-html output, and works on any HTML that
//! follows the same markup.
//!
//! | Behaviour | Markup it acts on |
//! | --------- | ----------------- |
//! | table sort | `table[data-sortable] th[aria-sort]`: click sorts, sets `aria-sort` and `data-parity` |
//! | tabs | ARIA tabs (`[role=tab]`, `aria-controls`): click, Arrow/Home/End keys |
//! | details | `details[name]` closes its group; `data-state` and `aria-expanded` follow `open` |
//! | dialog | `<dialog>`; `[data-dialog-open=id]`, `[data-dialog-close]`; Escape closes; Tab stays inside |
//! | select | `<select>` becomes a combobox button and listbox; the `<select>` keeps the value |

use std::cmp::Ordering;

use blitz_dom::NodeId;
use blitz_traits::events::{DomEvent, DomEventData, EventState};
use keyboard_types::{Key, NamedKey};

use crate::dom::Dom;

/// Which native behaviours are on. All default to on.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Behaviors {
    pub table_sort: bool,
    pub tabs: bool,
    pub details: bool,
    pub dialog: bool,
    pub select: bool,
}

impl Default for Behaviors {
    fn default() -> Self {
        Self::all()
    }
}

impl Behaviors {
    pub const fn all() -> Self {
        Self {
            table_sort: true,
            tabs: true,
            details: true,
            dialog: true,
            select: true,
        }
    }

    pub const fn none() -> Self {
        Self {
            table_sort: false,
            tabs: false,
            details: false,
            dialog: false,
            select: false,
        }
    }
}

/// Stylesheet the behaviours need: `<dialog>` and the select fallback. Added to the document by
/// [`crate::App`].
pub const CSS: &str = r#"@layer cascivo.platform{
dialog{display:none}
dialog[open]{display:block;position:fixed;inset-inline-start:50%;inset-block-start:50%;transform:translate(-50%,-50%);max-inline-size:calc(100vw - 2rem);max-block-size:calc(100vh - 2rem);overflow:auto;margin:0;padding:var(--cascivo-space-6,1.5rem);z-index:var(--cascivo-z-modal,300);color:var(--cascivo-color-text,inherit);background:var(--cascivo-color-surface-overlay,canvas);border:1px solid var(--cascivo-color-border,#8884);border-radius:var(--cascivo-radius-overlay,.75rem);box-shadow:0 0 0 200vmax oklch(0% 0 0/.5),var(--cascivo-shadow-overlay,none)}
dialog[open][data-modeless]{box-shadow:var(--cascivo-shadow-overlay,none)}
[hidden]{display:none}
select[data-cv-select]{display:none}
.cv-select{position:relative;display:inline-block;min-inline-size:10rem;font-family:var(--cascivo-font-sans,inherit);font-size:var(--cascivo-text-sm,.875rem)}
.cv-select-trigger{display:flex;justify-content:space-between;align-items:center;gap:var(--cascivo-space-2,.5rem);inline-size:100%;block-size:var(--cascivo-control-height-md,2.5rem);padding-inline:var(--cascivo-space-3,.75rem);font:inherit;text-align:start;color:var(--cascivo-color-text,inherit);background:var(--cascivo-color-surface,canvas);border:1px solid var(--cascivo-color-border,#8884);border-radius:var(--cascivo-radius-field,.375rem);cursor:pointer}
.cv-select-trigger::after{content:"\25BE";opacity:.6}
.cv-select-trigger:focus{box-shadow:var(--cascivo-focus-ring,0 0 0 2px #38f8);outline:none}
.cv-select-trigger:disabled{opacity:.5;cursor:not-allowed}
.cv-select-list{display:none;position:absolute;inset-inline:0;inset-block-start:100%;margin:var(--cascivo-space-1,.25rem) 0 0;padding:var(--cascivo-space-1,.25rem);list-style:none;max-block-size:16rem;overflow:auto;z-index:var(--cascivo-z-dropdown,100);background:var(--cascivo-color-surface-overlay,canvas);border:1px solid var(--cascivo-color-border,#8884);border-radius:var(--cascivo-radius-overlay,.75rem);box-shadow:var(--cascivo-shadow-overlay,none)}
.cv-select[data-open] .cv-select-list{display:block}
.cv-select-option{padding:var(--cascivo-space-2,.5rem) var(--cascivo-space-3,.75rem);border-radius:var(--cascivo-radius-item,.25rem);cursor:pointer}
.cv-select-option:hover,.cv-select-option[data-active]{background:var(--cascivo-color-active-bg,#8882)}
.cv-select-option[aria-selected=true]{font-weight:var(--cascivo-font-semibold,600)}
.cv-select-option[aria-disabled=true]{opacity:.5;cursor:not-allowed}
[role=tab]{cursor:pointer}
}"#;

/// Insert [`CSS`] into `html`, before `</head>` when there is one.
pub(crate) fn inject_css(html: &str) -> String {
    let style = format!("<style data-cascivo-blitz>{CSS}</style>");
    match html.find("</head>") {
        Some(i) => format!("{}{style}{}", &html[..i], &html[i..]),
        None => format!("{style}{html}"),
    }
}

/// One-time setup after parsing: replace `<select>`, sync tabs, details and dialogs.
pub(crate) fn enhance(dom: &mut Dom, cfg: &Behaviors) {
    if cfg.select {
        for select in dom.query_all("select:not([data-cv-select]):not([multiple])") {
            enhance_select(dom, select);
        }
    }
    if cfg.details {
        for d in dom.query_all("details") {
            let open = dom.has_attr(d, "open");
            sync_details(dom, d, open);
        }
    }
    if cfg.tabs {
        for list in dom.query_all("[role=tablist]") {
            let tabs = dom.query_all_in(list, "[role=tab]");
            let current = tabs
                .iter()
                .copied()
                .find(|t| dom.attr(*t, "aria-selected").as_deref() == Some("true"))
                .or_else(|| tabs.first().copied());
            if let Some(t) = current {
                select_tab(dom, t);
            }
        }
    }
}

/// Run the behaviours for one DOM event. `chain` runs from the target to the root.
pub(crate) fn handle(
    dom: &mut Dom,
    cfg: &Behaviors,
    chain: &[NodeId],
    event: &DomEvent,
    state: &mut EventState,
) {
    match &event.data {
        DomEventData::Click(_) => {
            // Blitz's default click action would drop the focus these behaviours set.
            if on_click(dom, cfg, chain) {
                state.prevent_default();
            }
        }
        DomEventData::KeyDown(k) if k.state.is_pressed() => on_key(dom, cfg, chain, &k.key, state),
        _ => {}
    }
}

/// Returns true when the click is fully handled and Blitz's default action should be skipped.
fn on_click(dom: &mut Dom, cfg: &Behaviors, chain: &[NodeId]) -> bool {
    if cfg.select {
        close_other_selects(dom, chain);
    }
    if cfg.table_sort && sort_click(dom, chain) {
        return true;
    }
    if cfg.tabs
        && let Some(tab) = chain
            .iter()
            .copied()
            .find(|n| dom.attr(*n, "role").as_deref() == Some("tab"))
    {
        if !dom.has_attr(tab, "disabled") {
            select_tab(dom, tab);
        }
        return true;
    }
    if cfg.details && details_click(dom, chain) {
        return false;
    }
    if cfg.dialog && dialog_click(dom, chain) {
        return true;
    }
    cfg.select && select_click(dom, chain)
}

fn on_key(dom: &mut Dom, cfg: &Behaviors, chain: &[NodeId], key: &Key, state: &mut EventState) {
    if cfg.dialog && dialog_key(dom, key, state) {
        return;
    }
    if cfg.select && select_key(dom, chain, key, state) {
        return;
    }
    if cfg.tabs {
        tabs_key(dom, chain, key, state);
    }
}

// ---------------------------------------------------------------------------------------------
// Table sort

fn cell_text(dom: &Dom, row: NodeId, col: usize) -> String {
    let cells = dom.element_children(row);
    cells
        .get(col)
        .map(|c| dom.text(*c).trim().to_owned())
        .unwrap_or_default()
}

/// Numbers compare as numbers, other text compares case-insensitively with digit runs as numbers.
fn compare_cells(a: &str, b: &str) -> Ordering {
    if let (Ok(x), Ok(y)) = (a.parse::<f64>(), b.parse::<f64>())
        && !a.is_empty()
        && !b.is_empty()
    {
        return x.partial_cmp(&y).unwrap_or(Ordering::Equal);
    }
    natural_cmp(&a.to_lowercase(), &b.to_lowercase())
}

fn natural_cmp(a: &str, b: &str) -> Ordering {
    let (mut a, mut b) = (a.chars().peekable(), b.chars().peekable());
    loop {
        match (a.peek().copied(), b.peek().copied()) {
            (None, None) => return Ordering::Equal,
            (None, _) => return Ordering::Less,
            (_, None) => return Ordering::Greater,
            (Some(x), Some(y)) if x.is_ascii_digit() && y.is_ascii_digit() => {
                let take = |it: &mut std::iter::Peekable<std::str::Chars>| {
                    let mut n = String::new();
                    while let Some(c) = it.next_if(char::is_ascii_digit) {
                        n.push(c);
                    }
                    n.trim_start_matches('0').to_owned()
                };
                let (nx, ny) = (take(&mut a), take(&mut b));
                let ord = nx.len().cmp(&ny.len()).then_with(|| nx.cmp(&ny));
                if ord != Ordering::Equal {
                    return ord;
                }
            }
            (Some(x), Some(y)) => {
                let ord = x.cmp(&y);
                if ord != Ordering::Equal {
                    return ord;
                }
                a.next();
                b.next();
            }
        }
    }
}

fn sort_click(dom: &mut Dom, chain: &[NodeId]) -> bool {
    let Some(th) = chain
        .iter()
        .copied()
        .find(|n| dom.tag(*n).as_deref() == Some("th") && dom.has_attr(*n, "aria-sort"))
    else {
        return false;
    };
    let Some(table) = dom.closest(th, "table[data-sortable]") else {
        return false;
    };
    let Some(row) = dom.parent(th) else {
        return false;
    };
    let col = dom
        .element_children(row)
        .iter()
        .position(|c| *c == th)
        .unwrap_or(0);
    let Some(tbody) = dom.query_in(table, "tbody") else {
        return false;
    };
    let descending = dom.attr(th, "aria-sort").as_deref() == Some("ascending");

    let mut rows: Vec<(String, NodeId)> = dom
        .element_children(tbody)
        .into_iter()
        .filter(|r| dom.tag(*r).as_deref() == Some("tr") && !dom.has_attr(*r, "data-empty-row"))
        .map(|r| (cell_text(dom, r, col), r))
        .collect();
    rows.sort_by(|(a, _), (b, _)| {
        let ord = compare_cells(a, b);
        if descending { ord.reverse() } else { ord }
    });
    let ids: Vec<NodeId> = rows.iter().map(|(_, r)| *r).collect();
    dom.reorder(tbody, &ids);
    for (i, r) in ids.iter().enumerate() {
        dom.set_attr(*r, "data-parity", if i % 2 == 1 { "odd" } else { "even" });
    }

    for h in dom.element_children(row) {
        if dom.has_attr(h, "aria-sort") {
            set_sort_state(dom, h, "none");
        }
    }
    set_sort_state(
        dom,
        th,
        if descending {
            "descending"
        } else {
            "ascending"
        },
    );
    true
}

fn set_sort_state(dom: &mut Dom, th: NodeId, value: &str) {
    dom.set_attr(th, "aria-sort", value);
    if let Some(b) = dom.query_in(th, "button") {
        dom.set_attr(b, "data-state", value);
    }
}

// ---------------------------------------------------------------------------------------------
// Tabs

/// Select an ARIA tab: roving `tabindex`, `aria-selected`, and show only its panel.
pub fn select_tab(dom: &mut Dom, tab: NodeId) {
    let Some(list) = dom.closest(tab, "[role=tablist]") else {
        return;
    };
    for t in dom.query_all_in(list, "[role=tab]") {
        let on = t == tab;
        dom.set_attr(t, "aria-selected", if on { "true" } else { "false" });
        dom.set_attr(t, "tabindex", if on { "0" } else { "-1" });
        dom.set_attr(t, "data-state", if on { "active" } else { "inactive" });
        if let Some(panel) = dom
            .attr(t, "aria-controls")
            .and_then(|id| dom.base().get_element_by_id(&id))
        {
            dom.set_flag(panel, "hidden", !on);
            dom.set_attr(panel, "data-state", if on { "active" } else { "inactive" });
        }
    }
}

fn step(key: &Key, len: usize, cur: usize) -> Option<usize> {
    let Key::Named(k) = key else { return None };
    Some(match k {
        NamedKey::ArrowRight | NamedKey::ArrowDown => (cur + 1) % len,
        NamedKey::ArrowLeft | NamedKey::ArrowUp => (cur + len - 1) % len,
        NamedKey::Home => 0,
        NamedKey::End => len - 1,
        _ => return None,
    })
}

fn tabs_key(dom: &mut Dom, chain: &[NodeId], key: &Key, state: &mut EventState) {
    let Some(&target) = chain.first() else { return };
    if dom.attr(target, "role").as_deref() == Some("tab") {
        let Some(list) = dom.closest(target, "[role=tablist]") else {
            return;
        };
        let tabs: Vec<NodeId> = dom
            .query_all_in(list, "[role=tab]")
            .into_iter()
            .filter(|t| !dom.has_attr(*t, "disabled"))
            .collect();
        let Some(cur) = tabs.iter().position(|t| *t == target) else {
            return;
        };
        if let Some(next) = step(key, tabs.len(), cur) {
            state.prevent_default();
            select_tab(dom, tabs[next]);
            dom.focus(tabs[next]);
        }
    }
}

// ---------------------------------------------------------------------------------------------
// Details / accordion

fn sync_details(dom: &mut Dom, details: NodeId, open: bool) {
    let st = if open { "open" } else { "closed" };
    dom.set_attr(details, "data-state", st);
    if let Some(summary) = dom.query_in(details, "summary") {
        dom.set_attr(summary, "data-state", st);
        dom.set_attr(
            summary,
            "aria-expanded",
            if open { "true" } else { "false" },
        );
    }
}

fn first_summary(dom: &Dom, details: NodeId) -> Option<NodeId> {
    dom.element_children(details)
        .into_iter()
        .find(|c| dom.tag(*c).as_deref() == Some("summary"))
}

/// Runs before Blitz flips `open`, so it works from the state the click will produce.
fn details_click(dom: &mut Dom, chain: &[NodeId]) -> bool {
    let Some(summary) = chain
        .iter()
        .copied()
        .find(|n| dom.tag(*n).as_deref() == Some("summary"))
    else {
        return false;
    };
    let Some(details) = dom.parent(summary) else {
        return false;
    };
    if dom.tag(details).as_deref() != Some("details")
        || first_summary(dom, details) != Some(summary)
    {
        return false;
    }
    let will_open = !dom.has_attr(details, "open");
    if will_open && let Some(group) = dom.attr(details, "name") {
        for other in dom.query_all("details[name][open]") {
            if other != details && dom.attr(other, "name").as_deref() == Some(&group) {
                dom.remove_attr(other, "open");
                sync_details(dom, other, false);
            }
        }
    }
    sync_details(dom, details, will_open);
    true
}

// ---------------------------------------------------------------------------------------------
// Dialog

fn dialog_target(dom: &Dom, value: &str) -> Option<NodeId> {
    let id = value.trim_start_matches('#');
    let n = dom.0.get_element_by_id(id)?;
    (dom.tag(n).as_deref() == Some("dialog")).then_some(n)
}

const FOCUSABLE: &str = "a[href],button,input,select,textarea,summary,[tabindex]";

fn focusables(dom: &Dom, scope: NodeId) -> Vec<NodeId> {
    dom.query_all_in(scope, FOCUSABLE)
        .into_iter()
        .filter(|n| dom.is_focusable(*n))
        .collect()
}

/// Show a `<dialog>`: set `open`, remember the focused node, focus the first control inside.
pub fn open_dialog(dom: &mut Dom, dialog: NodeId) {
    if dom.has_attr(dialog, "open") {
        return;
    }
    if let Some(f) = dom
        .focused()
        .filter(|f| dom.tag(*f).as_deref() != Some("html"))
    {
        dom.set_attr(dialog, "data-cv-opener", &f.as_u64().to_string());
    }
    dom.set_attr(dialog, "open", "");
    if let Some(first) = focusables(dom, dialog).first() {
        dom.focus(*first);
    }
}

/// Hide a `<dialog>` and give focus back to the node that opened it.
pub fn close_dialog(dom: &mut Dom, dialog: NodeId) {
    if !dom.has_attr(dialog, "open") {
        return;
    }
    dom.remove_attr(dialog, "open");
    if let Some(opener) = dom
        .attr(dialog, "data-cv-opener")
        .and_then(|v| v.parse::<u64>().ok())
        .map(NodeId::from_u64)
        .filter(|n| dom.0.get_node(*n).is_some())
    {
        dom.focus(opener);
    }
    dom.remove_attr(dialog, "data-cv-opener");
}

fn dialog_click(dom: &mut Dom, chain: &[NodeId]) -> bool {
    for &n in chain {
        if let Some(t) = dom.attr(n, "data-dialog-open") {
            if let Some(d) = dialog_target(dom, &t) {
                open_dialog(dom, d);
            }
            return true;
        }
        if let Some(t) = dom.attr(n, "data-dialog-toggle") {
            if let Some(d) = dialog_target(dom, &t) {
                if dom.has_attr(d, "open") {
                    close_dialog(dom, d);
                } else {
                    open_dialog(dom, d);
                }
            }
            return true;
        }
        if dom.has_attr(n, "data-dialog-close") {
            let target = match dom.attr(n, "data-dialog-close").filter(|v| !v.is_empty()) {
                Some(id) => dialog_target(dom, &id),
                None => dom.closest(n, "dialog"),
            };
            if let Some(d) = target {
                close_dialog(dom, d);
            }
            return true;
        }
    }
    false
}

fn dialog_key(dom: &mut Dom, key: &Key, state: &mut EventState) -> bool {
    let Some(&dialog) = dom.query_all("dialog[open]").last() else {
        return false;
    };
    match key {
        Key::Named(NamedKey::Escape) => {
            // A select inside the dialog closes first.
            if dom.query_in(dialog, ".cv-select[data-open]").is_some() {
                return false;
            }
            state.prevent_default();
            close_dialog(dom, dialog);
            true
        }
        Key::Named(NamedKey::Tab) if !dom.has_attr(dialog, "data-modeless") => {
            let items = focusables(dom, dialog);
            if items.is_empty() {
                return false;
            }
            let cur = dom
                .focused()
                .and_then(|f| items.iter().position(|i| *i == f));
            let next = match cur {
                Some(i) => (i + 1) % items.len(),
                None => 0,
            };
            state.prevent_default();
            dom.focus(items[next]);
            true
        }
        _ => false,
    }
}

// ---------------------------------------------------------------------------------------------
// Select

fn esc(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

fn enhance_select(dom: &mut Dom, select: NodeId) {
    let options = dom.query_all_in(select, "option");
    if options.is_empty() {
        return;
    }
    let selected = options
        .iter()
        .position(|o| dom.has_attr(*o, "selected"))
        .or_else(|| options.iter().position(|o| !dom.has_attr(*o, "disabled")))
        .unwrap_or(0);
    let mut items = String::new();
    for (i, o) in options.iter().enumerate() {
        let label = dom.text(*o).trim().to_owned();
        let value = dom.attr(*o, "value").unwrap_or_else(|| label.clone());
        let disabled = if dom.has_attr(*o, "disabled") {
            " aria-disabled=\"true\""
        } else {
            ""
        };
        items.push_str(&format!(
            "<li class=\"cv-select-option\" role=\"option\" data-value=\"{}\" aria-selected=\"{}\"{disabled}>{}</li>",
            esc(&value),
            i == selected,
            esc(&label)
        ));
    }
    let disabled = if dom.has_attr(select, "disabled") {
        " disabled"
    } else {
        ""
    };
    let label = esc(dom.text(options[selected]).trim());
    let html = format!(
        "<button type=\"button\" class=\"cv-select-trigger\" role=\"combobox\" aria-haspopup=\"listbox\" aria-expanded=\"false\"{disabled}>{label}</button>\
         <ul class=\"cv-select-list\" role=\"listbox\">{items}</ul>"
    );
    for (i, o) in options.iter().enumerate() {
        dom.set_flag(*o, "selected", i == selected);
    }
    dom.set_attr(select, "data-cv-select", "");
    dom.insert_after(select, "div", "cv-select", &html);
}

/// The value of the chosen `<option>` in a `<select>`.
pub fn select_value(dom: &Dom, select: NodeId) -> Option<String> {
    let options = dom.query_all_in(select, "option");
    let o = options
        .iter()
        .copied()
        .find(|o| dom.has_attr(*o, "selected"))
        .or_else(|| options.first().copied())?;
    Some(
        dom.attr(o, "value")
            .unwrap_or_else(|| dom.text(o).trim().to_owned()),
    )
}

struct Combo {
    wrap: NodeId,
    select: NodeId,
    trigger: NodeId,
    items: Vec<NodeId>,
}

fn combo(dom: &Dom, node: NodeId) -> Option<Combo> {
    let wrap = dom.closest(node, ".cv-select")?;
    let select = dom.prev_sibling(wrap)?;
    Some(Combo {
        wrap,
        select,
        trigger: dom.query_in(wrap, ".cv-select-trigger")?,
        items: dom.query_all_in(wrap, ".cv-select-option"),
    })
}

fn selected_index(dom: &Dom, c: &Combo) -> usize {
    c.items
        .iter()
        .position(|i| dom.attr(*i, "aria-selected").as_deref() == Some("true"))
        .unwrap_or(0)
}

fn set_active(dom: &mut Dom, c: &Combo, idx: Option<usize>) {
    for (i, item) in c.items.iter().enumerate() {
        dom.set_flag(*item, "data-active", Some(i) == idx);
    }
}

fn active_index(dom: &Dom, c: &Combo) -> Option<usize> {
    c.items.iter().position(|i| dom.has_attr(*i, "data-active"))
}

fn set_select_open(dom: &mut Dom, c: &Combo, open: bool) {
    dom.set_flag(c.wrap, "data-open", open);
    dom.set_attr(
        c.trigger,
        "aria-expanded",
        if open { "true" } else { "false" },
    );
    let idx = open.then(|| selected_index(dom, c));
    set_active(dom, c, idx);
}

fn choose(dom: &mut Dom, c: &Combo, idx: usize) {
    let options = dom.query_all_in(c.select, "option");
    for (i, o) in options.iter().enumerate() {
        dom.set_flag(*o, "selected", i == idx);
    }
    for (i, item) in c.items.iter().enumerate() {
        dom.set_attr(
            *item,
            "aria-selected",
            if i == idx { "true" } else { "false" },
        );
    }
    if let Some(item) = c.items.get(idx) {
        let label = dom.text(*item);
        dom.set_text(c.trigger, &label);
    }
}

fn enabled(dom: &Dom, c: &Combo, idx: usize) -> bool {
    c.items
        .get(idx)
        .is_some_and(|i| dom.attr(*i, "aria-disabled").as_deref() != Some("true"))
}

/// Next enabled option from `from` in direction `dir` (no wrap).
fn seek(dom: &Dom, c: &Combo, from: usize, dir: isize) -> Option<usize> {
    let mut i = from as isize + dir;
    while i >= 0 && (i as usize) < c.items.len() {
        if enabled(dom, c, i as usize) {
            return Some(i as usize);
        }
        i += dir;
    }
    None
}

fn close_other_selects(dom: &mut Dom, chain: &[NodeId]) {
    for wrap in dom.query_all(".cv-select[data-open]") {
        if !chain.contains(&wrap)
            && let Some(c) = combo(dom, wrap)
        {
            set_select_open(dom, &c, false);
        }
    }
}

fn select_click(dom: &mut Dom, chain: &[NodeId]) -> bool {
    let Some(&first) = chain.first() else {
        return false;
    };
    let Some(c) = combo(dom, first) else {
        return false;
    };
    if let Some(item) = chain.iter().position(|n| c.items.contains(n)) {
        let idx = c.items.iter().position(|i| *i == chain[item]).unwrap_or(0);
        if enabled(dom, &c, idx) {
            choose(dom, &c, idx);
            set_select_open(dom, &c, false);
            dom.focus(c.trigger);
        }
    } else if chain.contains(&c.trigger) && !dom.has_attr(c.trigger, "disabled") {
        let open = !dom.has_attr(c.wrap, "data-open");
        set_select_open(dom, &c, open);
    }
    true
}

fn select_key(dom: &mut Dom, chain: &[NodeId], key: &Key, state: &mut EventState) -> bool {
    let Some(&target) = chain.first() else {
        return false;
    };
    let Some(c) = combo(dom, target) else {
        return false;
    };
    if c.trigger != target || c.items.is_empty() {
        return false;
    }
    let open = dom.has_attr(c.wrap, "data-open");
    let space = matches!(key, Key::Character(s) if s == " ");
    let named = match key {
        Key::Named(k) => Some(k),
        _ => None,
    };
    let cur = if open {
        active_index(dom, &c).unwrap_or_else(|| selected_index(dom, &c))
    } else {
        selected_index(dom, &c)
    };
    match named {
        Some(NamedKey::ArrowDown | NamedKey::ArrowUp | NamedKey::Home | NamedKey::End) => {
            state.prevent_default();
            let next = match named {
                Some(NamedKey::Home) => (0..c.items.len()).find(|i| enabled(dom, &c, *i)),
                Some(NamedKey::End) => (0..c.items.len()).rev().find(|i| enabled(dom, &c, *i)),
                Some(NamedKey::ArrowUp) => seek(dom, &c, cur, -1),
                _ => seek(dom, &c, cur, 1),
            };
            if let Some(n) = next {
                if open {
                    set_active(dom, &c, Some(n));
                } else {
                    choose(dom, &c, n);
                }
            }
            true
        }
        Some(NamedKey::Escape) if open => {
            state.prevent_default();
            set_select_open(dom, &c, false);
            true
        }
        Some(NamedKey::Tab) if open => {
            set_select_open(dom, &c, false);
            false
        }
        Some(NamedKey::Enter) if open => {
            state.prevent_default();
            choose(dom, &c, cur);
            set_select_open(dom, &c, false);
            true
        }
        _ if space && open => {
            state.prevent_default();
            choose(dom, &c, cur);
            set_select_open(dom, &c, false);
            true
        }
        _ => false,
    }
}

/// Whether a key press on `node` acts like a click (Enter or Space on a control).
pub(crate) fn activates(dom: &Dom, node: NodeId, key: &Key) -> bool {
    let space = matches!(key, Key::Character(s) if s == " ");
    let enter = matches!(key, Key::Named(NamedKey::Enter));
    if !space && !enter {
        return false;
    }
    let Some(tag) = dom.tag(node) else {
        return false;
    };
    if dom.has_attr(node, "disabled") {
        return false;
    }
    let role = dom.attr(node, "role");
    match tag.as_str() {
        "button" | "summary" => true,
        "a" => enter && dom.has_attr(node, "href"),
        "input" => {
            let ty = dom.attr(node, "type").unwrap_or_default();
            (space && matches!(ty.as_str(), "checkbox" | "radio"))
                || matches!(ty.as_str(), "button" | "submit" | "reset")
        }
        _ => matches!(role.as_deref(), Some("button" | "tab" | "option")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn natural_order() {
        let mut v = vec!["item10", "item2", "Item1", "b", "a"];
        v.sort_by(|a, b| natural_cmp(&a.to_lowercase(), &b.to_lowercase()));
        assert_eq!(v, ["a", "b", "Item1", "item2", "item10"]);
    }

    #[test]
    fn numbers_before_text_compare() {
        assert_eq!(compare_cells("5", "30"), Ordering::Less);
        assert_eq!(compare_cells("5.5", "30"), Ordering::Less);
        assert_eq!(compare_cells("Al", "bob"), Ordering::Less);
    }
}
