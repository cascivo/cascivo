use cascivo_html::emit::chart::emit_chart;
use cascivo_html::render::Cx;
use cascivo_html::{Doc, Node, Value, lookup, parse};

fn render_node(n: &Node) -> (String, Cx<'static>) {
    let mut cx = Cx::default();
    let mut out = String::new();
    emit_chart(n, &mut cx, &mut out);
    (out, cx)
}

fn render(src: &str) -> String {
    let doc: Doc = parse(src).unwrap_or_else(|e| panic!("{e:?}"));
    render_node(&doc.nodes[0]).0
}

fn node(name: &str, args: Vec<Value>) -> Node {
    Node {
        spec: lookup(name).unwrap(),
        args,
        props: vec![],
        text: None,
        children: vec![],
        line: 1,
        col: 1,
    }
}

/// No `NaN`/`inf` anywhere in the markup.
fn assert_finite(html: &str) {
    for tok in html.split(|c: char| !c.is_ascii_alphanumeric()) {
        assert!(
            !matches!(tok, "NaN" | "nan" | "inf" | "Infinity" | "infinity"),
            "non-finite number in: {html}"
        );
    }
}

const CHARTS: &[(&str, &str)] = &[
    ("bar", "bar Q1:12 Q2:18 Q3:9 title=Revenue legend"),
    ("line", "line 3 5 8 13 title=Growth"),
    ("area", "area 3 5 8 13 title=Growth"),
    ("pie", "pie A:40 B:35 C:25 title=Share labels size=200"),
    (
        "donut",
        "pie A:40 B:35 C:25 donut title=Share centerValue=100 centerLabel=Total size=200",
    ),
    ("scatter", "scatter 1:2 3:5 4:3 title=Points"),
    ("spark", "spark 3 5 8 13 label=Trend"),
    ("gauge", "gauge 57 title=CPU unit=% width=240 height=240"),
];

#[test]
fn snapshots() {
    for (name, src) in CHARTS {
        let got = render(src);
        let path = format!("{}/tests/charts/{name}.snap", env!("CARGO_MANIFEST_DIR"));
        if std::env::var_os("UPDATE_SNAPSHOTS").is_some() || !std::path::Path::new(&path).exists() {
            std::fs::write(&path, &got).unwrap();
        }
        assert_eq!(
            got,
            std::fs::read_to_string(&path).unwrap(),
            "{name} drifted; rerun with UPDATE_SNAPSHOTS=1"
        );
        assert_finite(&got);
    }
}

#[test]
fn deterministic() {
    for (_, src) in CHARTS {
        assert_eq!(render(src), render(src));
    }
}

#[test]
fn structure() {
    let bar = render("bar Q1:12 Q2:18 title=T");
    assert!(bar.contains("role=\"img\" aria-label=\"T\""));
    assert!(bar.contains("viewBox=\"0 0 400 300\""));
    assert!(bar.contains("<title>T</title>"));
    assert_eq!(bar.matches("<rect").count(), 2);
    assert!(bar.contains("var(--cascivo-chart-1)"));
    assert!(bar.contains("data-x=\"Q1\""));
    assert!(!bar.contains("cv-chart-legend"), "one series: no legend");
    let pie = render("pie A:1 B:2");
    assert!(
        pie.contains("cv-chart-legend-legend"),
        "pie shows a legend by default"
    );
    assert_eq!(pie.matches("<path").count(), 2);
    assert!(
        render("pie A:1 B:2 plain").contains("<path")
            && !render("pie A:1 B:2 plain").contains("legend")
    );
}

#[test]
fn marks_css_used() {
    let doc = parse("pie A:1 B:2").unwrap();
    let (_, cx) = render_node(&doc.nodes[0]);
    assert!(cx.used.contains("chart-legend"));
    let doc = parse("line 1 2 3").unwrap();
    let (_, cx) = render_node(&doc.nodes[0]);
    assert!(cx.used.is_empty());
}

#[test]
fn text_is_escaped() {
    let h = render("bar a&b:1 title=\"<script>x</script>\"");
    assert!(!h.contains("<script>"));
    assert!(h.contains("&lt;script&gt;") && h.contains("a&amp;b"));
    let (h, _) = render_node(&node(
        "bar",
        vec![Value::Pairs(vec![("<b>\"x\"</b>".into(), 1.0)])],
    ));
    assert!(!h.contains("<b>") && h.contains("&lt;b&gt;&quot;x&quot;"));
}

#[test]
fn empty_data_renders_empty_state() {
    for (name, arg) in [
        ("bar", Value::Pairs(vec![])),
        ("pie", Value::Pairs(vec![])),
        ("scatter", Value::Pairs(vec![])),
        ("line", Value::Nums(vec![])),
        ("area", Value::Nums(vec![])),
        ("spark", Value::Nums(vec![])),
    ] {
        let (html, cx) = render_node(&node(name, vec![arg]));
        assert!(
            html.contains("cv-empty-state-empty-state"),
            "{name}: {html}"
        );
        assert!(!html.contains("<svg"), "{name}");
        assert!(cx.used.contains("empty-state"));
    }
}

