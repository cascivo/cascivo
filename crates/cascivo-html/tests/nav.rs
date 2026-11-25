//! Structure tests for the nav group where React cannot match by design (the sort script) plus hostile-input and edge-shape checks across breadcrumb, steps, collapsible,
//! accordion, tabs and table.

use cascivo_html::{Options, render, render_fragment};

fn frag(src: &str) -> String {
    render_fragment(src).unwrap_or_else(|e| panic!("{e:?}"))
}

fn count(h: &str, needle: &str) -> usize {
    h.matches(needle).count()
}

const TABS: &str = "tabs\n  section \"Overview\"\n    text \"First\"\n  section \"Details\"\n    text \"Second\"\n  card \"Third\"\n";

#[test]
fn tabs_structure_and_ids() {
    let h = frag(TABS);
    assert!(h.starts_with(
        "<cv-tabs><div class=\"cv-tabs-tabs\"><div class=\"cv-tabs-list\" role=\"tablist\">"
    ));
    assert!(h.ends_with("</div></cv-tabs>"));
    assert_eq!(count(&h, "role=\"tab\""), 3);
    assert_eq!(count(&h, "role=\"tabpanel\""), 3);
    assert_eq!(count(&h, " aria-selected=\"true\""), 1);
    // tab and panel ids line up, by value (the label slug, numbered when untitled)
    for v in ["overview", "details", "tab-3"] {
        assert!(h.contains(&format!("id=\"cv-1-trigger-{v}\"")), "{v}");
        assert!(
            h.contains(&format!("aria-controls=\"cv-1-content-{v}\"")),
            "{v}"
        );
        assert!(h.contains(&format!("id=\"cv-1-content-{v}\"")), "{v}");
        assert!(
            h.contains(&format!("aria-labelledby=\"cv-1-trigger-{v}\"")),
            "{v}"
        );
        assert!(h.contains(&format!("data-value=\"{v}\"")), "{v}");
    }
    assert!(h.contains(">Overview</button>") && h.contains(">Tab 3</button>"));
    // roving tabindex: only the selected tab is in the tab order
    assert_eq!(
        count(&h, "tabindex=\"0\""),
        1 + 3,
        "selected tab + three panels"
    );
    assert_eq!(count(&h, "tabindex=\"-1\""), 2);
    // inactive panels are hidden; the active one is not
    assert_eq!(count(&h, " hidden>"), 2);
    // sections are unwrapped (no duplicate heading); a card is emitted whole
    assert!(!h.contains("cv-section"));
    assert!(h.contains("cv-card"));
    assert!(!h.contains("type=\"radio\""));
}

#[test]
fn tabs_value_selects_by_label_or_position() {
    let sel = |h: &str, v: &str| {
        h.contains(&format!(
            "aria-selected=\"true\" aria-controls=\"cv-1-content-{v}\""
        ))
    };
    assert!(sel(
        &frag(&TABS.replacen("tabs", "tabs defaultValue=Details", 1)),
        "details"
    ));
    assert!(sel(
        &frag(&TABS.replacen("tabs", "tabs value=3", 1)),
        "tab-3"
    ));
    assert!(sel(
        &frag(&TABS.replacen("tabs", "tabs value=nope", 1)),
        "overview"
    ));
}

#[test]
fn tabs_untitled_children_get_numbered_labels() {
    let h = frag(
        "tabs
  text \"a\"\n  text \"b\"\n",
    );
    assert!(h.contains(">Tab 1</button>") && h.contains(">Tab 2</button>"));
}

#[test]
fn tabs_values_are_unique_and_attribute_safe() {
    let h = frag(
        "tabs\n  section \"Same\"\n    text \"a\"\n  section \"Same\"\n    text \"b\"\n  section \"概要\"\n    text \"c\"\n  section \"A \\\" b\"\n    text \"d\"\n",
    );
    for v in ["same", "same-2", "3", "a-b"] {
        assert!(h.contains(&format!("data-value=\"{v}\"")), "{v}: {h}");
    }
}

