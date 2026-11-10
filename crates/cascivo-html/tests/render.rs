use cascivo_html::{Options, render};

fn doc(src: &str) -> String {
    render(src, &Options::default()).unwrap_or_else(|e| panic!("{e:?}"))
}

fn assert_minimal_document(h: &str) {
    assert!(h.starts_with("<!doctype html>"));
    assert!(h.contains("<html lang=\"en\" data-theme=\"light\">"));
    assert!(h.contains("<meta charset=\"utf-8\">"));
    assert!(h.contains("name=\"viewport\""));
    assert!(h.contains("<style>"));
    assert!(h.contains("<body></body>"));
    assert!(h.trim_end().ends_with("</html>"));
    assert!(!h.contains("<script>"));
}

#[test]
fn empty_input_is_minimal_document() {
    assert_minimal_document(&doc(""));
}

#[test]
fn only_comments_is_minimal_document() {
    assert_minimal_document(&doc("# nothing here\n# at all\n"));
}

#[test]
fn only_directives_is_minimal_document() {
    let h = doc("@title \"Hi\"\n@lang de\n");
    assert!(h.contains("<title>Hi</title>"));
    assert!(h.contains("lang=\"de\""));
    assert!(h.contains("<body></body>"));
}

#[test]
fn directive_text_is_escaped() {
    let h = doc("@title \"<b>\\\"x\\\"&</b>\"\n");
    assert!(h.contains("<title>&lt;b&gt;&quot;x&quot;&amp;&lt;/b&gt;</title>"));
    assert!(!h.contains("<b>"));
}

#[test]
fn render_is_deterministic() {
    let src = "cols 2\n  card \"A\"\n  card \"B\"\n    button \"Go\"\n";
    assert_eq!(doc(src), doc(src));
}

#[test]
fn only_used_component_css_is_inlined() {
    let h = doc("card \"A\"\n");
    assert!(h.contains("cv-card-card"));
    assert!(!h.contains("cv-button-"));
    let h = doc("button \"Go\"\n");
    assert!(h.contains("cv-button-"));
    assert!(!h.contains("cv-card-card"));
}

#[test]
fn parse_errors_surface_as_diagnostics() {
    let e = render("crad \"x\"\n", &Options::default()).unwrap_err();
    assert!(e[0].msg.contains("did you mean 'card'"));
}

#[test]
fn threads_agree() {
    let src = "card \"A\"\n  text \"hi\"\n";
    let want = doc(src);
    let hs: Vec<_> = (0..4)
        .map(|_| std::thread::spawn(move || doc(src)))
        .collect();
    for h in hs {
        assert_eq!(h.join().unwrap(), want);
    }
}

#[test]
fn hostile_css_values_fall_back() {
    let h = cascivo_html::render_fragment("flex basis=\"0;display:none\"\n").unwrap();
    assert!(!h.contains("display:none"), "{h}");
    let h = cascivo_html::render_fragment("auto-grid min=\"1px;position:fixed\"\n").unwrap();
    assert!(!h.contains("position:fixed"), "{h}");
}

#[test]
fn user_text_is_escaped() {
    let h = doc("card \"<script>x</script>\"\n  text \"a & \\\"b\\\" <i>\"\n");
    assert!(!h.contains("<script>"), "{h}");
    assert!(h.contains("&lt;script&gt;x&lt;/script&gt;"));
    assert!(h.contains("a &amp; &quot;b&quot; &lt;i&gt;"));
}

#[test]
fn dangerous_urls_are_dropped() {
    let h = cascivo_html::render_fragment("link \"javascript:alert(1)\" \"x\"\n").unwrap();
    assert!(!h.contains("javascript"), "{h}");
    let h = cascivo_html::render_fragment("image \"data:text/html,x\"\n").unwrap();
    assert!(!h.contains("data:text"), "{h}");
    let h = cascivo_html::render_fragment("image x.png width=\"1px;background:red\"\n").unwrap();
    assert!(!h.contains("background"), "{h}");
}

#[test]
fn heading_level_nan_is_safe() {
    let h = cascivo_html::render_fragment("heading level=nan \"x\"\n").unwrap_or_default();
    assert!(!h.contains("<h0"), "{h}");
}
