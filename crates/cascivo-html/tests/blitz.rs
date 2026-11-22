use cascivo_html::{Options, Target, lint, render, render_parts, stylesheet};

fn blitz() -> Options {
    Options {
        target: Target::Blitz,
        ..Options::default()
    }
}

fn page(src: &str, opts: &Options) -> String {
    render(src, opts).unwrap_or_else(|e| panic!("{e:?}"))
}

const SAMPLES: &[&str] = &[
    "grid\n  card \"A\"\n  card \"B\"\n",
    "meter 40 label=\"CPU\"\nprogress-circle 40\nspinner\n",
    "area 3 5 4\n",
    "table Name,Qty | a,1 | b,2\n",
];

#[test]
fn browser_target_is_the_default_and_unchanged() {
    assert_eq!(Options::default().target, Target::Browser);
    for src in SAMPLES {
        let explicit = Options {
            target: Target::Browser,
            ..Options::default()
        };
        assert_eq!(page(src, &Options::default()), page(src, &explicit));
    }
    let h = page("grid\n  card \"A\"\n  button \"Go\"\n", &Options::default());
    assert!(h.contains("@container") && h.contains(":focus-visible"));
}

#[test]
fn blitz_has_no_container_queries_or_focus_visible() {
    let h = page("grid\n  card \"A\"\n  button \"Go\"\n", &blitz());
    assert!(!h.contains("@container"), "container query left");
    assert!(!h.contains(":focus-visible"), "focus-visible left");
    assert!(h.contains("@media (min-width:30rem)"));
    assert!(h.contains(":focus{"), "focus ring rule missing");
}

#[test]
fn blitz_progress_circle_gets_presentation_attributes() {
    let h = page("progress-circle 40\n", &blitz());
    assert!(
        h.contains("transform=\"rotate(-90 24 24)\""),
        "no rotate attr in {h}"
    );
    assert!(!h.contains("stroke=\"var("));
    let circles: Vec<&str> = h.split("<circle").skip(1).collect();
    assert_eq!(circles.len(), 2);
    for c in circles {
        let tag = &c[..c.find('>').unwrap()];
        assert!(tag.contains("stroke=\"rgb("), "unresolved stroke in {tag}");
    }
}

#[test]
fn blitz_meter_track_and_fill() {
    let h = page("meter 40 label=\"CPU\"\n", &blitz());
    let track = h
        .split("<rect")
        .skip(1)
        .find(|r| r.contains("cv-meter-track"))
        .unwrap();
    assert!(track.contains("fill=\"rgb("), "{track}");
    let fill = h
        .split("<rect")
        .skip(1)
        .find(|r| r.contains("cv-meter-fill"))
        .unwrap();
    assert!(fill.contains("transform=\"scale(0.4 1)\""), "{fill}");
    assert!(!fill.contains("style="));
}

#[test]
fn blitz_chart_vars_become_literals() {
    let browser = page("area 3 5 4\n", &Options::default());
    assert!(browser.contains("var(--cascivo-chart-"));
    let h = page("area 3 5 4\n", &blitz());
    let svg = &h[h.find("<svg role=\"img\"").unwrap()..h.find("</svg>").unwrap()];
    assert!(!svg.contains("var("), "{svg}");
    assert!(svg.contains("stop-color=\"rgb("));
    assert!(svg.contains("stroke=\"rgb("));
}

#[test]
fn blitz_resolves_against_the_document_theme() {
    let light = page("area 3 5\n", &blitz());
    let dark = page("@brand theme=dark\narea 3 5\n", &blitz());
    let grid = |h: &str| {
        let i = h.find("stroke-dasharray=\"2 4\"").unwrap();
        let s = h[..i].rfind("stroke=\"").unwrap() + 8;
        h[s..s + h[s..].find('"').unwrap()].to_string()
    };
    assert_eq!(grid(&light), "rgb(229, 231, 235)");
    assert_eq!(grid(&dark), "rgba(255, 255, 255, 0.06)");
}

#[test]
fn blitz_drops_inline_scripts() {
    let src = "table sort Name,Qty | a,1 | b,2\n";
    assert!(page(src, &Options::default()).contains("<script>"));
    let h = page(src, &blitz());
    assert!(!h.contains("<script>"));
    assert!(h.contains("data-sortable"), "hook attribute must stay");
}

#[test]
fn render_parts_lowers_markup_for_blitz() {
    let f = render_parts("progress-circle 40\n", &blitz()).unwrap();
    assert!(f.html.contains("transform=\"rotate(-90 24 24)\""));
    let plain = render_parts("progress-circle 40\n", &Options::default()).unwrap();
    assert!(!plain.html.contains("transform=\"rotate"));
}

#[test]
fn stylesheet_lowering_is_composable() {
    let css = stylesheet("light", &["grid", "button"].into_iter().collect());
    let lowered = cascivo_html::lower_css(&css);
    assert!(!lowered.contains("@container") && !lowered.contains(":focus-visible"));
}

fn warns(src: &str) -> Vec<String> {
    lint(src, Target::Blitz)
        .unwrap()
        .into_iter()
        .map(|d| d.to_string())
        .collect()
}

#[test]
fn lint_flags_degraded_components() {
    let w = warns("table sort Name,Qty | a,1\n");
    assert!(
        w.iter()
            .any(|m| m.starts_with("1:1: table:") && m.contains("sorting"))
    );
    assert!(
        warns("table stickyHeader Name | a\n")
            .iter()
            .any(|m| m.contains("sticky"))
    );
    assert!(warns("spinner\n").iter().any(|m| m.contains("static")));
    assert!(
        warns("alert \"T\" \"B\"\n")
            .iter()
            .any(|m| m.contains("currentColor"))
    );
    assert!(warns("card \"T\"\n").iter().any(|m| m.contains(":has()")));
    assert!(
        warns("link \"x\" external\n")
            .iter()
            .any(|m| m.contains(":has()"))
    );
    assert!(
        warns("grid\n  card \"A\"\n")
            .iter()
            .any(|m| m.contains("container queries"))
    );
}

#[test]
fn lint_reports_nested_nodes_with_positions() {
    let w = warns("grid\n  spinner\n");
    assert!(w.iter().any(|m| m.starts_with("2:3: spinner:")), "{w:?}");
}

#[test]
fn lint_is_quiet_for_clean_pages_and_browser() {
    assert!(warns("heading \"Hi\"\ntext \"There\"\n").is_empty());
    assert!(
        lint("spinner\ntable sort Name | a\n", Target::Browser)
            .unwrap()
            .is_empty()
    );
}

#[test]
fn lint_passes_parse_errors_through() {
    assert!(lint("crad \"x\"\n", Target::Blitz).is_err());
}

#[test]
fn target_parse() {
    assert_eq!(Target::parse("blitz"), Some(Target::Blitz));
    assert_eq!(Target::parse("browser"), Some(Target::Browser));
    assert_eq!(Target::parse("web"), None);
}