#[test]
fn tabs_two_groups_do_not_share_ids() {
    let h = frag(&format!("{TABS}{TABS}"));
    assert!(
        h.contains("id=\"cv-1-trigger-overview\"") && h.contains("id=\"cv-2-trigger-overview\"")
    );
}

#[test]
fn tabs_hostile_label_is_escaped() {
    let h = frag("tabs\n  section \"<script>alert(1)</script>\"\n    text \"x\"\n");
    assert!(!h.contains("<script>"));
    assert!(h.contains("&lt;script&gt;alert(1)&lt;/script&gt;</button>"));
}

#[test]
fn tabs_script_loads_only_when_used() {
    let on = render(TABS, &Options::default()).unwrap();
    assert!(on.contains("<script>") && on.contains("cv-tabs"));
    assert!(
        on.contains("cv-tabs:not(:defined)"),
        "no-JS fallback rule is inlined"
    );
    assert!(!on.contains(".cv-tabs-input"));
    let off = render("card \"x\"", &Options::default()).unwrap();
    assert!(!off.contains("<script>") && !off.contains("cv-tabs:not"));
    let ext = render(
        TABS,
        &Options {
            script_src: Some("/cascivo.js".into()),
            ..Options::default()
        },
    )
    .unwrap();
    assert!(ext.contains("<script src=\"/cascivo.js\" defer></script>"));
}

#[test]
fn accordion_single_uses_exclusive_name_multiple_does_not() {
    let item =
        "  collapsible \"A\"\n    text \"a\"\n  collapsible \"B\" defaultOpen\n    text \"b\"\n";
    let single = frag(&format!("accordion\n{item}"));
    assert_eq!(count(&single, "<details name=\"cv-1\""), 2);
    assert_eq!(count(&single, " open>"), 1);
    let multi = frag(&format!("accordion type=multiple\n{item}"));
    assert!(!multi.contains("name="));
    assert!(multi.contains("data-type=\"multiple\""));
}

#[test]
fn accordion_non_collapsible_children_are_items() {
    let h = frag("accordion\n  section \"S\"\n    text \"in\"\n  card\n");
    assert!(h.contains("<h3 class=\"cv-accordion-heading\">S</h3>"));
    assert!(h.contains("<h3 class=\"cv-accordion-heading\">Item 2</h3>"));
    assert!(h.contains("aria-controls=\"cv-1-content-2\""));
}

#[test]
fn hostile_text_is_escaped_everywhere() {
    let bad = "<img src=x onerror=alert(1)>";
    for src in [
        format!("breadcrumb {bad},/a | {bad}"),
        format!("steps {bad} | {bad}"),
        format!("collapsible \"{bad}\"\n  text \"{bad}\"\n"),
        format!("accordion\n  collapsible \"{bad}\"\n    text \"{bad}\"\n"),
        format!("tabs\n  section \"{bad}\"\n    text \"{bad}\"\n"),
        format!(
            "table title=\"{bad}\" description=\"{bad}\" ariaLabel=\"{bad}\" {bad},{bad} | {bad}"
        ),
        format!("table emptyState=\"{bad}\" {bad}"),
        format!("table sortMode=client {bad} | {bad}"),
    ] {
        let h = frag(&src);
        assert!(!h.contains("<img"), "unescaped in: {src}\n{h}");
        assert!(h.contains("&lt;img"), "{src}");
    }
}

#[test]
fn breadcrumb_drops_unsafe_href_and_quotes_attributes() {
    let h = frag("breadcrumb Bad,javascript:alert(1) | Ok,/a?x=\"1 | Here");
    assert!(!h.contains("javascript"));
    assert!(h.contains("<li><span>Bad</span></li>"));
    assert!(h.contains("href=\"/a?x=&quot;1\""));
    assert!(h.contains("<span aria-current=\"page\">Here</span>"));
}