#[test]
fn edge_data_is_finite() {
    let cases = [
        "bar Q1:0",
        "bar A:0 B:0 C:0",
        "bar A:-5 B:10 C:-20",
        "bar A:1000000000000 B:2000000000000",
        "bar A:0.000001 B:0.000002",
        "line 7",
        "line 0 0 0 0",
        "line -3 5 -8 13",
        "line 1000000000000 2000000000000 500000000000",
        "area 5",
        "area 0 0 0",
        "area -1 -2 -3",
        "area 1000000000000 3",
        "pie A:0 B:0",
        "pie A:1",
        "pie A:-1 B:3",
        "pie A:1e300 B:1e300",
        "scatter 5:5",
        "scatter 1:1 1:1 1:1",
        "scatter 0:0 1000000000000:1000000000000",
        "spark 5",
        "spark 5 5 5",
        "spark 1000000000000 -1000000000000",
        "gauge 0",
        "gauge 1000000000000 max=5",
        "gauge -5",
        "gauge 5 min=5 max=5",
        "gauge 5 sweep=0",
        "gauge 5 ticks=0",
        "bar A:1 width=1 height=1",
    ];
    for src in cases {
        let h = render(src);
        assert!(!h.is_empty(), "{src}");
        assert_finite(&h);
        let b = h.as_bytes();
        let exp = b.windows(3).any(|w| {
            w[0].is_ascii_digit()
                && w[1] == b'e'
                && (w[2].is_ascii_digit() || w[2] == b'+' || w[2] == b'-')
        });
        assert!(!exp, "{src}: exponent in output");
    }
}

#[test]
fn non_finite_input_is_clamped() {
    let nan = Value::Nums(vec![f64::NAN, f64::INFINITY, f64::NEG_INFINITY, 5.0]);
    for name in ["line", "area", "spark"] {
        let (h, _) = render_node(&node(name, vec![nan.clone()]));
        assert_finite(&h);
    }
    let pairs = Value::Pairs(vec![("a".into(), f64::INFINITY), ("b".into(), f64::NAN)]);
    for name in ["bar", "pie", "scatter"] {
        let (h, _) = render_node(&node(name, vec![pairs.clone()]));
        assert_finite(&h);
    }
    let (h, _) = render_node(&node("gauge", vec![Value::Num(f64::NAN)]));
    assert_finite(&h);
}

#[test]
fn curves() {
    let linear = render("line 1 5 2 curve=linear");
    assert!(
        !linear.contains("C") || !linear.contains("d=\"M0,268C"),
        "{linear}"
    );
    let mono = render("line 1 5 2");
    assert!(mono.contains("C"));
    assert_ne!(render("line 1 5 2 curve=step"), mono);
}

#[test]
fn tiny_canvas_never_yields_negative_sizes() {
    for src in [
        "bar A:1 B:2 width=1 height=1",
        "line 1 2 3 width=1 height=1",
        "scatter 1:1 2:2 width=1 height=1",
    ] {
        let h = render(src);
        assert!(
            !h.contains("width=\"-") && !h.contains("height=\"-"),
            "{src}: {h}"
        );
    }
}

#[test]
fn zero_height_bars_are_not_negative() {
    let h = render("bar A:0 B:5");
    assert!(!h.contains("height=\"-"));
}

#[test]
fn single_point_line_is_a_dot_path() {
    let h = render("line 7");
    assert!(h.contains("d=\"M0,"), "{h}");
}

#[test]
fn multi_series_rows() {
    let rows = Value::Rows(vec![
        vec!["Q1".into(), "Q2".into(), "Q3".into()],
        vec!["Rev 12".into(), "18".into(), "9".into()],
        vec!["Cost 8".into(), "9".into(), "7".into()],
    ]);
    let (h, cx) = render_node(&node("bar", vec![rows.clone()]));
    assert_eq!(h.matches("<rect").count(), 6);
    assert!(h.contains("Rev") && h.contains("Cost"));
    assert!(cx.used.contains("chart-legend"));
    let (l, _) = render_node(&node("line", vec![rows.clone()]));
    assert_eq!(l.matches("data-series").count(), 2);
    assert!(l.contains(">Q1<"));
    assert_finite(&h);
    assert_finite(&l);
}

#[test]
fn bar_horizontal_and_stacked() {
    let mut n = node(
        "bar",
        vec![Value::Rows(vec![
            vec!["A".into(), "B".into()],
            vec!["X 3".into(), "4".into()],
            vec!["Y 2".into(), "1".into()],
        ])],
    );
    n.props = vec![("mode", Value::Str("stacked".into()))];
    let (stacked, _) = render_node(&n);
    assert_finite(&stacked);
    n.props = vec![("orientation", Value::Str("horizontal".into()))];
    let (horiz, _) = render_node(&n);
    assert_finite(&horiz);
    assert_ne!(stacked, horiz);
    n.props = vec![("mode", Value::Str("percent".into()))];
    let (pct, _) = render_node(&n);
    assert_finite(&pct);
    assert!(pct.contains(">100%<"), "{pct}");
}

#[test]
fn tick_label_formats() {
    let h = render("bar A:1500 B:2500");
    assert!(h.contains(">2,000<"), "thousands grouped: {h}");
}

#[test]
fn denormal_domain_does_not_panic() {
    let h = render("scatter 5e-324:1e-323 1e-323:-27.8 1e-323:1");
    assert_finite(&h);
}