#[test]
fn breadcrumb_single_item_is_current_page() {
    let h = frag("breadcrumb Only,/x");
    assert!(h.contains("<span aria-current=\"page\">Only</span>"));
    assert!(!h.contains("<a "));
}

#[test]
fn steps_complete_active_pending() {
    let h = frag("steps activeStep=1 A | B | C");
    assert!(h.contains("data-state=\"complete\"><div class=\"cv-steps-circle\">\u{2713}</div>"));
    assert!(h.contains("data-state=\"active\" aria-current=\"step\""));
    assert!(h.contains("data-state=\"pending\"><div class=\"cv-steps-circle\">3</div>"));
}

#[test]
fn steps_description_becomes_escaped_title() {
    let h = frag("steps A,\"say \\\"hi\\\"\" | B");
    assert!(h.contains("title="));
    assert_eq!(count(&h, "title="), 1);
}

#[test]
fn table_header_only_shows_empty_row() {
    let h = frag("table Name,Qty");
    assert_eq!(count(&h, "<th "), 2);
    assert!(h.contains("data-empty-row=\"true\"><td colSpan=\"2\""));
    assert!(h.contains(">No data</td>"));
    assert!(!h.contains("data-parity"));
}

#[test]
fn table_ragged_rows_are_padded_to_widest() {
    let h = frag("table A | 1,2,3");
    assert_eq!(count(&h, "<th "), 3);
    assert_eq!(count(&h, "<td data-align"), 3);
    let h = frag("table A,B,C | 1");
    assert_eq!(count(&h, "<td data-align"), 3);
    assert_eq!(count(&h, "<col>"), 3);
}

#[test]
fn table_without_sort_has_no_script_or_sort_markup() {
    let h = render("table A,B | 1,2", &Options::default()).unwrap();
    assert!(!h.contains("<script>") && !h.contains("data-sortable") && !h.contains("aria-sort"));
}

#[test]
fn table_sort_adds_attribute_buttons_and_script_once() {
    let h = render(
        "table sortMode=client A,B | 2,x | 1,y\ntable sortMode=client C | z",
        &Options::default(),
    )
    .unwrap();
    assert_eq!(count(&h, "<script>"), 1);
    assert_eq!(
        count(&h, "<table class=\"cv-data-table-table\" data-sortable>"),
        2
    );
    assert_eq!(count(&h, "aria-sort=\"none\""), 3);
    assert!(h.contains(
        "<button type=\"button\" class=\"cv-data-table-sortButton\" data-state=\"none\">A</button>"
    ));
}

#[test]
fn table_explicit_server_sort_mode_is_not_sortable() {
    let h = frag("table sortMode=server A | 1");
    assert!(!h.contains("data-sortable"));
}

#[test]
fn sort_script_is_small_single_iife() {
    let js = include_str!("../assets/extra/table-sort.js");
    assert!(js.len() < 1024, "{} bytes", js.len());
    assert!(js.starts_with("(()=>{") && js.trim_end().ends_with("})();"));
    assert!(!js.contains("window.") && !js.contains("var "));
}

#[test]
fn non_wrapper_children_do_not_duplicate_their_text() {
    for src in [
        "accordion\n  text \"unique-needle\"\n",
        "tabs\n  text \"unique-needle\"\n",
        "tabs\n  card \"unique-needle\"\n",
    ] {
        let h = frag(src);
        assert_eq!(count(&h, "unique-needle"), 1, "{src}: {h}");
    }
}

#[test]
fn table_sort_prop_opts_into_sorting_script() {
    let on = render("table sort A,B | 1,2", &Options::default()).unwrap();
    assert!(on.contains("data-sortable") && on.contains("<script>"));
    let on = render("table sortMode=client A,B | 1,2", &Options::default()).unwrap();
    assert!(on.contains("data-sortable"));
    let off = render("table A,B | 1,2", &Options::default()).unwrap();
    assert!(!off.contains("data-sortable") && !off.contains("<script>"));
}
